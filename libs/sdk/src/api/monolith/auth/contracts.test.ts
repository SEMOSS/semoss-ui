import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Env } from "../../../env";
import { setPlatformDefault } from "./admin/model-usage";
import { getProjectsPost } from "./admin/project";
import { editEngineUserPermission } from "./engine";
import { getUsageLimitPath } from "./permission-batch";
import { getProjectUsersNoCredentials } from "./project";
import { deleteUser } from "./user";

const fetchMock = vi.fn<typeof fetch>();

/** Return one JSON response through the real SDK route transport. */
function answer(data: unknown): void {
	fetchMock.mockResolvedValueOnce(
		new Response(JSON.stringify(data), {
			status: 200,
			headers: { "content-type": "application/json" },
		}),
	);
}

/** Read the form the endpoint will receive. */
function sentForm(): URLSearchParams {
	expect(fetchMock).toHaveBeenCalledTimes(1);
	const body = fetchMock.mock.calls[0]?.[1]?.body;
	if (typeof body !== "string") throw new Error("Expected a form body");
	return new URLSearchParams(body);
}

describe("Monolith authorization contracts", () => {
	beforeEach(() => {
		fetchMock.mockReset();
		vi.stubGlobal("fetch", fetchMock);
		Env.update({
			MODULE: "https://example.test/Monolith",
			CSRF: false,
			ACCESS_KEY: "",
			SECRET_KEY: "",
			BEARER_TOKEN: "",
			BEARER_PROVIDER: "",
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("repeats project filters but JSON-encodes creator and metadata fields", async () => {
		answer([]);
		await getProjectsPost({
			projectId: ["one", "two"],
			effectivePermissions: [1, 3],
			metaKeys: ["tag", "label"],
			createdBy: [{ id: "person", type: "NATIVE" }],
			metaFilters: { tag: ["finance"] },
		});
		const form = sentForm();
		expect(form.getAll("projectId")).toEqual(["one", "two"]);
		expect(form.getAll("effectivePermissions")).toEqual(["1", "3"]);
		expect(form.getAll("metaKeys")).toEqual(["tag", "label"]);
		expect(JSON.parse(form.get("createdBy") ?? "null")).toEqual([
			{ id: "person", type: "NATIVE" },
		]);
		expect(JSON.parse(form.get("metaFilters") ?? "null")).toEqual({
			tag: ["finance"],
		});
	});

	it("distinguishes retaining a grant's model limit from explicitly removing it", async () => {
		answer({ success: true });
		await editEngineUserPermission({
			engineId: "model",
			id: "person",
			permission: "READ_ONLY",
		});
		expect(sentForm().has("usageLimit")).toBe(false);
		fetchMock.mockClear();
		answer({ success: true });
		await editEngineUserPermission({
			engineId: "model",
			id: "person",
			permission: "READ_ONLY",
			usageLimit: null,
		});
		expect(sentForm().get("usageLimit")).toBe("null");
	});

	it("removes a platform limit using JSON null and preserves the absent response field", async () => {
		answer({});
		await expect(setPlatformDefault({ usageLimit: null })).resolves.toEqual(
			{},
		);
		expect(sentForm().get("usageLimit")).toBe("null");
	});

	it("preserves raw configuration-dependent directory fields", async () => {
		const users = [{ type: "MICROSOFT", id: 42, name: ["custom mapping"] }];
		answer(users);
		await expect(
			getProjectUsersNoCredentials({
				projectId: "project",
				searchTerm: "Ada & Grace",
				msGraphLookup: true,
			}),
		).resolves.toEqual(users);
		const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
		expect(url.pathname).toBe(
			"/Monolith/api/auth/project/getProjectUsersNoCredentials",
		);
		expect(url.searchParams.get("searchTerm")).toBe("Ada & Grace");
	});

	it("leaves hidden usage-path rules absent", async () => {
		const path = {
			engineId: "model",
			person: { id: "person", type: "NATIVE" },
			ceilings: [],
			steps: [
				{
					layer: "BILLED",
					limitType: "ALL_MODELS",
					state: "DEFINED",
					unlimited: false,
					rulesHidden: true,
				},
			],
		};
		answer(path);
		await expect(
			getUsageLimitPath({
				engineId: "model",
				userId: "person",
				userType: "NATIVE",
			}),
		).resolves.toEqual(path);
	});

	it("does not fabricate a successful result for the unimplemented account deletion route", async () => {
		fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
		await expect(deleteUser()).resolves.toBeUndefined();
	});
});
