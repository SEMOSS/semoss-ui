import { describe, expect, test } from "vitest";
import { isSignInFailure } from "./connector-sign-in";

describe("isSignInFailure", () => {
	test("spots the backend's login required errors", () => {
		expect(
			isSignInFailure(
				'{"type":"MICROSOFT","message":"Please login to your Microsoft account"}',
			),
		).toBe(true);
		expect(
			isSignInFailure(
				"{type=GOOGLE, message=Please login to your Google account}",
			),
		).toBe(true);
		expect(
			isSignInFailure(
				"GET request to https://graph.microsoft.com/v1.0/me returned HTTP 401. Response body: {}",
			),
		).toBe(true);
	});

	test("leaves other failures alone", () => {
		expect(isSignInFailure("Team ID is required")).toBe(false);
		expect(isSignInFailure(undefined)).toBe(false);
	});
});
