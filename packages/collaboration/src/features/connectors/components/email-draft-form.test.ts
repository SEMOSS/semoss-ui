import { answerSubject } from "./email-draft-form";

it("shows the subject Outlook gives a reply or forward, prefixed once", () => {
	expect(answerSubject("reply", "Cert challenge")).toBe("RE: Cert challenge");
	expect(answerSubject("reply", "Re: Cert challenge")).toBe(
		"Re: Cert challenge",
	);
	expect(answerSubject("forward", "Cert challenge")).toBe(
		"FW: Cert challenge",
	);
	expect(answerSubject("forward", "Fwd: Cert challenge")).toBe(
		"Fwd: Cert challenge",
	);
	// a forwarded reply keeps both, as Outlook does
	expect(answerSubject("forward", "RE: Cert challenge")).toBe(
		"FW: RE: Cert challenge",
	);
});
