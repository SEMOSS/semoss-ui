import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PromptBuilderContextTestDialog } from "./prompt-builder-context-test-dialog";

const mocks = vi.hoisted(() => ({ run: vi.fn() }));
vi.mock("@semoss/sdk/react", () => ({
	useSessionInsight: () => ({ run: mocks.run }),
}));

afterEach(() => {
	cleanup();
	vi.resetAllMocks();
});

describe("PromptBuilderContextTestDialog", () => {
	it("shows a model response and reports failed retries", async () => {
		mocks.run
			.mockResolvedValueOnce({
				errors: [],
				pixelReturn: [{ output: { response: "Answer" } }],
			})
			.mockResolvedValueOnce({
				errors: ["Model unavailable"],
				pixelReturn: [],
			});
		render(
			<PromptBuilderContextTestDialog
				llm="model"
				context="Question"
				open
				close={vi.fn()}
			/>,
		);

		expect(await screen.findByText("Answer")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Retry" }));
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Model unavailable",
		);
		expect(screen.queryByText("Answer")).not.toBeInTheDocument();
	});

	it("reports an invalid model response", async () => {
		mocks.run.mockResolvedValue({
			errors: [],
			pixelReturn: [{ output: { response: 42 } }],
		});
		render(
			<PromptBuilderContextTestDialog
				llm="model"
				context="Question"
				open
				close={vi.fn()}
			/>,
		);

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"The model returned an invalid response.",
		);
	});

	it("ignores an earlier request after the dialog is reopened", async () => {
		let resolveFirst: (result: {
			errors: string[];
			pixelReturn: { output: string }[];
		}) => void = () => {
			throw new Error("First request was not started");
		};
		mocks.run
			.mockImplementationOnce(
				() =>
					new Promise((resolve) => {
						resolveFirst = resolve;
					}),
			)
			.mockResolvedValueOnce({
				errors: [],
				pixelReturn: [{ output: "New answer" }],
			});
		const props = { llm: "model", context: "Question", close: vi.fn() };
		const { rerender } = render(
			<PromptBuilderContextTestDialog {...props} open />,
		);
		rerender(<PromptBuilderContextTestDialog {...props} open={false} />);
		rerender(<PromptBuilderContextTestDialog {...props} open />);

		expect(await screen.findByText("New answer")).toBeInTheDocument();
		await act(async () => {
			resolveFirst({
				errors: [],
				pixelReturn: [{ output: "Old answer" }],
			});
		});
		expect(screen.getByText("New answer")).toBeInTheDocument();
		expect(screen.queryByText("Old answer")).not.toBeInTheDocument();
	});
});
