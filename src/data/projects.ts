export type Project = {
	slug: string;
	title: string;
	subtitle: string;
	summary: string;
	impact: string;
	tags: string[];
};

export const projects: Project[] = [
	{
		slug: "datashare",
		title: "DataShare",
		subtitle: "Platform Redesign",
		summary:
			"Redesigned the information architecture and visual system for a Santa Cruz County data platform to improve navigation and reduce cognitive load, grounded in user research and usability testing.",
		impact:
			"[PLACEHOLDER: quantified result, e.g. \"Cut average task completion time by X% across usability sessions\"]",
		tags: ["UX Research", "Information Architecture", "Usability Testing"],
	},
	{
		slug: "compass",
		title: "Compass",
		subtitle: "AI Mentorship Tool",
		summary:
			"Took an AI-supported mentorship platform from early wireframes through high-fidelity prototypes, designing and iterating on the core interaction model.",
		impact:
			"[PLACEHOLDER: quantified result, e.g. \"Validated interaction model across X rounds of user testing with Y participants\"]",
		tags: ["Interaction Design", "Prototyping", "AI/UX"],
	},
	{
		slug: "tech4good-lab",
		title: "Tech4Good Lab",
		subtitle: "Lab Operations & Literature Review",
		summary:
			"Led research teams across AI, design, and web projects, building leadership and workflow systems that improved cross-lab communication and collaboration.",
		impact:
			"[PLACEHOLDER: quantified result, e.g. \"Directed X researchers across Y concurrent projects over Z terms\"]",
		tags: ["Research Ops", "Leadership", "Literature Review"],
	},
];
