import type { ComponentProps } from "react";
import ReactMarkdown, { type ExtraProps } from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { remarkLatexMath } from "../lib/remark-latex-math";
import { cn } from "../lib/utils";

/** Keep wide display equations inside a keyboard-scrollable region. */
function MathSpan({
	className,
	node: _node,
	...props
}: ComponentProps<"span"> & ExtraProps) {
	if (!className?.split(" ").includes("katex-display")) {
		return <span className={className} {...props} />;
	}

	return (
		// biome-ignore lint/a11y/useSemanticElements: equations may be inside a paragraph, where section would be invalid HTML
		<span
			data-slot="math-equation"
			role="region"
			aria-label="Equation"
			// biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard users must be able to scroll a wide equation
			tabIndex={0}
			className="focus-visible:-outline-offset-2 block max-w-full overflow-x-auto overflow-y-hidden focus-visible:outline-2 focus-visible:outline-ring"
		>
			<span className={cn("min-w-max", className)} {...props} />
		</span>
	);
}

type MathMarkdownProps = Pick<
	ComponentProps<typeof ReactMarkdown>,
	"children" | "components" | "urlTransform"
>;

/** Optional Markdown math pipeline, loaded only by math-enabled consumers. */
export function MathMarkdown({ components, ...props }: MathMarkdownProps) {
	return (
		<ReactMarkdown
			remarkPlugins={[remarkGfm, remarkMath, remarkLatexMath]}
			rehypePlugins={[
				rehypeRaw,
				[
					rehypeKatex,
					{
						output: "htmlAndMathml",
						trust: false,
						maxSize: 10,
						maxExpand: 1000,
						errorColor: "var(--destructive)",
					},
				],
			]}
			components={{ span: MathSpan, ...components }}
			{...props}
		/>
	);
}
