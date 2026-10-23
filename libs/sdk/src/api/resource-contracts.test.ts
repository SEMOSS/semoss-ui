import {
	afterEach,
	beforeEach,
	describe,
	expect,
	expectTypeOf,
	it,
	vi,
} from "vitest";
import { Env } from "../env";
import { CSRF, clearSession } from "../utility/session";
import { setInitialAdmins } from "./adminconfig/adminconfig";
import { uploadApp } from "./app";
import { uploadEngine } from "./engine";
import { upload } from "./file";
import { installations } from "./github/github";
import { newUrl } from "./github/manifest";
import { ready } from "./health/health";
import { uploadInsight } from "./insight";
import {
	login,
	modifyLoginProperties,
	samlIdpUrl,
	samlSpUrl,
} from "./monolith/auth";
import { type A2ATask, rpc, rpcSse } from "./monolith/ext/a2a";
import { cleanSession, insightSocketUrl } from "./monolith/session";
import { subscribe } from "./msgraph/msgraph";
import { getTokenPost } from "./token/token";
import { uploadUser } from "./user";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
	Env.update({
		MODULE: "https://example.test/Monolith/",
		CSRF: false,
		HEADLESS: false,
	});
	clearSession();
	fetchMock.mockReset();
	vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

describe("servlet resource contracts", () => {
	it("keeps missing GitHub installation metadata absent", async () => {
		const payload = {
			status: "ok",
			installations: [{ installationId: 7, suspended: false }],
		} as const;
		fetchMock.mockResolvedValueOnce(Response.json(payload));
		const result = await installations({ projectId: "p/a & b" });
		expect(result).toEqual(payload);
		expectTypeOf(result.installations[0]?.account).toEqualTypeOf<
			string | undefined
		>();
		expectTypeOf(
			result.installations[0]?.repositorySelection,
		).toEqualTypeOf<string | undefined>();
		expect(fetchMock.mock.calls[0]?.[0]).toBe(
			"https://example.test/Monolith/github/install/installations?projectId=p%2Fa+%26+b",
		);
	});

	it("encodes login defaults and JSON-valued form parameters", async () => {
		fetchMock.mockResolvedValueOnce(
			Response.json({ success: "true", username: "a&b" }),
		);
		await login({ username: "a&b", password: "p=+" });
		let form = new URLSearchParams(
			String(fetchMock.mock.calls[0]?.[1]?.body),
		);
		expect(Object.fromEntries(form)).toEqual({
			username: "a&b",
			password: "p=+",
			disableRedirect: "true",
		});
		fetchMock.mockResolvedValueOnce(Response.json(true));
		await modifyLoginProperties({
			provider: "custom/a",
			modifications: { scope: "a+b & c" },
		});
		form = new URLSearchParams(String(fetchMock.mock.calls[1]?.[1]?.body));
		expect(JSON.parse(form.get("modifications") ?? "null")).toEqual({
			scope: "a+b & c",
		});
		expect(fetchMock.mock.calls[1]?.[0]).toBe(
			"https://example.test/Monolith/api/auth/modifyLoginProperties/custom%2Fa",
		);
	});

	it("uses the dedicated Graph, token, and admin servlets", async () => {
		for (const [call, endpoint, fields] of [
			[
				() => subscribe({ resource: "me/messages", minutes: 0 }),
				"msgraph/subscribe",
				{ resource: "me/messages", minutes: "0" },
			],
			[
				() => getTokenPost({ client_id: "client", secret_key: "a&b" }),
				"token/getToken",
				{ client_id: "client", secret_key: "a&b" },
			],
			[
				() => setInitialAdmins({ ids: ["a", "b"] }),
				"adminconfig/setInitialAdmins",
				{ ids: '["a","b"]' },
			],
		] as const) {
			fetchMock.mockResolvedValueOnce(Response.json({}));
			await call();
			const [target, options] = fetchMock.mock.calls.at(-1) ?? [];
			expect(target).toBe(`https://example.test/Monolith/${endpoint}`);
			expect(options?.method).toBe("POST");
			expect(
				Object.fromEntries(new URLSearchParams(String(options?.body))),
			).toEqual(fields);
		}
		fetchMock.mockResolvedValueOnce(
			Response.json({ status: "READY", startupComplete: true }),
		);
		await expect(ready()).resolves.toEqual({
			status: "READY",
			startupComplete: true,
		});
		expect(fetchMock.mock.calls.at(-1)?.[0]).toBe(
			"https://example.test/Monolith/health/ready",
		);
	});

	it("clears a cleaned session even when the backend omits output", async () => {
		CSRF.token = "old-session";
		fetchMock.mockResolvedValueOnce(Response.json({}));
		await expect(cleanSession()).resolves.toEqual({});
		expect(CSRF.token).toBe("");
	});

	it("builds encoded SAML, manifest, and insight WebSocket URLs", () => {
		expect(samlIdpUrl({ redirect: "https://app.test/a?b=c" })).toBe(
			"https://example.test/Monolith/IdpSSOServlet?redirect=https%3A%2F%2Fapp.test%2Fa%3Fb%3Dc",
		);
		expect(samlSpUrl({ metaAlias: "/sp", idpEntityID: "urn:a&b" })).toBe(
			"https://example.test/Monolith/SPSSOServlet?metaAlias=%2Fsp&idpEntityID=urn%3Aa%26b",
		);
		expect(newUrl({ name: "My App", public: false })).toBe(
			"https://example.test/Monolith/github/manifest/new?name=My+App&public=false",
		);
		expect(insightSocketUrl({ insightId: "i/&" })).toBe(
			"wss://example.test/Monolith/insightSocket?insightId=i%2F%26",
		);
		Env.update({ MODULE: "/Monolith" });
		expect(insightSocketUrl({ insightId: "i" })).toBe(
			"/Monolith/insightSocket?insightId=i",
		);
	});

	it("preserves A2A enum names, omitted ids, and JSON versus SSE negotiation", async () => {
		const task: A2ATask = {
			id: "run",
			contextId: "room",
			status: { state: "TASK_STATE_WORKING" },
			artifacts: [],
			history: [],
			metadata: { semossStatus: "RUNNING" },
		};
		fetchMock.mockResolvedValueOnce(
			Response.json({ jsonrpc: "2.0", result: task }),
		);
		const result = await rpc({
			workspaceId: "w/a",
			id: null,
			method: "GetTask",
			params: { id: "run" },
		});
		expect(result.id).toBeUndefined();
		expect(result.result).toEqual(task);
		expect(fetchMock.mock.calls[0]?.[0]).toBe(
			"https://example.test/Monolith/api/ext/a2a/workspace/w%2Fa/rpc",
		);
		expect(
			new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get("accept"),
		).toBe("application/json");
		expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
			id: null,
			method: "GetTask",
			params: { id: "run" },
		});
		const response = new Response(
			'event: task\ndata: {"jsonrpc":"2.0"}\n\n',
			{ headers: { "content-type": "text/event-stream" } },
		);
		fetchMock.mockResolvedValueOnce(response);
		await expect(
			rpcSse({
				workspaceId: "w/a",
				method: "SubscribeToTask",
				params: { id: "run" },
			}),
		).resolves.toBe(response.body);
		expect(
			new Headers(fetchMock.mock.calls[1]?.[1]?.headers).get("accept"),
		).toBe("text/event-stream");
	});
});

