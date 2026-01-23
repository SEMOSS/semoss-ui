import { Quote } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
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
import { useMarkdownTypewriter } from "@/hooks";
import { useLoadingMessage } from "@/hooks/use-loading-messages";
import type { ResponseMessageStore, RoomStore } from "@/stores";

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
	/** Room */
	room: RoomStore;

	/** Message to render */
	message: ResponseMessageStore;
}

export const ResponseMessageThinking: React.FC<ResponseMessageThinkingProps> =
	observer(({ room, message }) => {
		const thinkingMessage = useLoadingMessage(room.isLoading);
		const [thinking, setThinking] = useState<string>("");

		const typewriter = useMarkdownTypewriter(message.thinking);

		useEffect(() => {
			if (message.isThinking) {
				typewriter.start();
			}
		}, [message.isThinking, typewriter.start]);

		if (message.isThinking || message.thinking.length > 0) {
			return (
				<Accordion
					type="single"
					collapsible
					className="rounded-lg border p-3 text-muted-foreground text-sm shadow-sm"
					value={message.isThinking ? "thinking" : thinking}
					onValueChange={(val) => setThinking(val || "")}
				>
					<AccordionItem value="thinking">
						<AccordionTrigger className="p-0">
							<span className="font-medium">Thinking</span>
						</AccordionTrigger>
						<AccordionContent className="pt-2">
							<Markdown
								className="[&>*:first-child]:mt-0"
								components={THINKING_MARKDOWN_COMPONENTS}
							>
								{typewriter.isTyping
									? typewriter.rendered
									: message.thinking || thinkingMessage}
							</Markdown>
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			);
		}
	});
