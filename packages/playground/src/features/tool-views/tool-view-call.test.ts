import { describe, expect, it } from "vitest";
import type { ToolStore } from "@/stores/tool/tool.store";
import { toToolViewCall, toToolViewMode } from "./tool-view-call";

const toolWith = (
	overrides: Record<string, unknown> = {},
	roomMode: "chat" | "agent" = "chat",
): ToolStore =>
	({
		id: "call-1",
		status: "INITIAL",
		response: "",
		parameters: { to: ["ada@example.com"] },
		pendingAction: null,
		message: {},
		room: { mode: roomMode },
		json: {
			name: "send_mail",
			original_name: "",
			_meta: {
				SMSS_FUNCTION_NAME: "GoogleGmailSendMail",
				SMSS_MCP_EXECUTION: "ask",
			},
		},
		...overrides,
	}) as unknown as ToolStore;

describe("toToolViewCall", () => {
	it("names the reactor the call runs, with its arguments", () => {
		expect(toToolViewCall(toolWith())).toEqual({
			id: "call-1",
			functionName: "GoogleGmailSendMail",
			arguments: { to: ["ada@example.com"] },
			result: undefined,
			status: "pending",
		});
	});

	it("gives a failed call's details without the model's guidance", () => {
		expect(
			toToolViewCall(
				toolWith({
					status: "ERROR",
					response:
						"Tell the user it failed.\n\nError Details: HTTP 403",
				}),
			),
		).toMatchObject({ status: "failed", result: "HTTP 403" });
		expect(
			toToolViewCall(
				toolWith({ status: "SUCCESS", response: '{"sent":true}' }),
			),
		).toMatchObject({ status: "succeeded", result: '{"sent":true}' });
		expect(toToolViewCall(toolWith({ status: "CANCELLED" })).status).toBe(
			"declined",
		);
	});
});

describe("toToolViewMode", () => {
	it("asks while a chat call that asks has not run", () => {
		expect(toToolViewMode(toolWith())).toBe("approval");
		expect(toToolViewMode(toolWith({ status: "LOADING" }))).toBe("result");
		expect(
			toToolViewMode(
				toolWith({
					json: {
						name: "list_mail",
						_meta: { SMSS_MCP_EXECUTION: "auto" },
					},
				}),
			),
		).toBe("result");
	});

	it("asks in an agent run only while the run waits on the call", () => {
		expect(toToolViewMode(toolWith({}, "agent"))).toBe("result");
		expect(
			toToolViewMode(
				toolWith({ pendingAction: { actionId: "a" } }, "agent"),
			),
		).toBe("approval");
	});
});
