import { describe, expect, test } from "vitest";
import {
	canChooseAgentMode,
	newChatModes,
	offersAgentMode,
	offersDefaultAgent,
} from "./agent-mode-choice";

describe("agent mode choice", () => {
	test("offers chat alone where agent mode is not offered", () => {
		expect(newChatModes("chat-only")).toEqual(["chat"]);
		expect(offersAgentMode("chat-only")).toBe(false);
		expect(canChooseAgentMode("chat-only")).toBe(false);
		expect(offersDefaultAgent("chat-only")).toBe(false);
	});

	test("lets users choose the mode with the Chat and Agent choice", () => {
		expect(newChatModes("choice")).toEqual(["chat", "agent"]);
		expect(canChooseAgentMode("choice")).toBe(true);
		expect(offersDefaultAgent("choice")).toBe(true);
	});

	test("lets the agent picker decide the mode, with No Agent for chat", () => {
		expect(newChatModes("follows-agent")).toEqual(["chat", "agent"]);
		expect(canChooseAgentMode("follows-agent")).toBe(false);
		expect(offersDefaultAgent("follows-agent")).toBe(false);
	});

	test("offers agent mode alone, with Default Agent, where every chat runs in it", () => {
		expect(newChatModes("agent-only")).toEqual(["agent"]);
		expect(offersAgentMode("agent-only")).toBe(true);
		expect(canChooseAgentMode("agent-only")).toBe(false);
		expect(offersDefaultAgent("agent-only")).toBe(true);
	});
});
