import { expect, it } from "vitest";
import { turnErrorSummary } from "./turn-error";

it("summarizes a provider status code and keeps short errors as they are", () => {
	expect(
		turnErrorSummary(
			"Error code: 400 - {'error': {'message': '239 validation errors: ...'}}",
		),
	).toBe("The model rejected this request (400).");
	expect(turnErrorSummary("Error code: 503 - upstream")).toBe(
		"The model service failed (503). Try again in a moment.",
	);
	expect(turnErrorSummary("Run was cancelled")).toBe("Run was cancelled");
	expect(turnErrorSummary("x".repeat(400))).toHaveLength(160);
});
