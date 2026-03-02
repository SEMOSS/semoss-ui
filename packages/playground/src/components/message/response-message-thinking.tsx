import { Quote } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	H1,
	H2,
	H3,
	H4,
	Markdown,
	P,
	Separator,
} from "@semoss/ui/next";
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
		const [thinking, setThinking] = useState<string>("");
		const typewriter = useMarkdownTypewriter(part.thinking);
		const previewRef = useRef<HTMLDivElement>(null);

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

		// Auto-scroll preview to bottom when content changes
		useEffect(() => {
			if (previewRef.current && !thinking) {
				previewRef.current.scrollTop = previewRef.current.scrollHeight;
			}
		}, [thinking]);

		if (!part.thinking) {
			return null;
		}

		const isOpen = thinking === "thinking";

		return (
			<Accordion
				type="single"
				collapsible
				className="mb-2 rounded-lg border border-border text-muted-foreground text-sm shadow-sm"
				value={thinking}
				onValueChange={(val) => setThinking(val || "")}
			>
				<AccordionItem value="thinking" className="border-0">
					<div className="p-3">
						<AccordionTrigger className="p-0 hover:no-underline">
							<span className="font-medium">Thinking</span>
						</AccordionTrigger>
						{!isOpen && (
							<div
								ref={previewRef}
								className="relative mt-2 max-h-12 overflow-hidden"
							>
								<Markdown
									className="text-xs [&>*:first-child]:mt-0"
									components={THINKING_MARKDOWN_COMPONENTS}
								>
									{typewriter.isTyping
										? typewriter.rendered
										: part.thinking}
								</Markdown>
								{/* Fade overlay at bottom */}
								<div className="pointer-events-none absolute right-0 bottom-0 left-0 h-6 bg-linear-to-t from-background to-transparent" />
							</div>
						)}
					</div>
					<AccordionContent className="px-3 pt-0 pb-3">
						<Markdown
							className="[&>*:first-child]:mt-0"
							components={THINKING_MARKDOWN_COMPONENTS}
						>
							{typewriter.isTyping
								? typewriter.rendered
								: part.thinking}
						</Markdown>
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		);
	});
