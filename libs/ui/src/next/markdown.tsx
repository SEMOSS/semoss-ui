import * as React from "react";
import { type Components, default as ReactMarkdown } from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Code, CodeContainer } from "./code";
import { Separator } from "./separator";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "./table";
import { H1, H2, H3, H4, List, P, Quote } from "./typography";

interface MarkdownProps extends React.HTMLAttributes<HTMLDivElement> {
	/** Markdown content to render */
	children: string | null | undefined;
	/** Custom components to override default rendering */
	components?: Partial<Components>;
	/** Override URL transformation (e.g. to allow custom protocols through sanitization) */
	urlTransform?: (url: string) => string | null | undefined;
}

function Markdown({
	children,
	components,
	className,
	urlTransform,
	...props
}: MarkdownProps) {
	const defaultComponents: Components = React.useMemo(
		() => ({
			h1: ({ children, ...props }) => <H1 {...props}>{children}</H1>,
			h2: ({ children, ...props }) => (
				<H2 className="mt-10" {...props}>
					{children}
				</H2>
			),
			h3: ({ children, ...props }) => (
				<H3 className="mt-8" {...props}>
					{children}
				</H3>
			),
			h4: ({ children, ...props }) => (
				<H4 className="mt-6" {...props}>
					{children}
				</H4>
			),
			h5: ({ children, ...props }) => (
				<h5
					className="mt-4 scroll-m-20 font-medium text-lg tracking-tight"
					{...props}
				>
					{children}
				</h5>
			),
			h6: ({ children, ...props }) => (
				<h6
					className="mt-4 scroll-m-20 font-medium text-base tracking-tight"
					{...props}
				>
					{children}
				</h6>
			),
			p: ({ children, ...props }) => (
				<P className="mt-6" {...props}>
					{children}
				</P>
			),
			a: ({ children, href, ...props }) => (
				<a
					href={href}
					className="font-medium text-primary underline underline-offset-4"
					target="_blank"
					rel="noopener noreferrer"
					{...props}
				>
					{children}
				</a>
			),
			ul: ({ children, ...props }) => <List {...props}>{children}</List>,
			ol: ({ children, ...props }) => (
				<ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props}>
					{children}
				</ol>
			),
			li: ({ children, ...props }) => <li {...props}>{children}</li>,
			blockquote: ({ children, ...props }) => (
				<Quote className="mt-6" {...props}>
					{children}
				</Quote>
			),
			hr: ({ ...props }) => (
				<Separator className="mt-6 mb-4" {...props} />
			),
			table: ({ ...props }) => <Table {...props} />,
			thead: ({ ...props }) => <TableHeader {...props} />,
			tbody: ({ ...props }) => <TableBody {...props} />,
			tfoot: ({ ...props }) => <TableFooter {...props} />,
			tr: ({ ...props }) => <TableRow {...props} />,
			th: ({ ...props }) => <TableHead {...props} />,
			td: ({ ...props }) => <TableCell {...props} />,
			pre: ({ ...props }) => <CodeContainer {...props} />,
			code: ({ children, className, ...props }) => {
				const match = /language-(\w+)/.exec(className || "");
				const code = children as string;

				if (match?.[1]) {
					const lang = match[1] as React.ComponentProps<
						typeof Code
					>["language"];

					return (
						<Code
							code={code}
							language={lang ? lang : "txt"}
							{...props}
						/>
					);
				}

				return <Code code={code} {...props} />;
			},
			img: ({ src, alt, ...props }) => (
				<img src={src} alt={alt} {...props} />
			),
		}),
		[],
	);

	const mergedComponents = React.useMemo(() => {
		return {
			...defaultComponents,
			...(components || {}),
		};
	}, [defaultComponents, components]);

	if (!children) {
		return null;
	}

	return (
		<div
			data-slot="markdown"
			className={cn(
				"prose prose-slate dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
				className,
			)}
			{...props}
		>
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				rehypePlugins={[rehypeRaw]}
				components={mergedComponents}
				urlTransform={urlTransform}
			>
				{children}
			</ReactMarkdown>
		</div>
	);
}

export { Markdown };
export type { MarkdownProps };
