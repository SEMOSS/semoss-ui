import { afterEach, describe, expect, it, vi } from "vitest";
import type { DesktopInstanceProfile } from "@/types";
import { installNativeFetchBridge, request } from "./transport";

const invokeMock = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
	invoke: invokeMock,
}));

const profile: DesktopInstanceProfile = {
	id: "local",
	displayName: "Local SEMOSS",
	endpoint: "",
	module: "/Monolith",
	platformPath: "/SemossWeb/packages/client/dist/",
	allowInsecureHttp: true,
};

describe("desktop HTTP transport", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		invokeMock.mockReset();
	});

	it("uses credentialed fetch for browser and local development requests", async () => {
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockResolvedValue(new Response("{}", { status: 200 }));
		vi.stubGlobal("fetch", fetchMock);

		await request(profile, "/Monolith/api/config", {
			headers: { Accept: "application/json" },
		});

		expect(fetchMock).toHaveBeenCalledWith("/Monolith/api/config", {
			method: undefined,
			headers: { Accept: "application/json" },
			body: undefined,
			credentials: "include",
		});
	});

	it("bridges SDK-style absolute requests through the native transport", async () => {
		const remoteProfile: DesktopInstanceProfile = {
			...profile,
			id: "cfg-workshop",
			endpoint: "https://workshop.cfg.deloitte.com",
			module: "/cfg-ai-dev/Monolith",
			allowInsecureHttp: false,
		};
		vi.stubGlobal("__TAURI_INTERNALS__", {});
		invokeMock.mockResolvedValue({
			status: 200,
			statusText: "OK",
			headers: { "content-type": "application/json" },
			body: '{"ok":true}',
		});

		const uninstall = installNativeFetchBridge(remoteProfile);
		const response = await fetch(
			"https://workshop.cfg.deloitte.com/cfg-ai-dev/Monolith/api/engine/runPixel",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: "expression=GetUserInfo%28%29%3B",
			},
		);
		uninstall();

		expect(await response.json()).toEqual({ ok: true });
		expect(invokeMock).toHaveBeenCalledWith("native_http_request", {
			request: {
				profileId: "cfg-workshop",
				url: "https://workshop.cfg.deloitte.com/cfg-ai-dev/Monolith/api/engine/runPixel",
				method: "POST",
				headers: {
					"content-type": "application/x-www-form-urlencoded",
				},
				body: "expression=GetUserInfo%28%29%3B",
			},
		});
	});
});
