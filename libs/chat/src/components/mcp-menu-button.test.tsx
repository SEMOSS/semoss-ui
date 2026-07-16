import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { MCPConfig } from "../types";
import { McpMenuButton } from "./mcp-menu-button";

// Same rationale as mcp-overlay.test.tsx: MCPSelector needs a real
// InsightProvider, so mock @semoss/shared directly rather than exercising
// the real pixel-calling component.
vi.mock("@semoss/shared", () => ({
	isKnowledgeMcp: (mcp: { type: string }) => mcp.type === "VECTOR",
	splitMcpByType: (mcp: MCPConfig[]) => ({
		knowledge: mcp.filter((m) => m.type === "VECTOR"),
		toolbox: mcp.filter((m) => m.type !== "VECTOR"),
	}),
	MCPSelector: ({ type }: { type: "KNOWLEDGE" | "TOOLBOX" }) => (
		<div data-testid={`selector-${type}`} />
	),
}));

const knowledgeItem: MCPConfig = { type: "VECTOR", id: "kb-1", name: "Docs" };
const toolboxItem: MCPConfig = {
	type: "FUNCTION",
	id: "tool-1",
	name: "Calculator",
};

describe("McpMenuButton", () => {
	it("shows knowledge/toolbox counts derived from the mcp list", async () => {
		const user = userEvent.setup();
		render(
			<McpMenuButton
				mcp={[knowledgeItem, toolboxItem]}
				onChange={vi.fn()}
			/>,
		);

		await user.click(
			screen.getByRole("button", { name: "Add knowledge or tools" }),
		);

		expect(
			screen.getByRole("menuitem", { name: /Add Knowledge 1/ }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("menuitem", { name: /Add Toolbox 1/ }),
		).toBeInTheDocument();
	});

	it("opens the overlay on the KNOWLEDGE tab from the Add Knowledge item", async () => {
		const user = userEvent.setup();
		render(<McpMenuButton mcp={[]} onChange={vi.fn()} />);

		await user.click(
			screen.getByRole("button", { name: "Add knowledge or tools" }),
		);
		await user.click(
			screen.getByRole("menuitem", { name: /Add Knowledge/ }),
		);

		expect(screen.getByTestId("selector-KNOWLEDGE")).toBeInTheDocument();
	});

	it("opens the overlay on the TOOLBOX tab from the Add Toolbox item", async () => {
		const user = userEvent.setup();
		render(<McpMenuButton mcp={[]} onChange={vi.fn()} />);

		await user.click(
			screen.getByRole("button", { name: "Add knowledge or tools" }),
		);
		await user.click(screen.getByRole("menuitem", { name: /Add Toolbox/ }));

		expect(screen.getByTestId("selector-TOOLBOX")).toBeInTheDocument();
	});

	it("disables the trigger button when disabled", () => {
		render(<McpMenuButton mcp={[]} onChange={vi.fn()} disabled />);
		expect(
			screen.getByRole("button", { name: "Add knowledge or tools" }),
		).toBeDisabled();
	});
});
