import { load as parseYaml } from "js-yaml";
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

const FRONTMATTER_PATTERN = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

function isPrimative(value: unknown): value is string | number | boolean {
	const type = typeof value;
	return type === "string" || type === "number" || type === "boolean";
}

function isObject(value: unknown): value is Record<string, unknown> {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return false;
	}

	return true;
}

function toCodeString(value: unknown): string {
	const output = JSON.stringify(value, null, 2);
	if (output) {
		return output;
	}

	return String(value);
}

function renderFrontmatterValue(value: unknown): React.ReactNode {
	if (isPrimative(value)) {
		return String(value);
	}

	if (value === null) {
		return <span className="text-muted-foreground">null</span>;
	}

	if (Array.isArray(value)) {
		if (value.length === 0) {
			return <span className="text-muted-foreground">[]</span>;
		}

		if (value.every((item) => isPrimative(item))) {
			return value.join(", ");
		}

		return (
			<CodeContainer className="mt-0 rounded-md border bg-muted/40 p-2">
				<Code code={toCodeString(value)} language="json" />
			</CodeContainer>
		);
	}

	if (isObject(value)) {
		if (Object.keys(value).length === 0) {
			return <span className="text-muted-foreground">{"{}"}</span>;
		}

		return (
			<CodeContainer className="mt-0 rounded-md border bg-muted/40 p-2">
				<Code code={toCodeString(value)} language="json" />
			</CodeContainer>
		);
	}

	return (
		<CodeContainer className="mt-0 rounded-md border bg-muted/40 p-2">
			<Code code={toCodeString(value)} language="json" />
		</CodeContainer>
	);
}

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
				<ol className="my-6 ms-6 list-decimal [&>li]:mt-2" {...props}>
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

	const { content, frontmatter } = React.useMemo(() => {
		if (!children) {
			return {
				content: children || "",
				frontmatter: null,
			};
		}

		const match = FRONTMATTER_PATTERN.exec(children);
		if (!match) {
			return {
				content: children,
				frontmatter: null,
			};
		}

		const frontmatterText = match[1];
		const markdownContent = children.slice(match[0].length);

		try {
			const parsed = parseYaml(frontmatterText);
			if (isObject(parsed)) {
				return {
					content: markdownContent,
					frontmatter: {
						kind: "parsed",
						value: parsed,
					},
				};
			}
		} catch {
			return {
				content: markdownContent,
				frontmatter: {
					kind: "raw",
					value: frontmatterText,
				},
			};
		}

		return {
			content: markdownContent,
			frontmatter: null,
		};
	}, [children]);

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
			{frontmatter && frontmatter.kind === "raw" && frontmatter.value && (
				<section className="not-prose mt-2 mb-6">
					<CodeContainer className="overflow-hidden rounded-xl border bg-background">
						<Code
							code={String(frontmatter.value)}
							language="yaml"
						/>
					</CodeContainer>
				</section>
			)}
			{frontmatter &&
				frontmatter.kind === "parsed" &&
				Object.entries(frontmatter.value).length > 0 && (
					<section className="not-prose mt-2 mb-6">
						<Table wrapperClassName="overflow-y-hidden rounded-xl border bg-background">
							<TableBody>
								{Object.entries(frontmatter.value).map(
									([key, value]) => {
										return (
											<TableRow key={key}>
												<TableCell
													className="max-w-[200px] truncate align-top font-medium"
													title={String(key)}
												>
													{key}
												</TableCell>
												<TableCell className="whitespace-normal align-top">
													{renderFrontmatterValue(
														value,
													)}
												</TableCell>
											</TableRow>
										);
									},
								)}
							</TableBody>
						</Table>
					</section>
				)}

			{content && (
				<ReactMarkdown
					remarkPlugins={[remarkGfm]}
					rehypePlugins={[rehypeRaw]}
					components={mergedComponents}
					urlTransform={urlTransform}
				>
					{content}
				</ReactMarkdown>
			)}
		</div>
	);
}

export { Markdown };
export type { MarkdownProps };
