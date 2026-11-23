import { describe, expect, test } from "vitest";
import {
	canChooseAgentMode,
	isAgentModeOnly,
	newChatModes,
	offersAgentMode,
	offersDefaultAgent,
} from "./agent-mode-choice";

describe("agent mode choice", () => {
	test("offers chat alone without an agent mode flag", () => {
		const flags = {};
		expect(newChatModes(flags)).toEqual(["chat"]);
		expect(offersAgentMode(flags)).toBe(false);
		expect(canChooseAgentMode(flags)).toBe(false);
		expect(offersDefaultAgent(flags)).toBe(false);
	});

	test("lets users choose the mode with the agent harness", () => {
		const flags = { enableAgentHarness: true };
		expect(newChatModes(flags)).toEqual(["chat", "agent"]);
		expect(canChooseAgentMode(flags)).toBe(true);
		expect(offersDefaultAgent(flags)).toBe(true);
	});

	test("lets the agent picker decide the mode, with No Agent for chat", () => {
		const flags = { enableAgentHarness: true, modeFollowsAgent: true };
		expect(newChatModes(flags)).toEqual(["chat", "agent"]);
		expect(canChooseAgentMode(flags)).toBe(false);
		expect(offersDefaultAgent(flags)).toBe(false);
	});

	test("offers agent mode alone, with Default Agent, where every chat runs in it", () => {
		for (const flags of [
			{ agentModeOnly: true },
			{ agentModeOnly: true, enableAgentHarness: true },
			{ agentModeOnly: true, modeFollowsAgent: true },
		]) {
			expect(isAgentModeOnly(flags)).toBe(true);
			expect(newChatModes(flags)).toEqual(["agent"]);
			expect(offersAgentMode(flags)).toBe(true);
			expect(canChooseAgentMode(flags)).toBe(false);
			expect(offersDefaultAgent(flags)).toBe(true);
		}
	});
});
