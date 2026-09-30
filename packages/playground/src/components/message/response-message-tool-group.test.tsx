import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import type { ToolStore } from "@/stores/tool/tool.store";
import { ResponseMessageToolGroup } from "./response-message-tool-group";

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("./response-message-tool", () => ({
	ResponseMessageTool: ({
		tool,
		isLarge,
	}: {
		tool: ToolStore;
		isLarge?: boolean;
	}) => (
		<>
			<input aria-label={tool.id} defaultValue="edited parameters" />
			{isLarge && <button type="button">Approve {tool.id}</button>}
		</>
	),
}));
const tool = (id: string, status: string, ask = false) =>
	({
		id,
		displayName: id,
		status,
		isResolved: true,
		display: "inline",
		json: { _meta: { SMSS_MCP_EXECUTION: ask ? "ask" : "auto" } },
	}) as unknown as ToolStore;

test("expands running activity, collapses success, and preserves manual choices", () => {
	const step = tool("step", "LOADING");
	const completed = tool("completed", "SUCCESS");
	const tools = [step, completed];
	const { rerender } = render(<ResponseMessageToolGroup tools={tools} />);
	const trigger = screen.getByRole("button");
	const parameters = screen.getByLabelText("step");
	expect(trigger).toHaveAttribute("aria-expanded", "true");
	step.status = "SUCCESS";
	rerender(<ResponseMessageToolGroup tools={[...tools]} />);
	expect(trigger).toHaveAttribute("aria-expanded", "false");
	fireEvent.click(trigger);
	step.status = "LOADING";
	rerender(<ResponseMessageToolGroup tools={[...tools]} />);
	step.status = "SUCCESS";
	rerender(<ResponseMessageToolGroup tools={[...tools]} />);
	expect(trigger).toHaveAttribute("aria-expanded", "true");
	expect(screen.getByLabelText("step")).toBe(parameters);
});

test("keeps pending decisions outside collapsed activity", () => {
	const pending = tool("approval", "INITIAL");
	Object.assign(pending, { pendingAction: { type: "approval" } });
	render(
		<ResponseMessageToolGroup tools={[tool("done", "SUCCESS"), pending]} />,
	);
	const trigger = screen.getByRole("button", { name: /activity.steps/ });
	fireEvent.click(trigger);
	expect(trigger).toHaveAttribute("aria-expanded", "false");
	expect(
		screen
			.getByLabelText("approval")
			.closest('[data-slot="collapsible-content"]'),
	).toBeNull();
});

test.each(["INITIAL", "LOADING", "SUCCESS", "ERROR", "CANCELLED"])(
	"shows a single %s tool without a group toggle",
	(status) => {
		render(<ResponseMessageToolGroup tools={[tool("Search", status)]} />);
		expect(screen.getByLabelText("Search")).toBeVisible();
		expect(screen.queryByRole("button")).toBeNull();
	},
);

test("keeps a single approval visible even when other tools are hidden", () => {
	const hidden = tool("hidden", "SUCCESS");
	hidden.display = "hidden";
	render(
		<ResponseMessageToolGroup
			tools={[hidden, tool("approval", "INITIAL", true)]}
		/>,
	);
	expect(screen.queryByLabelText("hidden")).toBeNull();
	expect(screen.getByLabelText("approval")).toBeVisible();
	expect(
		screen.getByRole("button", { name: "Approve approval" }),
	).toBeVisible();
	expect(screen.queryByRole("button", { name: /activity.steps/ })).toBeNull();
});
