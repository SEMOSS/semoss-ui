import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ToolCallView } from "./tool-call-view";

describe("ToolCallView", () => {
	it("defaults to the running state", () => {
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
		render(
			<ToolCallView
				toolName="doThing"
				status="success"
				arguments={{ id: "482" }}
				output="in review"
			/>,
		);

		await user.click(screen.getByRole("button"));

		expect(screen.getByText("Parameters")).toBeInTheDocument();
		expect(screen.getByText(/"id": "482"/)).toBeInTheDocument();
		expect(screen.getByText("Result")).toBeInTheDocument();
		expect(screen.getByText("in review")).toBeInTheDocument();
	});

	it("does not show a Result panel while still running (no output yet)", async () => {
		const user = userEvent.setup();
		render(<ToolCallView toolName="doThing" arguments={{ id: "482" }} />);

		await user.click(screen.getByRole("button"));

		expect(screen.getByText("Parameters")).toBeInTheDocument();
		expect(screen.queryByText("Result")).not.toBeInTheDocument();
	});

	it("collapses again on a second click", async () => {
		const user = userEvent.setup();
		render(<ToolCallView toolName="doThing" arguments={{}} />);

		const button = screen.getByRole("button");
		await user.click(button);
		expect(screen.getByText("Parameters")).toBeInTheDocument();

		await user.click(button);
		expect(screen.queryByText("Parameters")).not.toBeInTheDocument();
	});
});
