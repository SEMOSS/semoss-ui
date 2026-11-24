import { expect, it } from "vitest";
import { answerSubject, replySubjectOverride } from "./answer-subject";

it("adds the prefix Outlook adds, once", () => {
	expect(answerSubject("reply", "Budget")).toBe("RE: Budget");
	expect(answerSubject("reply", "re: Budget")).toBe("re: Budget");
	expect(answerSubject("forward", "Budget")).toBe("FW: Budget");
});

it("treats the original and the prefixed subject as no change", () => {
	expect(replySubjectOverride("RE: Budget", "Budget")).toBeUndefined();
	expect(replySubjectOverride("Budget", "Budget")).toBeUndefined();
	expect(replySubjectOverride("  ", "Budget")).toBeUndefined();
	expect(replySubjectOverride("testing draft ", "Budget")).toBe(
		"testing draft",
	);
});
