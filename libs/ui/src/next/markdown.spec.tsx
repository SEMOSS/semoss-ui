import { cleanup, render, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Markdown } from "./markdown";
import { MathMarkdown } from "./markdown-math";

vi.mock("./code", () => ({
	Code: ({ code }: { code: string }) => createElement("code", null, code),
	CodeContainer: ({ children }: { children: ReactNode }) =>
		createElement("pre", null, children),
}));

afterEach(cleanup);

describe("Markdown math", () => {
	it.each([
		[
			"dollar inline",
			String.raw`The error is $\frac{\sigma}{\sqrt{N}}$.`,
			false,
		],
		[
			"dollar display",
			"$$\n\\hat{\\mu}_N = \\frac{1}{N}\\sum_{i=1}^N g(X_i)\n$$",
			true,
		],
		[
			"LaTeX inline",
			String.raw`The error is \(\frac{\sigma}{\sqrt{N}}\).`,
			false,
		],
		[
			"LaTeX display",
			String.raw`Estimate: \[\hat{\mu}_N = \frac{1}{N}\sum_{i=1}^N g(X_i)\]`,
			true,
		],
		[
			"multiline LaTeX display",
			"\\[\n\\mu = \\mathbb{E}[g(X)] = \\int g(x)\\,p(x)\\,dx\n\\]",
			true,
		],
		["CRLF display", "\\[\r\nx_1 + x_2\r\n\\]", true],
		["multiline inline", "Error: \\(x_1 +\nx_2\\).", false],
		["quoted display", "> \\[\n> x_1 + x_2\n> \\]", true],
		["list item display", "- Estimate:\n  \\[x_1 + x_2\\]", true],
		["math fence", "```math\nE = mc^2\n```", true],
	])("renders %s with accessible MathML", (_name, source, display) => {
		const { container } = render(createElement(MathMarkdown, null, source));
		expect(container.querySelector(".katex")).not.toBeNull();
		expect(container.querySelector("math")).not.toBeNull();
		expect(
			container.querySelector(".katex-html")?.getAttribute("aria-hidden"),
		).toBe("true");
		expect(Boolean(container.querySelector(".katex-display"))).toBe(
			display,
		);
		if (display) {
			const equation = container.querySelector(
				'[data-slot="math-equation"]',
			);
			expect(equation?.getAttribute("tabindex")).toBe("0");
			expect(equation?.getAttribute("aria-label")).toBe("Equation");
			expect(equation?.classList.contains("overflow-x-auto")).toBe(true);
		}
	});

	it("preserves TeX escapes, subscripts, and matrix row separators", () => {
		const formula = String.raw`\begin{pmatrix}x_1 & x_2 \\ y_1 & y_2\end{pmatrix}`;
		const { container } = render(
			createElement(MathMarkdown, null, `\\[${formula}\\]`),
		);
		expect(container.querySelector("annotation")?.textContent).toBe(
			formula,
		);
		expect(container.querySelector(".katex-error")).toBeNull();
	});

	it.each([
		["inline code", "Use `\\(x_1\\) and $x_2$`"],
		["fenced code", '```python\nformula = r"\\[x_1\\] and $x_2$"\n```'],
		["indented code", String.raw`    \(x_1\) and $x_2$`],
		["HTML attributes", String.raw`<span title="\(x_1\)">Example</span>`],
		[
			"link destinations",
			String.raw`[Example](https://example.com/\(x_1\))`,
		],
		["escaped opening delimiter", String.raw`\\(x_1\\)`],
		["escaped currency", String.raw`Costs \$5 and \$10.`],
		["ordinary brackets", "Let (X) be in [0, 1]."],
		["unfinished formula", String.raw`Start \(x_1 + 1`],
	])("leaves %s out of math rendering", (_name, source) => {
		const { container } = render(createElement(MathMarkdown, null, source));
		expect(container.querySelector(".katex")).toBeNull();
		expect(container.textContent).not.toBe("");
	});

	it("keeps malformed formulas readable without losing surrounding content", () => {
		const { container } = render(
			createElement(
				MathMarkdown,
				null,
				String.raw`Before \(\frac{1}{\) after.`,
			),
		);
		expect(container.querySelector(".katex-error")?.textContent).toBe(
			String.raw`\frac{1}{`,
		);
		expect(container.textContent).toContain("Before");
		expect(container.textContent).toContain("after.");
	});

	it("does not enable trusted HTML commands in formulas", () => {
		const { container } = render(
			createElement(
				MathMarkdown,
				null,
				String.raw`\(\htmlClass{unexpected}{x}\)`,
			),
		);
		expect(container.querySelector(".unexpected")).toBeNull();
	});

	it.each(["default", "document"] as const)(
		"supports the %s preset and frontmatter through the public opt-in",
		async (variant) => {
			const { container } = render(
				<Markdown math variant={variant}>
					{
						"---\ntopic: Sampling\n---\n# Monte Carlo\n\nError: \\(N^{-1/2}\\)."
					}
				</Markdown>,
			);
			await waitFor(() =>
				expect(container.querySelector(".katex")).not.toBeNull(),
			);
			expect(container.querySelector("h1")?.textContent).toBe(
				"Monte Carlo",
			);
			expect(container.querySelector("table")?.textContent).toContain(
				"Sampling",
			);
		},
	);

	it("preserves existing Markdown behavior without opting in", () => {
		const { container } = render(
			<Markdown>{"Costs $5 and $10.\n\n**Total**"}</Markdown>,
		);
		expect(container.querySelector(".katex")).toBeNull();
		expect(container.textContent).toContain("Costs $5 and $10.");
		expect(container.querySelector("strong")?.textContent).toBe("Total");
	});
});
