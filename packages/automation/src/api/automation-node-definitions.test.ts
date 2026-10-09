import { beforeEach, describe, expect, it, vi } from "vitest";
import { runPixel } from "@semoss/sdk";
import { fetchAutomationNodeDefinitions } from "./automation-node-definitions";

vi.mock("@semoss/sdk", () => ({ runPixel: vi.fn() }));

describe("Automation node catalog", () => {
	beforeEach(() => vi.resetAllMocks());

	it("accepts structured list output fields", async () => {
		const catalog = {
			schemaVersion: 1,
			nodes: [
				{
					type: "trigger.start",
					label: "Start",
					description: "Begins the automation.",
					category: "trigger",
					defaultConfig: {},
					configSchema: {},
					outputSchema: {},
					inputs: [],
					outputs: [],
					defaultCodeMode: "generated",
					requiredPermission: "NONE",
					supportsOutput: false,
					supportsCustomCode: false,
				},
				{
					type: "control.loop",
					label: "Repeat steps",
					description: "Repeats a nested sequence.",
					category: "control",
					defaultConfig: {},
					configSchema: {},
					outputSchema: {
						results: {
							type: "object[]",
							label: "Results",
							description: "Outputs collected from every pass.",
							required: true,
						},
					},
					inputs: [],
					outputs: [],
					defaultCodeMode: "generated",
					requiredPermission: "NONE",
					supportsOutput: true,
					supportsCustomCode: false,
				},
			],
		};
		vi.mocked(runPixel).mockResolvedValue({
			errors: [],
			insightId: "insight-1",
			pixelReturn: [
				{
					isMeta: false,
					operationType: ["MAP"],
					output: catalog,
					pixelExpression: "GetAutomationNodeDefinitions();",
					pixelId: "0",
					timeToRun: 0,
				},
			],
		});

		await expect(fetchAutomationNodeDefinitions()).resolves.toEqual(
			catalog,
		);
	});
});
