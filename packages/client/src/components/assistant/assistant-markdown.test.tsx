import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AssistantMarkdown } from "./assistant-markdown";

afterEach(cleanup);

describe("assistant Markdown math", () => {
	it("renders dollar and LaTeX inline and display formulas with MathML", async () => {
		const { container } = render(
			<AssistantMarkdown>
				{String.raw`Inline $x_1$ and \(\frac{1}{N}\).

$$
\sum_{i=1}^N x_i
$$

\[
\mathbb{E}[X]
\]`}
			</AssistantMarkdown>,
		);

		await waitFor(() =>
			expect(container.querySelectorAll(".katex")).toHaveLength(4),
		);
		expect(container.querySelectorAll("math")).toHaveLength(4);
		expect(container.querySelectorAll(".katex-display")).toHaveLength(2);
		expect(
			Array.from(container.querySelectorAll("annotation"), (node) =>
				node.textContent?.trim(),
			),
		).toEqual([
			"x_1",
			String.raw`\frac{1}{N}`,
			String.raw`\sum_{i=1}^N x_i`,
			String.raw`\mathbb{E}[X]`,
		]);
		for (const visual of container.querySelectorAll(".katex-html")) {
			expect(visual).toHaveAttribute("aria-hidden", "true");
		}
	});

	it("keeps compact chat typography and keyboard-scrollable equations", async () => {
		render(
			<AssistantMarkdown>
				{
					"# Monte Carlo\n\nEstimate the mean.\n\n- Draw samples\n- Average them\n\n\\[\\hat{\\mu} = \\frac{1}{N}\\sum_{i=1}^N X_i\\]"
				}
			</AssistantMarkdown>,
		);

		const equation = await screen.findByRole("region", {
			name: "Equation",
		});
		expect(equation).toHaveAttribute("tabindex", "0");
		expect(equation).toHaveClass("max-w-full", "overflow-x-auto");
		expect(
			screen.getByRole("heading", { name: "Monte Carlo", level: 2 }),
		).toHaveClass("text-base", "font-semibold");
		expect(screen.getByText("Estimate the mean.")).toHaveClass(
			"leading-relaxed",
		);
		expect(screen.getByRole("list")).toHaveClass("my-2", "ms-5");
	});

	it("preserves partial streamed text and renders the completed formula", async () => {
		const { container, rerender } = render(
			<AssistantMarkdown>
				{String.raw`The estimate is \(\frac{1}{N}`}
			</AssistantMarkdown>,
		);
		expect(container).toHaveTextContent("The estimate is");
		expect(container).toHaveTextContent(String.raw`\frac{1}{N}`);

		rerender(
			<AssistantMarkdown>
				{String.raw`The estimate is \(\frac{1}{N}\sum_{i=1}^N X_i\). More samples improve precision.`}
			</AssistantMarkdown>,
		);
		await waitFor(() =>
			expect(container.querySelector("math")).not.toBeNull(),
		);
		expect(container.querySelector("annotation")?.textContent).toBe(
			String.raw`\frac{1}{N}\sum_{i=1}^N X_i`,
		);
		expect(container).toHaveTextContent("The estimate is");
		expect(container).toHaveTextContent("More samples improve precision.");
	});

	it("keeps code examples and escaped currency literal", async () => {
		const { container } = render(
			<AssistantMarkdown>
				{
					"Formula: \\(x_1\\).\n\nUse `\\(x_2\\) and $x_3$`.\n\n```text\n\\[x_4\\] and $x_5$\n```\n\nCosts \\$5 and \\$10."
				}
			</AssistantMarkdown>,
		);
		await waitFor(() =>
			expect(container.querySelector("math")).not.toBeNull(),
		);
		expect(container.querySelectorAll(".katex")).toHaveLength(1);
		expect(screen.getByText(String.raw`\(x_2\) and $x_3$`).tagName).toBe(
			"CODE",
		);
		expect(container.querySelector("pre")).toHaveTextContent(
			String.raw`\[x_4\] and $x_5$`,
		);
		expect(container).toHaveTextContent("Costs $5 and $10.");
	});

	it("leaves malformed formulas readable without losing the reply", async () => {
		const { container } = render(
			<AssistantMarkdown>
				{String.raw`Before \(\frac{1}{\) after. Valid math: \(x_1\).`}
			</AssistantMarkdown>,
		);
		await waitFor(() =>
			expect(container.querySelector(".katex-error")).toBeInTheDocument(),
		);
		expect(container.querySelector(".katex-error")).toHaveTextContent(
			String.raw`\frac{1}{`,
		);
		expect(container).toHaveTextContent("Before");
		expect(container).toHaveTextContent("after. Valid math:");
		expect(container.querySelector("math")).not.toBeNull();
	});
});
