import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NotebookMarkdownCell } from "./notebook-markdown-cell";

// Only replace the worker-backed editor. The notebook frame, shared Markdown,
// parser plugins, and KaTeX all render their real frontend implementation.
vi.mock("./notebook-cell-input-code", () => ({
	NotebookCellInputCode: ({
		value,
		onChange,
	}: {
		value: string;
		onChange: (value: string) => void;
	}) => (
		<textarea
			aria-label="Markdown source"
			value={value}
			onChange={(event) => onChange(event.target.value)}
		/>
	),
}));

afterEach(cleanup);

const source = [
	"# Monte Carlo\n\n",
	String.raw`The estimate is \(\hat{\mu}_N\).`,
	"\n\n",
	String.raw`\[\hat{\mu}_N = \frac{1}{N}\sum_{i=1}^N g(X_i)\]`,
	"\n\n- Draw samples\n- Average results\n\n",
	"| Samples | Error |\n| --- | --- |\n| 100 | 0.1 |\n\n",
	"[Method](https://example.com/method)\n\n",
	"Literal code: `\\(x_1\\) and $x_2$`\n",
];

function createProps(): ComponentProps<typeof NotebookMarkdownCell> {
	return {
		cell: {
			id: "explanation",
			cell_type: "markdown",
			metadata: { name: "Monte Carlo example" },
			source,
		},
		index: 0,
		disabled: false,
		isActive: false,
		canMoveUp: false,
		canMoveDown: false,
		onActivate: vi.fn(),
		onChangeType: vi.fn(),
		onRename: vi.fn(),
		onInsertAbove: vi.fn(),
		onInsertBelow: vi.fn(),
		onDuplicate: vi.fn(),
		onDelete: vi.fn(),
		onMoveUp: vi.fn(),
		onMoveDown: vi.fn(),
		onSourceChange: vi.fn(),
	};
}

describe("notebook Markdown view", () => {
	it.each([false, true])(
		"renders Markdown and math with readOnly=%s without changing the cell",
		async (readOnly) => {
			const props = createProps();
			const { container } = render(
				<NotebookMarkdownCell {...props} readOnly={readOnly} />,
			);

			await waitFor(() =>
				expect(container.querySelectorAll(".katex")).toHaveLength(2),
			);
			expect(
				screen.getByRole("heading", { name: "Monte Carlo" }),
			).toBeTruthy();
			expect(screen.getAllByRole("listitem")).toHaveLength(2);
			expect(screen.getByRole("table").textContent).toContain("100");
			expect(
				screen
					.getByRole("link", { name: "Method" })
					.getAttribute("href"),
			).toBe("https://example.com/method");
			expect(container.querySelector("code")?.textContent).toBe(
				String.raw`\(x_1\) and $x_2$`,
			);
			expect(container.querySelectorAll("math")).toHaveLength(2);
			expect(
				screen
					.getByRole("region", { name: "Equation" })
					.getAttribute("tabindex"),
			).toBe("0");
			expect(props.onSourceChange).not.toHaveBeenCalled();
			expect(props.cell.source).toEqual(source);
			if (readOnly) {
				expect(
					screen.queryByRole("button", { name: "Edit markdown" }),
				).toBeNull();
				fireEvent.doubleClick(
					screen.getByRole("heading", { name: "Monte Carlo" }),
				);
				expect(
					screen.queryByRole("textbox", { name: "Markdown source" }),
				).toBeNull();
			}
		},
	);

	it("keeps the LaTeX source intact when switching between edit and preview", async () => {
		const props = createProps();
		const { container, rerender } = render(
			<NotebookMarkdownCell {...props} />,
		);
		await waitFor(() =>
			expect(container.querySelector(".katex")).not.toBeNull(),
		);
		fireEvent.click(screen.getByRole("button", { name: "Edit markdown" }));
		const editor = screen.getByRole("textbox", { name: "Markdown source" });
		expect((editor as HTMLTextAreaElement).value).toBe(source.join(""));
		expect(props.onSourceChange).not.toHaveBeenCalled();

		const nextSource = String.raw`Updated error: $\frac{s}{\sqrt{N}}$.`;
		fireEvent.change(editor, { target: { value: nextSource } });
		expect(props.onSourceChange).toHaveBeenCalledWith(0, nextSource);
		rerender(
			<NotebookMarkdownCell
				{...props}
				cell={{ ...props.cell, source: nextSource }}
			/>,
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Switch to preview" }),
		);
		await waitFor(() =>
			expect(container.querySelector("annotation")?.textContent).toBe(
				String.raw`\frac{s}{\sqrt{N}}`,
			),
		);
		expect(props.cell.source).toEqual(source);
	});

	it("shows malformed math as text while continuing to render the notebook cell", async () => {
		const props = createProps();
		const { container } = render(
			<NotebookMarkdownCell
				{...props}
				cell={{
					...props.cell,
					source: String.raw`# Result

Bad: \(\frac{1}{\). Valid: \(x_1\).`,
				}}
			/>,
		);
		await waitFor(() =>
			expect(container.querySelector(".katex-error")).not.toBeNull(),
		);
		expect(screen.getByRole("heading", { name: "Result" })).toBeTruthy();
		expect(container.querySelector(".katex-error")?.textContent).toBe(
			String.raw`\frac{1}{`,
		);
		expect(container.querySelector("math")).not.toBeNull();
		expect(props.onSourceChange).not.toHaveBeenCalled();
	});
});
