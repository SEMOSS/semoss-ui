// @vitest-environment node

import { describe, expect, test, vi } from "vitest";
import {
	createToolCookieJar,
	mergeCookieHeader,
	parseSetCookie,
} from "./tool-cookies";

/** A fixed time, in seconds since 1970. */
const NOW = 1_700_000_000;

describe("parseSetCookie", () => {
	test("reads what the cookie store needs", () => {
		expect(
			parseSetCookie(
				"JSESSIONID=abc; Domain=x.example; Path=/Monolith; HttpOnly; SameSite=Lax; Max-Age=60",
				NOW,
			),
		).toEqual({
			name: "JSESSIONID",
			value: "abc",
			path: "/Monolith",
			httpOnly: true,
			sameSite: "lax",
			expirationDate: NOW + 60,
			isDeleted: false,
		});
		expect(parseSetCookie("a=b=c; SameSite=None", NOW)).toMatchObject({
			name: "a",
			value: "b=c",
			sameSite: "no_restriction",
			httpOnly: false,
			path: undefined,
		});
	});

	test("knows a deleted cookie, and ignores one with no name", () => {
		expect(parseSetCookie("a=; Max-Age=0", NOW)?.isDeleted).toBe(true);
		expect(
			parseSetCookie("a=; Expires=Thu, 01 Jan 1970 00:00:00 GMT", NOW)
				?.isDeleted,
		).toBe(true);
		// Max-Age wins over Expires
		expect(
			parseSetCookie(
				"a=1; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=10",
				NOW,
			)?.isDeleted,
		).toBe(false);
		expect(parseSetCookie("=x", NOW)).toBeNull();
		expect(parseSetCookie("novalue", NOW)).toBeNull();
	});
});

describe("mergeCookieHeader", () => {
	test("puts the app's cookies first, and a tool can never replace one", () => {
		expect(
			mergeCookieHeader(
				[{ name: "JSESSIONID", value: "user" }],
				"JSESSIONID=attacker; theme=dark",
			),
		).toBe("JSESSIONID=user; theme=dark");
		expect(mergeCookieHeader([], undefined)).toBe("");
	});
});

describe("createToolCookieJar", () => {
	test("reads and keeps cookies in the session in use", async () => {
		const cookies = {
			get: vi.fn(async () => [{ name: "JSESSIONID", value: "user" }]),
			set: vi.fn(async () => undefined),
			remove: vi.fn(async () => undefined),
		};
		const jar = createToolCookieJar(() => ({ cookies }) as never);
		const url = "http://127.0.0.1:4321/Monolith/api/config";
		await expect(jar.header(url, "theme=dark")).resolves.toBe(
			"JSESSIONID=user; theme=dark",
		);
		expect(cookies.get).toHaveBeenCalledWith({ url });

		await jar.store(url, [
			"a=1; Path=/Monolith; Max-Age=60",
			"b=; Max-Age=0",
			"c=; Path=/Other; Max-Age=0",
		]);
		expect(cookies.set).toHaveBeenCalledWith(
			expect.objectContaining({
				url,
				name: "a",
				value: "1",
				path: "/Monolith",
			}),
		);
		expect(cookies.remove).toHaveBeenCalledWith(url, "b");
		// only the cookie at the path the server named
		expect(cookies.remove).toHaveBeenCalledWith(
			"http://127.0.0.1:4321/Other",
			"c",
		);
	});
});
