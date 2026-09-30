#!/usr/bin/env bash
# Connects Strava to the About page's workout card: opens Strava's authorize page, catches the
# one-time code on a tiny local server, trades it for a refresh token, and saves the three keys as
# GitHub secrets (and optionally a local .env). Rerun it if the card ever stops updating.
# Nothing secret is printed.
set -euo pipefail

CLIENT_ID=283674
PORT=8723

echo
read -rsp "1) Paste your Client Secret from strava.com/settings/api (hidden as you type), then press Enter: " SECRET
echo
echo
echo "2) Your browser is opening Strava. Click Authorize, then come back here."
open "https://www.strava.com/oauth/authorize?client_id=$CLIENT_ID&response_type=code&redirect_uri=http://localhost:$PORT&approval_prompt=force&scope=activity:read"

# Wait for Strava to redirect back with ?code=…
CODE=$(node -e '
	const http = require("http");
	const server = http.createServer((req, res) => {
		const url = new URL(req.url, "http://localhost");
		const code = url.searchParams.get("code");
		if (!code) return res.end();
		res.setHeader("Content-Type", "text/html");
		res.end("<body style=\"font:18px system-ui;padding:3rem\">Got it ✓ You can close this tab and go back to Terminal.</body>");
		process.stdout.write(code);
		server.close();
		setTimeout(() => process.exit(0), 100);
	}).listen(Number(process.argv[1]));
' "$PORT")

RESPONSE=$(curl -sf -X POST https://www.strava.com/oauth/token \
	-d client_id="$CLIENT_ID" -d client_secret="$SECRET" -d code="$CODE" -d grant_type=authorization_code) || {
	echo "Strava didn't accept that. Double-check the Client Secret (click 'show' on the Strava API page) and rerun."
	exit 1
}
REFRESH=$(node -e 'process.stdout.write(JSON.parse(process.argv[1]).refresh_token)' "$RESPONSE")

echo "3) Saving the keys to GitHub…"
printf %s "$CLIENT_ID" | gh secret set STRAVA_CLIENT_ID
printf %s "$SECRET" | gh secret set STRAVA_CLIENT_SECRET
printf %s "$REFRESH" | gh secret set STRAVA_REFRESH_TOKEN

read -rp "Also save the keys to .env so local dev shows your real workout? [y/N] " LOCAL
if [[ $LOCAL =~ ^[Yy] ]]; then
	touch .env
	grep -v '^STRAVA_' .env > .env.tmp || true
	printf 'STRAVA_CLIENT_ID=%s\nSTRAVA_CLIENT_SECRET=%s\nSTRAVA_REFRESH_TOKEN=%s\n' "$CLIENT_ID" "$SECRET" "$REFRESH" >> .env.tmp
	mv .env.tmp .env
fi

echo "Strava is connected ✓"
