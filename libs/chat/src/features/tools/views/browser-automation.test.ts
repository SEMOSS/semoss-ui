import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getBrowserAutomationScript } from "@semoss/sdk";
import {
	pingBrowserExtension,
	sendPlaywrightScript,
} from "./browser-automation";

vi.mock("@semoss/sdk", async (original) => ({
	...(await original<typeof import("@semoss/sdk")>()),
	getBrowserAutomationScript: vi.fn(),
}));

const mockGetScript = vi.mocked(getBrowserAutomationScript);

/** The room {@link sendPlaywrightScript} reads the script through. */
type PlaywrightRoom = Parameters<typeof sendPlaywrightScript>[0];

/**
 * Posts a message to the window as if from another script.
 *
 * @param data - What the message carries.
 * @param origin - Where it says it came from.
 */
const receive = (data: unknown, origin = window.location.origin): void => {
	window.dispatchEvent(new MessageEvent("message", { data, origin }));
};

describe("pingBrowserExtension", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it("pings the extension and is answered by its pong", async () => {
		const postMessage = vi
			.spyOn(window, "postMessage")
			.mockImplementation(() => undefined);
		const ping = pingBrowserExtension();
		expect(postMessage).toHaveBeenCalledWith(
			expect.objectContaining({ type: "SMSS_EXTENSION_PING" }),
			"*",
		);

		receive({ type: "SMSS_EXTENSION_PONG" });
		await expect(ping).resolves.toBe(true);
	});

	it("ignores other messages and a pong from another origin, then times out", async () => {
		vi.spyOn(window, "postMessage").mockImplementation(() => undefined);
		const removeListener = vi.spyOn(window, "removeEventListener");
		const ping = pingBrowserExtension(2000);

		receive({ type: "SOMETHING_ELSE" });
		receive({ type: "SMSS_EXTENSION_PONG" }, "https://elsewhere.example");
		vi.advanceTimersByTime(1999);
		receive(null);
		vi.advanceTimersByTime(1);

		await expect(ping).resolves.toBe(false);
		expect(removeListener).toHaveBeenCalledWith(
			"message",
			expect.any(Function),
		);
	});

	it("stops waiting once answered", async () => {
		vi.spyOn(window, "postMessage").mockImplementation(() => undefined);
		const ping = pingBrowserExtension();
		receive({ type: "SMSS_EXTENSION_PONG" });
		await ping;
		expect(vi.getTimerCount()).toBe(0);
	});
});

describe("sendPlaywrightScript", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		mockGetScript.mockReset();
	});

	it("reads the script in the room's insight and hands it to the extension", async () => {
		const postMessage = vi
			.spyOn(window, "postMessage")
			.mockImplementation(() => undefined);
		mockGetScript.mockResolvedValue({ steps: [] });
		const runRoomRequest = vi.fn(
			(request: (insightId: string) => Promise<unknown>) =>
				request("insight-1"),
		);

		const output = await sendPlaywrightScript(
			{ runRoomRequest } as unknown as PlaywrightRoom,
			"project-1",
			"login.json",
		);

		expect(mockGetScript).toHaveBeenCalledWith("insight-1", {
			project: "project-1",
			fileName: "login.json",
		});
		expect(runRoomRequest).toHaveBeenCalledWith(expect.any(Function), {
			showLoading: false,
			setErrorOnFail: false,
		});
		expect(postMessage).toHaveBeenCalledWith(
			{
				type: "SMSS_EXEC_PLAYWRIGHT_SCRIPT",
				script: {
					projectId: "project-1",
					name: "login.json",
					autoExecute: false,
					scriptContent: { steps: [] },
				},
			},
			"*",
		);
		expect(output).toBe(
			"Successfully fetched Playwright script: login.json",
		);
	});

	it("sends nothing when the script cannot be read", async () => {
		const postMessage = vi
			.spyOn(window, "postMessage")
			.mockImplementation(() => undefined);
		mockGetScript.mockRejectedValue(new Error("no such file"));

		await expect(
			sendPlaywrightScript(
				{
					runRoomRequest: (
						request: (insightId: string) => Promise<unknown>,
					) => request("insight-1"),
				} as unknown as PlaywrightRoom,
				"project-1",
				"missing.json",
			),
		).rejects.toThrow("no such file");
		expect(postMessage).not.toHaveBeenCalled();
	});
});
