import { Bot } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getWorkflowNodeDisplay } from "../../domain/automation-workflow-display";
import { AutomationFlowPreview } from "./automation-flow-preview";

describe("AutomationFlowPreview", () => {
	it("renders standalone with a text alternative and no execution or editing controls", () => {
		const markup = renderToStaticMarkup(
			<AutomationFlowPreview
				workflow={{
					nodes: [
						{ id: "start", type: "trigger.start", label: "Start" },
						{
							id: "routine",
							type: "agent.run",
							label: "Do the routine",
						},
					],
					edges: [
						{
							source: "start",
							target: "routine",
							sourcePort: "out",
							targetPort: "in",
						},
					],
				}}
			/>,
		);
		expect(markup).toContain("Routine workflow graph");
		expect(markup).toContain("Flow as text");
		expect(markup).toContain("Start → Do the routine");
		expect(markup).toContain('aria-label="Pan right"');
		expect(markup).toContain('aria-label="Pan down"');
		expect(markup).not.toMatch(
			/Edit step|Delete step|Remove connection|Save|Run workflow/,
		);
		expect(getWorkflowNodeDisplay("agent.run").icon).toBe(Bot);
	});

	it("shows an explicit empty state", () => {
		expect(
			renderToStaticMarkup(
				<AutomationFlowPreview workflow={{ nodes: [], edges: [] }} />,
			),
		).toContain("No flow is available for this routine.");
	});
});
// @vitest-environment jsdom