it("preserves legacy upload results while encoding ids and omitting null insight ids", async () => {
	const file = new File(["example"], "a.txt");
	const payload = [{ fileName: "a.txt", fileLocation: "folder/a.txt" }];
	const calls = [
		() => uploadApp("a&b", "folder/&", file, null),
		() => uploadEngine("a&b", "folder/&", file, null),
		() => uploadUser("folder/&", file, null),
		() => uploadInsight(null, "folder/&", file),
	];
	for (const call of calls) {
		const response = Response.json(payload);
		fetchMock.mockResolvedValueOnce(response);
		await expect(call()).resolves.toEqual({ response, data: payload });
		const [target, options] = fetchMock.mock.calls.at(-1) ?? [];
		const parsed = new URL(String(target));
		expect(parsed.searchParams.has("insightId")).toBe(false);
		expect(parsed.searchParams.get("path")).toBe("folder/&");
		expect(options?.body).toBeInstanceOf(FormData);
		expect((options?.body as FormData).getAll("file")).toHaveLength(1);
	}
	fetchMock.mockResolvedValueOnce(Response.json(payload));
	await expect(upload(file, "i&b", "p/a", "folder/&")).resolves.toEqual(
		payload,
	);
	const parsed = new URL(String(fetchMock.mock.calls.at(-1)?.[0]));
	expect(Object.fromEntries(parsed.searchParams)).toEqual({
		insightId: "i&b",
		projectId: "p/a",
		path: "folder/&",
	});
});
