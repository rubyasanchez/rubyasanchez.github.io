// Ruby's latest Strava activity (any type, anything not private), fetched once at build time.
//
// The deploy workflow passes these three keys from GitHub secrets and rebuilds the site daily:
//   STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN
// Put the same keys in a local .env to see real data in dev. Without them (or if Strava is down)
// getLatestWorkout() returns null and the card falls back to its static version.

export type Workout = {
	kind: "run" | "ride" | "swim" | "other";
	name: string;
	/** "Sep 27" */
	date: string;
	stats: { value: string; unit: string }[];
	/** Route drawn in a 120×70 box, or null for activities without GPS (pool swims, treadmill runs) */
	route: { d: string; start: [number, number]; end: [number, number] } | null;
};

const KINDS: Record<string, Workout["kind"]> = {
	Run: "run",
	TrailRun: "run",
	VirtualRun: "run",
	Ride: "ride",
	GravelRide: "ride",
	MountainBikeRide: "ride",
	VirtualRide: "ride",
	EBikeRide: "ride",
	Swim: "swim",
};

type StravaActivity = {
	name: string;
	sport_type: string;
	private: boolean;
	visibility?: string;
	distance: number; // meters
	moving_time: number; // seconds
	total_elevation_gain: number; // meters
	start_date_local: string;
	map?: { summary_polyline?: string };
};

let cached: Promise<Workout | null> | undefined;

export function getLatestWorkout() {
	cached ??= fetchLatest().catch((error) => {
		console.warn(`[strava] Couldn't load the latest workout, using the fallback card: ${error}`);
		return null;
	});
	return cached;
}

async function fetchLatest(): Promise<Workout | null> {
	// Local .env arrives via import.meta.env; CI secrets arrive as real process env vars
	const processEnv = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env;
	const env = { ...import.meta.env, ...processEnv };
	const { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN } = env;
	if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET || !STRAVA_REFRESH_TOKEN) return null;

	const tokenRes = await fetch("https://www.strava.com/oauth/token", {
		method: "POST",
		body: new URLSearchParams({
			client_id: STRAVA_CLIENT_ID,
			client_secret: STRAVA_CLIENT_SECRET,
			grant_type: "refresh_token",
			refresh_token: STRAVA_REFRESH_TOKEN,
		}),
	});
	if (!tokenRes.ok) throw new Error(`token refresh failed (${tokenRes.status})`);
	const { access_token } = await tokenRes.json();

	const res = await fetch("https://www.strava.com/api/v3/athlete/activities?per_page=10", {
		headers: { Authorization: `Bearer ${access_token}` },
	});
	if (!res.ok) throw new Error(`activities request failed (${res.status})`);
	const activities: StravaActivity[] = await res.json();

	// Followers-only is fine; anything private or "only me" stays hidden
	const latest = activities.find((a) => !a.private && a.visibility !== "only_me");
	return latest ? toWorkout(latest) : null;
}

function toWorkout(a: StravaActivity): Workout {
	const kind = KINDS[a.sport_type] ?? "other";
	const miles = a.distance / 1609.344;
	const feet = Math.round(a.total_elevation_gain * 3.28084);
	const stats: Workout["stats"] = [];

	if (kind === "swim") {
		const yards = a.distance * 1.09361;
		stats.push({ value: Math.round(yards).toLocaleString("en-US"), unit: "yd" });
		stats.push({ value: duration(a.moving_time), unit: "time" });
		if (yards > 0) stats.push({ value: clock(a.moving_time / (yards / 100)), unit: "/100yd" });
	} else {
		// Gym sessions (weights, stair stepper…) have no distance, so they just show time
		if (a.distance > 0) stats.push({ value: miles.toFixed(1), unit: "mi" });
		stats.push({ value: duration(a.moving_time), unit: "time" });
		if (kind === "run" && miles > 0) stats.push({ value: clock(a.moving_time / miles), unit: "/mi" });
		else if (feet > 0) stats.push({ value: feet.toLocaleString("en-US"), unit: "ft climbed" });
	}

	return {
		kind,
		name: a.name,
		// start_date_local is already local time, so format it as-is
		date: new Date(a.start_date_local).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
		stats,
		route: a.map?.summary_polyline ? drawRoute(a.map.summary_polyline) : null,
	};
}

/** 5400 → "1h 30m", 1500 → "25m" */
function duration(seconds: number) {
	const h = Math.floor(seconds / 3600);
	const m = Math.round((seconds % 3600) / 60);
	return h ? `${h}h ${m}m` : `${m}m`;
}

/** 512 → "8:32" */
function clock(seconds: number) {
	const s = Math.round(seconds);
	return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * Turns an encoded polyline into an SVG path that fits a 120×70 box. Only the shape is kept,
 * never coordinates, and the first and last stretch are trimmed so the route can't point to
 * where a workout starts or ends.
 */
export function drawRoute(polyline: string): Workout["route"] {
	let points = decodePolyline(polyline);
	const trim = Math.floor(points.length * 0.1);
	points = points.slice(trim, points.length - trim);
	if (points.length < 2) return null;

	// Flatten lat/lng to x/y, squeezing longitude by latitude so the shape isn't stretched
	const cos = Math.cos((points[0][0] * Math.PI) / 180);
	const xy = points.map(([lat, lng]) => [lng * cos, -lat]);
	const xs = xy.map((p) => p[0]);
	const ys = xy.map((p) => p[1]);
	const [minX, minY] = [Math.min(...xs), Math.min(...ys)];
	const spanX = Math.max(...xs) - minX || 1e-9;
	const spanY = Math.max(...ys) - minY || 1e-9;

	const [w, h, pad] = [120, 70, 5];
	const scale = Math.min((w - 2 * pad) / spanX, (h - 2 * pad) / spanY);
	const offX = (w - spanX * scale) / 2;
	const offY = (h - spanY * scale) / 2;

	const step = Math.max(1, Math.ceil(xy.length / 150));
	const fitted = xy
		.filter((_, i) => i % step === 0 || i === xy.length - 1)
		.map(([x, y]) => [+(offX + (x - minX) * scale).toFixed(1), +(offY + (y - minY) * scale).toFixed(1)] as [number, number]);

	return {
		d: fitted.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" "),
		start: fitted[0],
		end: fitted[fitted.length - 1],
	};
}

/** Google's encoded polyline format, which Strava uses for route maps */
export function decodePolyline(encoded: string) {
	const points: [number, number][] = [];
	let [i, lat, lng] = [0, 0, 0];
	while (i < encoded.length) {
		for (const axis of [0, 1]) {
			let [shift, result, byte] = [0, 0, 0];
			do {
				byte = encoded.charCodeAt(i++) - 63;
				result |= (byte & 0x1f) << shift;
				shift += 5;
			} while (byte >= 0x20);
			const delta = result & 1 ? ~(result >> 1) : result >> 1;
			if (axis === 0) lat += delta;
			else lng += delta;
		}
		points.push([lat / 1e5, lng / 1e5]);
	}
	return points;
}
