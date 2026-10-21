import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, expect, test, vi } from "vitest";
import type { MCPConfig } from "@semoss/shared";
import type { Workspace } from "@/types";
import { MCPOverlay } from "./mcp-overlay";

const query = vi.hoisted(() => ({
	status: "INITIAL",
	data: null as Workspace | null,
	refresh: vi.fn(),
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@semoss/sdk/react", () => ({ usePixel: () => query }));
vi.mock("@/hooks/use-root", () => ({
	useRoot: () => ({ root: { theme: { featureFlags: {} } } }),
}));
vi.mock("@semoss/shared", () => ({
	MCPSelector: ({ values }: { values: MCPConfig[] }) => (
		<div>
			{values.map((item) => (
				<span key={item.id}>{item.name}</span>
			))}
		</div>
	),
	isKnowledgeMcp: (item: MCPConfig) => item.type === "VECTOR",
	splitMcpByType: (values: MCPConfig[]) => ({
		knowledge: values.filter((item) => item.type === "VECTOR"),
		toolbox: values.filter((item) => item.type !== "VECTOR"),
	}),
	createMcpPlatformUrl: () => () => "",
	createPromptPlatformUrl: () => () => "",
}));
vi.mock("../knowledge/new-knowledge-form-body", () => ({
	NewKnowledgeFormBody: () => null,
}));
vi.mock("./agent-selector", () => ({
	AgentSelector: ({
		onChange,
		allowDefaultAgent,
	}: {
		allowDefaultAgent: boolean;
		onChange: (
			value: { workspace_id: string; name: string } | null,
		) => void;
	}) => (
		<>
			<input aria-label="Search agents" />
			<button
				type="button"
				onClick={() =>
					onChange({ workspace_id: "alpha", name: "Alpha" })
				}
			>
				Select Alpha
			</button>
			<button
				type="button"
				onClick={() => onChange({ workspace_id: "beta", name: "Beta" })}
			>
				Select Beta
			</button>
			{allowDefaultAgent && (
				<button type="button" onClick={() => onChange(null)}>
					Default agent
				</button>
			)}
		</>
	),
}));
const local: MCPConfig = {
	id: "local",
	name: "Local handbook",
	type: "VECTOR",
};
beforeEach(() => {
	query.status = "INITIAL";
	query.data = null;
	query.refresh.mockClear();
});

test("cancel discards the agent draft and reopening restores committed values", () => {
	const onClose = vi.fn();
	const props = {
		open: true,
		defaultTab: "AGENT" as const,
		values: [local],
		agentEditable: true,
		allowDefaultAgent: true,
		onClose,
	};
	const { rerender } = render(<MCPOverlay {...props} />);
	fireEvent.click(screen.getByRole("button", { name: "Select Alpha" }));
	fireEvent.click(screen.getByRole("button", { name: "buttons.cancel" }));
	expect(onClose).toHaveBeenCalledWith();
	rerender(<MCPOverlay {...props} open={false} />);
	rerender(<MCPOverlay {...props} />);
	fireEvent.click(screen.getByRole("button", { name: "buttons.save" }));
	expect(onClose).toHaveBeenLastCalledWith({
		mcp: [local],
		workspace: null,
		agentModeSelected: true,
	});
});

test("waits for the current agent, rejects stale results, and exposes retry on failure", async () => {
	const onClose = vi.fn();
	const props = {
		open: true,
		defaultTab: "AGENT" as const,
		values: [local],
		agentEditable: true,
		allowDefaultAgent: true,
		onClose,
	};
	const { rerender } = render(<MCPOverlay {...props} />);
	fireEvent.click(screen.getByRole("button", { name: "Select Alpha" }));
	expect(screen.getByRole("button", { name: "buttons.save" })).toBeDisabled();
	fireEvent.click(screen.getByRole("button", { name: "Select Beta" }));
	query.status = "SUCCESS";
	query.data = {
		workspace_id: "alpha",
		mcp: [{ id: "old", name: "Old tool", type: "FUNCTION" }],
	} as Workspace;
	rerender(<MCPOverlay {...props} />);
	expect(screen.getByRole("button", { name: "buttons.save" })).toBeDisabled();
	query.status = "ERROR";
	query.data = null;
	rerender(<MCPOverlay {...props} />);
	expect(screen.getByRole("alert")).toHaveTextContent(
		"room:settings.agentLoadError",
	);
	fireEvent.click(screen.getByRole("button", { name: "room:studio.retry" }));
	expect(query.refresh).toHaveBeenCalledTimes(1);
	query.status = "SUCCESS";
	query.data = {
		workspace_id: "beta",
		mcp: [{ id: "new", name: "New tool", type: "FUNCTION" }],
	} as Workspace;
	rerender(<MCPOverlay {...props} />);
	await waitFor(() =>
		expect(
			screen.getByRole("button", { name: "buttons.save" }),
		).toBeEnabled(),
	);
	fireEvent.click(screen.getByRole("button", { name: "buttons.save" }));
	expect(onClose).toHaveBeenCalledWith({
		workspace: { workspace_id: "beta", name: "Beta" },
		agentModeSelected: true,
		mcp: [
			local,
			{
				id: "new",
				name: "New tool",
				type: "FUNCTION",
				fromWorkspace: true,
			},
		],
	});
});

test("Default agent removes inherited resources but retains local selections", () => {
	const onClose = vi.fn();
	render(
		<MCPOverlay
			open
			defaultTab="AGENT"
			values={[
				local,
				{
					id: "inherited",
					name: "Agent tool",
					type: "FUNCTION",
					fromWorkspace: true,
				},
			]}
			workspace={{ workspace_id: "alpha", name: "Alpha" }}
			agentEditable
			allowDefaultAgent
			onClose={onClose}
		/>,
	);
	fireEvent.click(screen.getByRole("button", { name: "Default agent" }));
	fireEvent.click(screen.getByRole("button", { name: "buttons.save" }));
	expect(onClose).toHaveBeenCalledWith({
		mcp: [local],
		workspace: null,
		agentModeSelected: true,
	});
});

test("busy conversations cannot save an open overlay", () => {
	const onClose = vi.fn();
	render(
		<MCPOverlay
			open
			disabled
			defaultTab="KNOWLEDGE"
			values={[local]}
			onClose={onClose}
		/>,
	);
	expect(screen.getByRole("button", { name: "buttons.save" })).toBeDisabled();
	fireEvent.click(screen.getByRole("button", { name: "buttons.save" }));
	expect(onClose).not.toHaveBeenCalled();
});

test("returns keyboard focus to the Settings Add button after Cancel", async () => {
	function SettingsPicker() {
		const [open, setOpen] = useState(false);
		return (
			<>
				<button type="button" onClick={() => setOpen(true)}>
					Add knowledge
				</button>
				<MCPOverlay
					open={open}
					defaultTab="AGENT"
					values={[]}
					agentEditable
					onClose={() => setOpen(false)}
				/>
			</>
		);
	}
	const user = userEvent.setup();
	render(<SettingsPicker />);
	const add = screen.getByRole("button", { name: "Add knowledge" });
	await user.click(add);
	expect(
		screen.getByRole("textbox", { name: "Search agents" }),
	).toHaveFocus();
	await user.click(screen.getByRole("button", { name: "buttons.cancel" }));
	await waitFor(() => expect(add).toHaveFocus());
});

test("choosing Default agent from another overlay tab explicitly commits Agent mode", () => {
	const onClose = vi.fn();
	render(
		<MCPOverlay
			open
			defaultTab="KNOWLEDGE"
			values={[local]}
			agentEditable
			allowDefaultAgent
			onClose={onClose}
		/>,
	);
	fireEvent.mouseDown(screen.getByRole("tab", { name: "overlay.tabAgent" }), {
		button: 0,
		ctrlKey: false,
	});
	fireEvent.click(screen.getByRole("button", { name: "Default agent" }));
	fireEvent.click(screen.getByRole("button", { name: "buttons.save" }));
	expect(onClose).toHaveBeenCalledWith({
		mcp: [local],
		workspace: null,
		agentModeSelected: true,
	});
});
