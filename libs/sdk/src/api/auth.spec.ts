import { beforeEach, describe, expect, it, vi } from "vitest";
import { Env } from "../env";
import { CSRF } from "../utility";
import { isAdminUser, registerUser, setUserMetadata } from "./auth";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

beforeEach(() => {
	fetchMock.mockReset();
	Env.update({ MODULE: "http://localhost:9090/Monolith", CSRF: false });
	CSRF.isEnabled = false;
	CSRF.token = "";
});

describe("session authentication transports", () => {
	it("registers with the backend field names", async () => {
		fetchMock.mockResolvedValueOnce(
			new Response("{}", {
				status: 200,
				headers: { "content-type": "application/json" },
			}),
		);

		await registerUser({
			name: "Ada Lovelace",
			username: "ada",
			email: "ada@example.test",
			password: "secret",
			phone: "5551234",
			phoneExtension: "9",
			countryCode: "1",
		});

		const [url, options] = fetchMock.mock.calls[0];
		expect(url).toBe("http://localhost:9090/Monolith/api/auth/createUser");
		expect(Object.fromEntries(new URLSearchParams(options.body))).toEqual({
			name: "Ada Lovelace",
			username: "ada",
			email: "ada@example.test",
			password: "secret",
			phone: "5551234",
			phoneextension: "9",
			countrycode: "1",
		});
	});

	it("reads the current administrator status", async () => {
		fetchMock.mockResolvedValueOnce(
			new Response("true", {
				status: 200,
				headers: { "content-type": "application/json" },
			}),
		);

		await expect(isAdminUser()).resolves.toBe(true);
		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:9090/Monolith/api/auth/admin/user/isAdminUser",
			expect.objectContaining({ method: "GET" }),
		);
	});

	it("updates one raw user metadata value", async () => {
		fetchMock.mockResolvedValueOnce(
			new Response("{}", {
				status: 200,
				headers: { "content-type": "application/json" },
			}),
		);

		await setUserMetadata("text-generation-model", "model-1");

		const [url, options] = fetchMock.mock.calls[0];
		expect(url).toBe(
			"http://localhost:9090/Monolith/api/auth/user/setUserMetadata",
		);
		expect(Object.fromEntries(new URLSearchParams(options.body))).toEqual({
			metaKey: "text-generation-model",
			metaValue: "model-1",
		});
	});
});
