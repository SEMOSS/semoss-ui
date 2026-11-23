import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, expect, test, vi } from "vitest";
import type { WorkspaceDetails } from "@semoss/sdk";
import type { MCPConfig } from "@semoss/shared";
import { testChatOptions } from "../../../test/chat-options";
import type { AgentChoice } from "./agent-choice";
import { MCPOverlay } from "./mcp-overlay";

/** The read of an agent picked in the overlay, changed per test, and the agent last asked for. */
const read = vi.hoisted(() => ({
	status: "LOADING" as "IDLE" | "LOADING" | "READY" | "ERROR",
	workspace: null as WorkspaceDetails | null,
	error: null,
	refresh: vi.fn(),
	requested: [] as (string | null | undefined)[],
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("../../chat/config/chat-config.context", async (original) => ({
	...(await original<
		typeof import("../../chat/config/chat-config.context")
	>()),
	useChatConfig: () => ({
		options: testChatOptions(),
	}),
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
	createPromptPlatformUrl: () => () => "",
	useAgentWorkspace: (workspaceId: string | null | undefined) => {
		read.requested.push(workspaceId);
		return workspaceId
			? read
			: {
					status: "IDLE",
					workspace: null,
					error: null,
					refresh: read.refresh,
				};
	},
}));
vi.mock("../../knowledge/new-knowledge-form", () => ({
	NewKnowledgeForm: () => null,
}));
// Buttons stand in for the agent picker's choices
vi.mock("./agent-selector", () => ({
	AgentSelector: ({
		onChange,
		choice,
		onDefaultAgentChange,
	}: {
		choice: AgentChoice;
		onChange: (
			value: { workspace_id: string; name: string } | null,
		) => void;
		onDefaultAgentChange?: (isDefaultAgent: boolean) => void;
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
			{choice.kind === "saved" && choice.noneIsDefaultAgent && (
				<button type="button" onClick={() => onChange(null)}>
					Default agent
				</button>
			)}
			{choice.kind === "savedOrDefault" && onDefaultAgentChange && (
				<>
					<button
						type="button"
						onClick={() => {
							onChange(null);
							onDefaultAgentChange(true);
						}}
					>
						Pick Default Agent
					</button>
					<button
						type="button"
						onClick={() => {
							onChange(null);
							onDefaultAgentChange(false);
						}}
					>
						Pick No Agent
					</button>
				</>
			)}
		</>
	),
}));
/** Knowledge the user added themselves, which survives an agent change. */
const local: MCPConfig = {
	id: "local",
	name: "Local handbook",
	type: "VECTOR",
};
beforeEach(() => {
	read.status = "LOADING";
	read.workspace = null;
	read.refresh.mockClear();
	read.requested = [];
});

test("cancel discards the agent draft and reopening restores committed values", () => {
	const onClose = vi.fn();
	const props = {
		open: true,
		defaultTab: "AGENT" as const,
		values: [local],
		agentTools: [],
		agent: {
			kind: "saved",
			withModeChoice: true,
			noneIsDefaultAgent: true,
		} as const,
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
	});
});

test("waits for the picked agent, lists its tools as the agent's, and exposes retry on failure", async () => {
	const onClose = vi.fn();
	const props = {
		open: true,
		defaultTab: "AGENT" as const,
		values: [local],
		agentTools: [],
		agent: {
			kind: "saved",
			withModeChoice: true,
			noneIsDefaultAgent: true,
		} as const,
		onClose,
	};
	const { rerender } = render(<MCPOverlay {...props} />);
	// the room's own agent, none here, is not read
	expect(read.requested.at(-1)).toBeNull();
	fireEvent.click(screen.getByRole("button", { name: "Select Alpha" }));
	expect(read.requested.at(-1)).toBe("alpha");
	expect(screen.getByRole("button", { name: "buttons.save" })).toBeDisabled();
	fireEvent.click(screen.getByRole("button", { name: "Select Beta" }));
	expect(read.requested.at(-1)).toBe("beta");
	read.status = "ERROR";
	rerender(<MCPOverlay {...props} />);
	expect(screen.getByRole("alert")).toHaveTextContent(
		"room:settings.agentLoadError",
	);
	fireEvent.click(screen.getByRole("button", { name: "room:studio.retry" }));
	expect(read.refresh).toHaveBeenCalledTimes(1);
	read.status = "READY";
	read.workspace = {
		workspace_id: "beta",
		mcp: [{ id: "new", name: "New tool", type: "FUNCTION" }],
	} as WorkspaceDetails;
	rerender(<MCPOverlay {...props} />);
	await waitFor(() =>
		expect(
			screen.getByRole("button", { name: "buttons.save" }),
		).toBeEnabled(),
	);
	// the agent's tool is listed beside the room's, and not saved as the room's
	fireEvent.mouseDown(
		screen.getByRole("tab", { name: /overlay.tabToolbox/ }),
		{ button: 0, ctrlKey: false },
	);
	expect(screen.getByText("New tool")).toBeInTheDocument();
	fireEvent.click(screen.getByRole("button", { name: "buttons.save" }));
	expect(onClose).toHaveBeenCalledWith({
		workspace: { workspace_id: "beta", name: "Beta" },
		mcp: [local],
	});
});

test("lists the agent's knowledge first and hides a room selection of the same id", () => {
	const onClose = vi.fn();
	const roomCopy: MCPConfig = {
		id: "shared",
		name: "Room copy",
		type: "VECTOR",
	};
	render(
		<MCPOverlay
			open
			defaultTab="KNOWLEDGE"
			values={[local, roomCopy]}
			workspace={{ workspace_id: "alpha", name: "Alpha" }}
			agentTools={[{ id: "shared", name: "Agent copy", type: "VECTOR" }]}
			agent={{ kind: "fixed" }}
			onClose={onClose}
		/>,
	);
	// the room's own agent is known, so it is not read again
	expect(read.requested.every((id) => !id)).toBe(true);
	expect(screen.getByText("Agent copy")).toBeInTheDocument();
	expect(screen.queryByText("Room copy")).toBeNull();
	expect(
		screen.getByRole("tab", { name: /overlay.tabKnowledge/ }),
	).toHaveTextContent("2");
	fireEvent.click(screen.getByRole("button", { name: "buttons.save" }));
	expect(onClose).toHaveBeenCalledWith({
		mcp: [local, roomCopy],
		workspace: { workspace_id: "alpha", name: "Alpha" },
	});
});

test("Default agent drops the agent's resources but retains local selections", () => {
	const onClose = vi.fn();
	render(
		<MCPOverlay
			open
			defaultTab="AGENT"
			values={[local]}
			workspace={{ workspace_id: "alpha", name: "Alpha" }}
			agentTools={[
				{ id: "inherited", name: "Agent tool", type: "FUNCTION" },
			]}
			agent={{
				kind: "saved",
				withModeChoice: true,
				noneIsDefaultAgent: true,
			}}
			onClose={onClose}
		/>,
	);
	fireEvent.click(screen.getByRole("button", { name: "Default agent" }));
	fireEvent.click(screen.getByRole("button", { name: "buttons.save" }));
	expect(onClose).toHaveBeenCalledWith({
		mcp: [local],
		workspace: null,
	});
});

test("with isDefaultAgent, the save reports Default Agent, and No Agent removes it", () => {
	const onClose = vi.fn();
	const props = {
		open: true,
		defaultTab: "AGENT" as const,
		values: [local],
		agentTools: [],
		onClose,
	};
	const { rerender } = render(
		<MCPOverlay
			{...props}
			agent={{ kind: "savedOrDefault", isDefaultAgent: false }}
		/>,
	);
	fireEvent.click(screen.getByRole("button", { name: "Pick Default Agent" }));
	fireEvent.click(screen.getByRole("button", { name: "buttons.save" }));
	expect(onClose).toHaveBeenLastCalledWith({
		mcp: [local],
		workspace: null,
		isDefaultAgent: true,
	});
	const defaultAgent = {
		kind: "savedOrDefault",
		isDefaultAgent: true,
	} as const;
	rerender(<MCPOverlay {...props} open={false} agent={defaultAgent} />);
	rerender(<MCPOverlay {...props} agent={defaultAgent} />);
	fireEvent.click(screen.getByRole("button", { name: "Pick No Agent" }));
	fireEvent.click(screen.getByRole("button", { name: "buttons.save" }));
	expect(onClose).toHaveBeenLastCalledWith({
		mcp: [local],
		workspace: null,
		isDefaultAgent: false,
	});
});

test("without isDefaultAgent, No Agent and Default Agent are not separate choices", () => {
	render(
		<MCPOverlay
			open
			defaultTab="AGENT"
			values={[local]}
			agentTools={[]}
			agent={{
				kind: "saved",
				withModeChoice: true,
				noneIsDefaultAgent: true,
			}}
			onClose={vi.fn()}
		/>,
	);
	expect(
		screen.queryByRole("button", { name: "Pick Default Agent" }),
	).toBeNull();
});

test("busy conversations cannot save an open overlay", () => {
	const onClose = vi.fn();
	render(
		<MCPOverlay
			open
			disabled
			defaultTab="KNOWLEDGE"
			values={[local]}
			agentTools={[]}
			agent={{ kind: "fixed" }}
			onClose={onClose}
		/>,
	);
	expect(screen.getByRole("button", { name: "buttons.save" })).toBeDisabled();
	fireEvent.click(screen.getByRole("button", { name: "buttons.save" }));
	expect(onClose).not.toHaveBeenCalled();
});

test("returns keyboard focus to the Settings Add button after Cancel", async () => {
	/** Opens the overlay from a button, as Settings' Add does. */
	function SettingsPicker() {
		const [isOpen, setIsOpen] = useState(false);
		return (
			<>
				<button type="button" onClick={() => setIsOpen(true)}>
					Add knowledge
				</button>
				<MCPOverlay
					open={isOpen}
					defaultTab="AGENT"
					values={[]}
					agentTools={[]}
					agent={{
						kind: "saved",
						withModeChoice: false,
						noneIsDefaultAgent: false,
					}}
					onClose={() => setIsOpen(false)}
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
			agentTools={[]}
			agent={{
				kind: "saved",
				withModeChoice: true,
				noneIsDefaultAgent: true,
			}}
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
	});
});

test("values changed while open keep the draft, and the next open starts from them", () => {
	const onClose = vi.fn();
	const other: MCPConfig = { id: "other", name: "Other", type: "VECTOR" };
	const props = {
		open: true,
		defaultTab: "AGENT" as const,
		agentTools: [],
		agent: {
			kind: "saved",
			withModeChoice: true,
			noneIsDefaultAgent: true,
		} as const,
		onClose,
	};
	const { rerender } = render(<MCPOverlay {...props} values={[local]} />);
	fireEvent.click(screen.getByRole("button", { name: "Select Alpha" }));
	// the room's options change underneath, as a response saving them does
	rerender(<MCPOverlay {...props} values={[local, other]} />);
	read.status = "READY";
	read.workspace = {
		workspace_id: "alpha",
		mcp: [],
	} as unknown as WorkspaceDetails;
	rerender(<MCPOverlay {...props} values={[local, other]} />);
	fireEvent.click(screen.getByRole("button", { name: "buttons.save" }));
	expect(onClose).toHaveBeenLastCalledWith({
		mcp: [local],
		workspace: { workspace_id: "alpha", name: "Alpha" },
	});
	rerender(<MCPOverlay {...props} open={false} values={[local, other]} />);
	rerender(<MCPOverlay {...props} values={[local, other]} />);
	fireEvent.click(screen.getByRole("button", { name: "buttons.save" }));
	expect(onClose).toHaveBeenLastCalledWith({
		mcp: [local, other],
		workspace: null,
	});
});
