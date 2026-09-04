import {
	type MarkdownCalloutType,
	remarkAbbreviations,
	remarkCallouts,
} from "@/lib/markdownPlugins";
import type { VisualizationConfig } from "@/types/dashboard";
import "highlight.js/styles/github-dark.css";
import "katex/dist/katex.min.css";
import {
	CircleAlert,
	CircleHelp,
	FileText,
	Info,
	Lightbulb,
	TriangleAlert,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import {
	defListHastHandlers,
	remarkDefinitionList,
} from "remark-definition-list";
import remarkDirective from "remark-directive";
import remarkEmoji from "remark-emoji";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

interface Props {
	config?: VisualizationConfig;
}

const CALLOUT_STYLES: Record<
	MarkdownCalloutType,
	{ label: string; icon: typeof Info; container: string; iconColor: string }
> = {
	note: {
		label: "Note",
		icon: Info,
		container: "border-sky-200 bg-sky-50/70",
		iconColor: "text-sky-600",
	},
	tip: {
		label: "Tip",
		icon: Lightbulb,
		container: "border-emerald-200 bg-emerald-50/70",
		iconColor: "text-emerald-600",
	},
	info: {
		label: "Info",
		icon: CircleHelp,
		container: "border-blue-200 bg-blue-50/70",
		iconColor: "text-blue-600",
	},
	warning: {
		label: "Warning",
		icon: TriangleAlert,
		container: "border-amber-200 bg-amber-50/70",
		iconColor: "text-amber-600",
	},
	danger: {
		label: "Danger",
		icon: CircleAlert,
		container: "border-red-200 bg-red-50/70",
		iconColor: "text-red-600",
	},
};

export function MarkdownVisualization({ config }: Props) {
	const markdown = config?.markdownContent ?? "";

	if (!markdown.trim()) {
		return (
			<div className="flex h-full items-center justify-center text-slate-400">
				<div className="px-6 text-center">
					<FileText className="mx-auto mb-3 h-10 w-10 opacity-30" />
					<p className="font-medium text-slate-500 text-sm">
						No Markdown content
					</p>
					<p className="mt-1 text-xs">
						Edit this block to add formatted text
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="h-full overflow-auto bg-white px-5 py-4 text-slate-700 text-sm leading-6">
			<ReactMarkdown
				skipHtml
				remarkPlugins={[
					remarkGfm,
					remarkDefinitionList,
					remarkAbbreviations,
					remarkDirective,
					remarkCallouts,
					remarkMath,
					[remarkEmoji, { accessible: true }],
				]}
				remarkRehypeOptions={{ handlers: defListHastHandlers }}
				rehypePlugins={[
					rehypeKatex,
					[rehypeHighlight, { detect: false, plainText: ["math"] }],
				]}
				components={{
					h1: ({ children }) => (
						<h1 className="mt-1 mb-4 font-bold text-2xl text-slate-900">
							{children}
						</h1>
					),
					h2: ({ children }) => (
						<h2 className="mt-6 mb-3 font-semibold text-slate-900 text-xl">
							{children}
						</h2>
					),
					h3: ({ children }) => (
						<h3 className="mt-5 mb-2 font-semibold text-lg text-slate-900">
							{children}
						</h3>
					),
					h4: ({ children }) => (
						<h4 className="mt-4 mb-2 font-semibold text-slate-900">
							{children}
						</h4>
					),
					p: ({ children }) => (
						<p className="mb-4 last:mb-0">{children}</p>
					),
					a: ({ children, href }) => (
						<a
							href={href}
							target="_blank"
							rel="noopener noreferrer"
							className="font-medium text-indigo-600 underline underline-offset-2 hover:text-indigo-700"
						>
							{children}
						</a>
					),
					ul: ({ children }) => (
						<ul className="mb-4 list-disc space-y-1 pl-6">
							{children}
						</ul>
					),
					ol: ({ children }) => (
						<ol className="mb-4 list-decimal space-y-1 pl-6">
							{children}
						</ol>
					),
					dl: ({ children }) => (
						<dl className="mb-4 grid grid-cols-[minmax(7rem,auto)_1fr] gap-x-4 gap-y-1">
							{children}
						</dl>
					),
					dt: ({ children }) => (
						<dt className="col-start-1 font-semibold text-slate-900">
							{children}
						</dt>
					),
					dd: ({ children }) => (
						<dd className="col-start-2 m-0 min-w-0 text-slate-600">
							{children}
						</dd>
					),
					abbr: ({ children, title }) => (
						<abbr
							title={title}
							className="cursor-help underline decoration-dotted underline-offset-2"
						>
							{children}
						</abbr>
					),
					aside: ({ children, node }) => {
						const requested = String(
							node?.properties?.dataCallout ?? "note",
						);
						const calloutType =
							requested in CALLOUT_STYLES
								? (requested as MarkdownCalloutType)
								: "note";
						const style = CALLOUT_STYLES[calloutType];
						const Icon = style.icon;
						return (
							<aside
								className={`mb-4 rounded-md border px-4 py-3 ${style.container}`}
							>
								<div className="mb-1.5 flex items-center gap-2">
									<Icon
										className={`h-4 w-4 shrink-0 ${style.iconColor}`}
										aria-hidden="true"
									/>
									<span className="font-semibold text-slate-800 text-xs uppercase">
										{style.label}
									</span>
								</div>
								<div className="text-slate-700">{children}</div>
							</aside>
						);
					},
					blockquote: ({ children }) => (
						<blockquote className="mb-4 border-indigo-200 border-l-4 bg-indigo-50/60 px-4 py-2 text-slate-600">
							{children}
						</blockquote>
					),
					hr: () => <hr className="my-6 border-slate-200" />,
					code: ({ children, className }) =>
						className ? (
							<code className={`${className} text-xs leading-5`}>
								{children}
							</code>
						) : (
							<code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] text-slate-800">
								{children}
							</code>
						),
					pre: ({ children }) => (
						<pre className="mb-4 max-w-full overflow-x-auto rounded-md bg-slate-900 p-4 font-mono text-slate-100 text-xs leading-5">
							{children}
						</pre>
					),
					table: ({ children }) => (
						<div className="mb-4 overflow-x-auto">
							<table className="w-full border-collapse text-left text-sm">
								{children}
							</table>
						</div>
					),
					th: ({ children }) => (
						<th className="border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-800">
							{children}
						</th>
					),
					td: ({ children }) => (
						<td className="border border-slate-200 px-3 py-2 align-top">
							{children}
						</td>
					),
					img: ({ src, alt }) => (
						<img
							src={src}
							alt={alt ?? ""}
							className="my-4 max-w-full rounded-md"
						/>
					),
				}}
			>
				{markdown}
			</ReactMarkdown>
		</div>
	);
}
