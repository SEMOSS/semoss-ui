import { beforeEach, describe, expect, it } from "vitest";
import { CSRF } from "../lib/fetch";
import { clearSession, getSessionGeneration, rememberSession } from "./session";

beforeEach(() => {
	clearSession();
	CSRF.isEnabled = false;
});

describe("headless session cookies", () => {
	it("merges cookie updates and removes expired cookies without dropping other names", () => {
		CSRF.cookie = "JSESSIONID=one; route=a=b";
		const headers = new Headers();
		headers.append("Set-Cookie", "JSESSIONID=two; Path=/; HttpOnly");
		headers.append("Set-Cookie", "route=deleted; Max-Age=0");
		headers.append("Set-Cookie", "other=value; Path=/");
		rememberSession(
			new Response(null, { headers }),
			getSessionGeneration(),
			true,
		);
		expect(CSRF.cookie).toBe("JSESSIONID=two; other=value");
	});

	it("retains configuration but forgets tokens and rejects old session updates", () => {
		CSRF.isEnabled = true;
		CSRF.token = "old";
		CSRF.cookie = "JSESSIONID=one";
		const old = getSessionGeneration();
		clearSession();
		rememberSession(
			new Response(null, {
				headers: {
					"Set-Cookie": "JSESSIONID=late",
					"X-CSRF-Token": "late",
				},
			}),
			old,
			true,
		);
		expect(CSRF).toMatchObject({ isEnabled: true, token: "", cookie: "" });
	});
});
