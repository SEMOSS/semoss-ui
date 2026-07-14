import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MermaidBlock } from "./mermaid-block";

vi.mock("mermaid", () => ({
	default: {
		initialize: vi.fn(),
		render: vi.fn(async (_id: string, code: string) => {
			if (code.includes("bad")) {
				throw new Error("parse error");
			}
			return {
				svg: `<svg width="100" height="50"><text>${code}</text></svg>`,
			};
		}),
	},
}));

describe("MermaidBlock", () => {
	it("renders the diagram once mermaid resolves", async () => {
		render(<MermaidBlock code="graph TD; A-->B" />);
		await waitFor(() => {
			expect(document.querySelector("svg text")).toBeInTheDocument();
		});
		// The fixed width/height attributes get stripped before insertion.
		const diagramSvg = document.querySelector("svg text")?.closest("svg");
		expect(diagramSvg).not.toHaveAttribute("width");
	});

	it("shows raw code instead of a diagram while isLoading", () => {
		render(<MermaidBlock code="graph TD; A-->B" isLoading />);
		expect(document.querySelector("svg text")).not.toBeInTheDocument();
		expect(screen.getByText("graph TD; A-->B")).toBeInTheDocument();
	});

	it("falls back to raw code when mermaid.render() throws", async () => {
		render(<MermaidBlock code="bad syntax" />);
		await waitFor(() => {
			expect(screen.getByText("bad syntax")).toBeInTheDocument();
		});
		expect(document.querySelector("svg text")).not.toBeInTheDocument();
	});

	it("toggles between Diagram and Raw once rendered", async () => {
		const user = userEvent.setup();
		render(<MermaidBlock code="graph TD; A-->B" />);
		await waitFor(() => {
			expect(document.querySelector("svg text")).toBeInTheDocument();
		});

		await user.click(screen.getByRole("button", { name: "Raw" }));
		expect(document.querySelector("svg text")).not.toBeInTheDocument();
		expect(screen.getByText("graph TD; A-->B")).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Diagram" }));
		await waitFor(() => {
			expect(document.querySelector("svg text")).toBeInTheDocument();
		});
	});

	it("collapses the block, hiding the diagram", async () => {
		const user = userEvent.setup();
		render(<MermaidBlock code="graph TD; A-->B" />);
		await waitFor(() => {
			expect(document.querySelector("svg text")).toBeInTheDocument();
		});

		await user.click(
			screen.getByRole("button", { name: "Collapse Mermaid" }),
		);
		expect(document.querySelector("svg text")).not.toBeInTheDocument();
	});
});
