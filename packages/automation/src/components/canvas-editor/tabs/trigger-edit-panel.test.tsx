import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { AutomationNode } from "../../../domain/automation.types";
import { TriggerEditPanel } from "./trigger-edit-panel";

vi.mock("@semoss/ui/next", () => ({
	Button: ({
		size: _size,
		variant: _variant,
		...props
	}: ComponentProps<"button"> & { size?: string; variant?: string }) => (
		<button {...props} />
	),
	Field: "div",
	FieldLabel: "label",
	Input: "input",
	Textarea: "textarea",
	cn: (...classes: (string | false)[]) => classes.filter(Boolean).join(" "),
}));

vi.mock("../schedule-dialog", () => ({
	SchedulePanel: () => <div>Schedule management</div>,
}));

const step: AutomationNode = {
	id: "trigger",
	type: "trigger",
	label: "Start",
	position: { x: 0, y: 0 },
	outputVar: "",
	config: { mode: "manual" },
	workflowConfig: { triggerModes: ["schedule"] },
};

function renderPanel(isAdmin?: boolean): string {
	return renderToStaticMarkup(
		<TriggerEditPanel
			appId="project"
			description=""
			onDescriptionChange={vi.fn()}
			onClose={vi.fn()}
			onPrepareSchedule={vi.fn()}
			step={step}
			onUpdate={vi.fn()}
			isAdmin={isAdmin}
		/>,
	);
}

describe("Start node scheduling access", () => {
	it.each([false, undefined])(
		"shows disabled scheduling with an explanation for admin status %s",
		(isAdmin) => {
			const markup = renderPanel(isAdmin);

			expect(markup).toContain("Schedule</h3>");
			expect(markup).toContain(
				'title="Scheduled jobs are only available to admins."',
			);
			expect(markup).toMatch(
				/<button[^>]*disabled=""[^>]*>Remove<\/button>/,
			);
			expect(markup).toContain("border-dashed bg-muted/30");
			expect(markup).not.toContain("Schedule management");
		},
	);

	it("keeps scheduling enabled for admins", () => {
		const markup = renderPanel(true);

		expect(markup).toMatch(/<button[^>]*>Remove<\/button>/);
		expect(markup).not.toContain('disabled=""');
		expect(markup).toContain("Schedule management");
		expect(markup).not.toContain(
			"Scheduled jobs are only available to admins.",
		);
	});
});
