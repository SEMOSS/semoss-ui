import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ToolCallView } from "./tool-call-view";

describe("ToolCallView", () => {
	it("defaults to the running state", () => {
		// No onOpenInSidebar → inline mode → main button has aria-expanded
		render(<ToolCallView toolName="lookupAccount" />);
		expect(
			screen.getByText("Running lookupAccount..."),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { expanded: false }),
		).toBeInTheDocument();
	});

	it("renders the success state", () => {
		render(<ToolCallView toolName="lookupAccount" status="success" />);
		expect(screen.getByText("Ran lookupAccount")).toBeInTheDocument();
	});

	it("renders the error state", () => {
		render(<ToolCallView toolName="lookupAccount" status="error" />);
		expect(screen.getByText("lookupAccount failed")).toBeInTheDocument();
	});

	it("merges a custom className", () => {
		render(
			<ToolCallView toolName="doThing" className="custom-tool-class" />,
		);
		const view = document.querySelector('[data-slot="tool-call-view"]');
		expect(view).toHaveClass("custom-tool-class");
	});

	it("stretches to fill its container (w-full)", () => {
		render(<ToolCallView toolName="doThing" />);
		const view = document.querySelector('[data-slot="tool-call-view"]');
		expect(view).toHaveClass("w-full");
	});

	it("is collapsed by default and shows no Parameters/Result", () => {
		render(
			<ToolCallView
				toolName="doThing"
				status="success"
				arguments={{ id: "482" }}
				output="ok"
			/>,
		);
		expect(screen.queryByText("Parameters")).not.toBeInTheDocument();
		expect(screen.queryByText("Result")).not.toBeInTheDocument();
	});

	it("expands to show Parameters always, and Result once resolved", async () => {
		const user = userEvent.setup();
		// No callback → inline mode; single expand/collapse button
		render(
			<ToolCallView
				toolName="doThing"
				status="success"
				arguments={{ id: "482" }}
				output="in review"
			/>,
		);

		await user.click(screen.getByRole("button", { expanded: false }));

		expect(screen.getByText("Parameters")).toBeInTheDocument();
		expect(screen.getByText(/"id": "482"/)).toBeInTheDocument();
		expect(screen.getByText("Result")).toBeInTheDocument();
		expect(screen.getByText("in review")).toBeInTheDocument();
	});

	it("does not show a Result panel while still running (no output yet)", async () => {
		const user = userEvent.setup();
		render(<ToolCallView toolName="doThing" arguments={{ id: "482" }} />);

		await user.click(screen.getByRole("button", { expanded: false }));

		expect(screen.getByText("Parameters")).toBeInTheDocument();
		expect(screen.queryByText("Result")).not.toBeInTheDocument();
	});

	it("collapses again on a second click", async () => {
		const user = userEvent.setup();
		render(<ToolCallView toolName="doThing" arguments={{}} />);

		const button = screen.getByRole("button", { expanded: false });
		await user.click(button);
		expect(screen.getByText("Parameters")).toBeInTheDocument();

		await user.click(screen.getByRole("button", { expanded: true }));
		expect(screen.queryByText("Parameters")).not.toBeInTheDocument();
	});

	// --- Sidebar mode (onOpenInSidebar provided) ---

	it("defaults to sidebar mode when a callback is provided — row click opens sidebar", async () => {
		const user = userEvent.setup();
		const onOpenInSidebar = vi.fn();
		render(
			<ToolCallView
				toolName="lookupAccount"
				onOpenInSidebar={onOpenInSidebar}
			/>,
		);

		await user.click(
			screen.getByRole("button", {
				name: "Open lookupAccount in sidebar",
			}),
		);

		expect(onOpenInSidebar).toHaveBeenCalledTimes(1);
	});

	it("shows a three-dot options menu when a sidebar callback is provided", () => {
		render(
			<ToolCallView toolName="lookupAccount" onOpenInSidebar={vi.fn()} />,
		);
		expect(
			screen.getByRole("button", { name: "lookupAccount options" }),
		).toBeInTheDocument();
	});

	it("three-dot menu contains 'Open in sidebar' and 'View inline' in sidebar mode", async () => {
		const user = userEvent.setup();
		render(
			<ToolCallView
				toolName="lookupAccount"
				status="success"
				onOpenInSidebar={vi.fn()}
			/>,
		);

		await user.click(
			screen.getByRole("button", { name: "lookupAccount options" }),
		);

		expect(
			screen.getByRole("menuitem", { name: /open in sidebar/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("menuitem", { name: /view inline/i }),
		).toBeInTheDocument();
	});

	it("switching to inline mode via menu expands the content", async () => {
		const user = userEvent.setup();
		render(
			<ToolCallView
				toolName="lookupAccount"
				status="success"
				arguments={{ q: "test" }}
				output="done"
				onOpenInSidebar={vi.fn()}
			/>,
		);

		await user.click(
			screen.getByRole("button", { name: "lookupAccount options" }),
		);
		await user.click(
			screen.getByRole("menuitem", { name: /view inline/i }),
		);

		expect(screen.getByText("Parameters")).toBeInTheDocument();
		expect(screen.getByText("Result")).toBeInTheDocument();
	});

	it("does not auto-open resolved tool results", () => {
		const onOpenInSidebar = vi.fn();
		render(
			<ToolCallView
				toolName="lookupAccount"
				status="success"
				onOpenInSidebar={onOpenInSidebar}
			/>,
		);

		expect(onOpenInSidebar).not.toHaveBeenCalled();
	});
});
