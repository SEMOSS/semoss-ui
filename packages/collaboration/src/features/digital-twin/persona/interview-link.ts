import { twinPersonaInterviewPath } from "@/lib/workspace-paths";
import type { TwinPersona } from "./api/persona";

/**
 * The way into the interview from wherever a persona is shown, named for
 * where the interview is: not begun, under way, wrapped up early, or done.
 *
 * @param path - The interview's address at the door the persona is shown
 * behind; the one under Digital Twins when left out.
 */
export function interviewLink(
	persona: Pick<TwinPersona, "interview">,
	path: (more?: "more") => string = twinPersonaInterviewPath,
): {
	label: string;
	to: string;
} {
	const interview = persona.interview;
	if (!interview) return { label: "Start the interview", to: path() };
	if (!interview.done) return { label: "Continue the interview", to: path() };
	return interview.wrapped
		? { label: "Keep grilling me", to: path("more") }
		: { label: "Open the interview", to: path() };
}
