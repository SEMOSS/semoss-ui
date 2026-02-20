import { ChevronUpIcon, Quote } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { cn, H1, H2, H3, H4, Markdown, P, Separator } from "@semoss/ui/next";
import { useMarkdownTypewriter } from "@/hooks/use-markdown-typewriter";
import type { ResponseMessageStore } from "@/stores";
import type { PixelMessageThinkingPart } from "@/types";

const THINKING_MARKDOWN_COMPONENTS = {
	h1: ({ children, ...props }) => (
		<H1 className="text-inherit text-sm" {...props}>
			{children}
		</H1>
	),
	h2: ({ children, ...props }) => (
		<H2 className="mt-2 text-inherit text-sm" {...props}>
			{children}
		</H2>
	),
	h3: ({ children, ...props }) => (
		<H3 className="mt-2 text-inherit text-sm" {...props}>
			{children}
		</H3>
	),
	h4: ({ children, ...props }) => (
		<H4 className="mt-2 text-inherit text-sm" {...props}>
			{children}
		</H4>
	),
	h5: ({ children, ...props }) => (
		<h5
			className="mt-1 scroll-m-20 font-medium text-inherit text-sm tracking-tight"
			{...props}
		>
			{children}
		</h5>
	),
	h6: ({ children, ...props }) => (
		<h6
			className="mt-1 scroll-m-20 font-medium text-inherit text-sm tracking-tight"
			{...props}
		>
			{children}
		</h6>
	),
	p: ({ children, ...props }) => (
		<P className="mt-1 text-inherit text-sm" {...props}>
			{children}
		</P>
	),
	a: ({ children, href, ...props }) => (
		<a
			href={href}
			className="font-medium text-primary text-sm underline underline-offset-1"
			target="_blank"
			rel="noopener noreferrer"
			{...props}
		>
			{children}
		</a>
	),
	ul: ({ children, ...props }) => (
		<ul
			className="my-1 ml-4 list-disc text-inherit text-sm [&>li]:mt-1"
			{...props}
		>
			{children}
		</ul>
	),
	ol: ({ children, ...props }) => (
		<ol
			className="my-1 ml-4 list-decimal text-inherit text-sm [&>li]:mt-1"
			{...props}
		>
			{children}
		</ol>
	),
	li: ({ children, ...props }) => (
		<li className="text-inherit text-sm" {...props}>
			{children}
		</li>
	),
	blockquote: ({ children, ...props }) => (
		<Quote className="mt-1" {...props}>
			{children}
		</Quote>
	),
	hr: ({ ...props }) => <Separator className="mt-2 mb-1" {...props} />,
};

interface ResponseMessageThinkingProps {
	/** Message to render */
	message: ResponseMessageStore;

	/** Thinking to render */
	part: PixelMessageThinkingPart;

	/** Is it the last part */
	isLast: boolean;
}

export const ResponseMessageThinking: React.FC<ResponseMessageThinkingProps> =
	observer(({ message, part, isLast }) => {
		const [isForcedOpen, setIsForcedOpen] = useState<boolean>(false);
		const typewriter = useMarkdownTypewriter(part.thinking);

		useEffect(() => {
			if (message.isThinking && isLast) {
				typewriter.start();
			}
		}, [message.isThinking, typewriter.start, isLast]);

		useEffect(() => {
			if (!isLast) {
				typewriter.skipToEnd();
			}
		}, [isLast, typewriter.skipToEnd]);

		if (!part.thinking) {
			return null;
		}

		const isOpen = isForcedOpen || message.isThinking;

		return (
			<div className="relative mb-2">
				<ChevronUpIcon
					className="pointer-events-none absolute top-0 left-0 size-4 shrink-0 translate-y-0.5 text-muted-foreground transition-transform duration-200 data-[state=closed]:rotate-90 data-[state=open]:rotate-180"
					data-state={isOpen ? "open" : "closed"}
				/>
				{/* biome-ignore lint/a11y/noStaticElementInteractions: cannot make it a button because it contains interactive elements like links */}
				<div
					className={cn(
						"w-full cursor-pointer overflow-hidden text-left text-muted-foreground text-xs hover:text-accent-foreground",
						isOpen ? "" : "line-clamp-1",
					)}
					onClick={() => setIsForcedOpen(!isForcedOpen)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							setIsForcedOpen(!isForcedOpen);
						}
					}}
					data-state={isOpen ? "open" : "closed"}
				>
					<Markdown
						className="pl-6 [&>*:first-child]:mt-0"
						components={THINKING_MARKDOWN_COMPONENTS}
					>
						{typewriter.isTyping
							? typewriter.rendered
							: part.thinking}
					</Markdown>
				</div>

				{/* Fade overlay when collapsed */}
				<div
					className={cn(
						"absolute right-0 bottom-0 left-0 h-3",
						"bg-linear-to-t from-background to-transparent",
						"pointer-events-none transition-opacity duration-300",
						isOpen ? "opacity-0" : "opacity-100",
					)}
				/>
			</div>
		);
	});
