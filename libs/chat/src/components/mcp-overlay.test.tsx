import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { MCPConfig } from "../types";
import { McpOverlay } from "./mcp-overlay";

vi.mock("@semoss/sdk/react", () => ({
	useIteratorPixel: () => ({
		data: [],
		isLoading: false,
		hasMore: false,
		next: vi.fn(),
	}),
}));

// MCPSelector calls usePixel/useIteratorPixel internally (real SDK hooks
// needing a real InsightProvider) — not worth exercising here, same reason
// EngineSelect's own test mocks the shared EngineSelect rather than rendering
// the real thing. This file's job is McpOverlay's own orchestration (tabs,
// badge counts, save/cancel), not MCPSelector's. splitMcpByType is simple
// enough to reimplement directly instead of importing the real one.
vi.mock("@semoss/shared", () => ({
	AppCatalogAvatar: ({ name }: { name: string }) => (
		<div>{name.slice(0, 1)}</div>
	),
	splitMcpByType: (mcp: MCPConfig[]) => ({
		knowledge: mcp.filter((m) => m.type === "VECTOR"),
		toolbox: mcp.filter((m) => m.type !== "VECTOR"),
	}),
	MCPSelector: ({
		type,
		values,
		onChange,
	}: {
		type: "KNOWLEDGE" | "TOOLBOX";
		values: MCPConfig[];
		onChange: (next: MCPConfig[]) => void;
	}) => (
		<div data-testid={`selector-${type}`}>
			{values.map((v) => v.name).join(",")}
			<button
				type="button"
				onClick={() =>
					onChange([
						...values,
						{
							type: type === "KNOWLEDGE" ? "VECTOR" : "FUNCTION",
							id: `new-${type}`,
							name: `New ${type}`,
						},
					])
				}
			>
				Add to {type}
			</button>
		</div>
	),
}));

const knowledgeItem: MCPConfig = {
	type: "VECTOR",
	id: "kb-1",
	name: "Docs",
};
const toolboxItem: MCPConfig = {
	type: "FUNCTION",
	id: "tool-1",
	name: "Calculator",
};

describe("McpOverlay", () => {
	it("renders nothing when closed", () => {
		render(
			<McpOverlay
				open={false}
				defaultTab="KNOWLEDGE"
				values={[]}
				onSave={vi.fn()}
				onOpenChange={vi.fn()}
			/>,
		);
		expect(screen.queryByText("Knowledge & Tools")).not.toBeInTheDocument();
	});

	it("splits values into Knowledge/Toolbox tabs with correct counts", () => {
		render(
			<McpOverlay
				open
				defaultTab="KNOWLEDGE"
				values={[knowledgeItem, toolboxItem]}
				onSave={vi.fn()}
				onOpenChange={vi.fn()}
			/>,
		);
		expect(
			screen.getByRole("tab", { name: /Knowledge 1/ }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("tab", { name: /Toolbox 1/ }),
		).toBeInTheDocument();
		expect(screen.getByTestId("selector-KNOWLEDGE")).toHaveTextContent(
			"Docs",
		);
	});

	it("opens on the requested defaultTab", () => {
		render(
			<McpOverlay
				open
				defaultTab="TOOLBOX"
				values={[knowledgeItem, toolboxItem]}
				onSave={vi.fn()}
				onOpenChange={vi.fn()}
			/>,
		);
		expect(screen.getByTestId("selector-TOOLBOX")).toBeInTheDocument();
	});

	it("calls onSave with the combined knowledge+toolbox drafts and closes", async () => {
		const user = userEvent.setup();
		const onSave = vi.fn();
		const onOpenChange = vi.fn();
		render(
			<McpOverlay
				open
				defaultTab="KNOWLEDGE"
				values={[knowledgeItem]}
				onSave={onSave}
				onOpenChange={onOpenChange}
			/>,
		);

		await user.click(
			screen.getByRole("button", { name: "Add to KNOWLEDGE" }),
		);
		await user.click(screen.getByRole("button", { name: "Save" }));

		expect(onSave).toHaveBeenCalledWith([
			knowledgeItem,
			{ type: "VECTOR", id: "new-KNOWLEDGE", name: "New KNOWLEDGE" },
		]);
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("does not call onSave when cancelled", async () => {
		const user = userEvent.setup();
		const onSave = vi.fn();
		const onOpenChange = vi.fn();
		render(
			<McpOverlay
				open
				defaultTab="KNOWLEDGE"
				values={[]}
				onSave={onSave}
				onOpenChange={onOpenChange}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Cancel" }));

		expect(onSave).not.toHaveBeenCalled();
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("allows selecting a hardcoded agent", async () => {
		const user = userEvent.setup();
		const onSaveWorkspace = vi.fn();
		render(
			<McpOverlay
				open
				defaultTab="AGENT"
				agentEditable
				agents={[
					{
						workspace_id: "agent-1",
						name: "Support Agent",
						description: "Answers support questions",
					},
				]}
				values={[]}
				onSave={vi.fn()}
				onSaveWorkspace={onSaveWorkspace}
				onOpenChange={vi.fn()}
			/>,
		);

		await user.click(screen.getByText("Support Agent"));
		await user.click(screen.getByRole("button", { name: "Save" }));

		expect(onSaveWorkspace).toHaveBeenCalledWith({
			workspace_id: "agent-1",
			name: "Support Agent",
		});
	});
});
