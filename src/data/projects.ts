export type Project = {
	slug: string;
	title: string;
	subtitle: string;
	year: string;
	summary: string;
	impact: string;
	tags: string[];
	image?: string;
	imageAlt?: string;
	/** Unfinished: left off the site until it's ready */
	hidden?: boolean;
};

const allProjects: Project[] = [
	{
		slug: "datashare",
		title: "DataShare",
		subtitle: "Platform Redesign",
		year: "2025",
		summary:
			"Redesigned the information architecture and visual system for a Santa Cruz County data platform to improve navigation and reduce cognitive load, grounded in user research and usability testing.",
		impact: "70% of usability testers preferred the redesign — including 83% of returning users.",
		tags: ["UX Research", "Information Architecture", "Usability Testing"],
		image: "/images/case-studies/datashare/staging-full.jpg",
		imageAlt: "The redesigned DataShare Santa Cruz County homepage",
	},
	{
		slug: "compass",
		title: "Compass",
		subtitle: "AI Mentorship Tool",
		year: "2025",
		summary:
			"Took an AI-supported mentorship platform from early wireframes through high-fidelity prototypes, designing and iterating on the core interaction model.",
		impact:
			"Led a 4-person team from early wireframes to high-fidelity prototypes, feeding directly into the next Compass research paper.",
		tags: ["AI/UX", "Product Thinking", "Design Leadership"],
		image: "/images/case-studies/compass/v2-04-respond.png",
		imageAlt: "Compass response composer: an AI draft the mentor edits and publishes in his own name",
	},
	{
		slug: "tech4good-lab",
		title: "Tech4Good Lab",
		subtitle: "Lab Operations & Literature Review",
		year: "2025–2026",
		summary:
			"Led research teams across AI, design, and web projects, building leadership and workflow systems that improved cross-lab communication and collaboration.",
		impact:
			"[PLACEHOLDER: quantified result, e.g. \"Directed X researchers across Y concurrent projects over Z terms\"]",
		tags: ["Research Ops", "Leadership", "Literature Review"],
		hidden: true,
	},
];

export const projects = allProjects.filter((project) => !project.hidden);
