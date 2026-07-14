import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PromptOptimizer } from "./prompt-optimizer";

const { useInsight } = vi.hoisted(() => ({ useInsight: vi.fn() }));
vi.mock("@semoss/sdk/react", () => ({ useInsight }));

function successResponse(optimized: string) {
	return {
		pixelReturn: [
			{ output: { response: optimized }, operationType: ["OUTPUT"] },
		],
	};
}

describe("PromptOptimizer", () => {
	const run = vi.fn();

	beforeEach(() => {
		run.mockReset();
		useInsight.mockReturnValue({ actions: { run } });
	});

	it("is disabled when there's no input", () => {
		render(
			<PromptOptimizer input="" setInput={vi.fn()} modelId="engine-1" />,
		);
		expect(
			screen.getByRole("button", { name: "Optimize prompt" }),
		).toBeDisabled();
	});

	it("is disabled when there's no modelId", () => {
		render(<PromptOptimizer input="hello" setInput={vi.fn()} />);
		expect(
			screen.getByRole("button", { name: "Optimize prompt" }),
		).toBeDisabled();
	});

	it("calls the LLM pixel and replaces the input with the optimized prompt", async () => {
		run.mockResolvedValue(successResponse("A clearer version of hello"));
		const setInput = vi.fn();
		const user = userEvent.setup();

		render(
			<PromptOptimizer
				input="hello"
				setInput={setInput}
				modelId="engine-1"
			/>,
		);
		await user.click(
			screen.getByRole("button", { name: "Optimize prompt" }),
		);

		expect(run).toHaveBeenCalledWith(
			expect.stringContaining('engine=["engine-1"]'),
		);
		expect(setInput).toHaveBeenCalledWith("A clearer version of hello");
	});

	it("shows a revert button after optimizing, which restores the original input", async () => {
		run.mockResolvedValue(successResponse("optimized"));
		let input = "hello";
		const setInput = vi.fn((value: string) => {
			input = value;
		});
		const user = userEvent.setup();

		const { rerender } = render(
			<PromptOptimizer
				input={input}
				setInput={setInput}
				modelId="engine-1"
			/>,
		);
		await user.click(
			screen.getByRole("button", { name: "Optimize prompt" }),
		);
		rerender(
			<PromptOptimizer
				input={input}
				setInput={setInput}
				modelId="engine-1"
			/>,
		);

		const revertButton = screen.getByRole("button", {
			name: "Revert optimized prompt",
		});
		await user.click(revertButton);

		expect(setInput).toHaveBeenLastCalledWith("hello");
	});

	it("surfaces an LLM error via the button's label instead of throwing", async () => {
		run.mockResolvedValue({
			pixelReturn: [
				{ output: { response: "boom" }, operationType: ["ERROR"] },
			],
		});
		const setInput = vi.fn();
		const user = userEvent.setup();

		render(
			<PromptOptimizer
				input="hello"
				setInput={setInput}
				modelId="engine-1"
			/>,
		);
		await user.click(
			screen.getByRole("button", { name: "Optimize prompt" }),
		);

		expect(setInput).not.toHaveBeenCalled();
		expect(
			screen.getByRole("button", { name: "boom" }),
		).toBeInTheDocument();
	});
});
