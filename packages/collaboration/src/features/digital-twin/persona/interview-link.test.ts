import { expect, it } from "vitest";
import { personaInterviewPath } from "@/lib/workspace-paths";
import { interviewLink } from "./interview-link";

it("names the way into the interview for where the interview is, behind Digital Twins unless another door is given", () => {
	for (const [interview, label, search] of [
		[undefined, "Start the interview", ""],
		[null, "Start the interview", ""],
		[
			{ answered: 3, of: 11, wrapped: false, done: false },
			"Continue the interview",
			"",
		],
		[
			{ answered: 6, of: 6, wrapped: true, done: true },
			"Keep grilling me",
			"?go=more",
		],
		[
			{ answered: 11, of: 11, wrapped: false, done: true },
			"Open the interview",
			"",
		],
	] as const) {
		// the hub's card and a twin's Profile give no door, and stay under Digital Twins
		expect(interviewLink({ interview })).toEqual({
			label,
			to: `/twins/persona/interview${search}`,
		});
		expect(interviewLink({ interview }, personaInterviewPath)).toEqual({
			label,
			to: `/persona/interview${search}`,
		});
	}
});
