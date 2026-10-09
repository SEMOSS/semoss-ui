import { expect, it } from "vitest";
import { readToolResponseDetail } from "./tool-response-detail";

it("shows a failed or stopped call's details without the guidance around them", () => {
	expect(
		readToolResponseDetail(
			"The tool failed. Tell the user.\n\nError Details: HTTP 403",
		),
	).toBe("HTTP 403");
	expect(
		readToolResponseDetail("Stopped.\n\nCancellation Details: by the user"),
	).toBe("by the user");
	expect(readToolResponseDetail('{"sent":true}')).toBe('{"sent":true}');
});
