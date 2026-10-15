import { ChevronRightIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { type ComponentProps, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
	H1,
	H2,
	H3,
	H4,
	Markdown,
	P,
	Separator,
	Spinner,
} from "@semoss/ui/next";
import type { ChunkStatus } from "@/hooks/use-active-index";
import type { ResponseMessageStore } from "@/stores/message/response-message.store";
import type { PixelMessageThinkingPart } from "@/types";

type MarkdownComponents = NonNullable<
	ComponentProps<typeof Markdown>["components"]
>;

const THINKING_MARKDOWN_COMPONENTS: MarkdownComponents = {
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
			className="my-1 ms-4 list-disc text-inherit text-sm [&>li]:mt-1"
			{...props}
		>
			{children}
		</ul>
	),
	ol: ({ children, ...props }) => (
		<ol
			className="my-1 ms-4 list-decimal text-inherit text-sm [&>li]:mt-1"
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
		<blockquote
			className="mt-1 border-border border-s-2 ps-3 text-inherit text-sm italic"
			{...props}
		>
			{children}
		</blockquote>
	),
	hr: ({ ...props }) => <Separator className="mt-2 mb-1" {...props} />,
};

interface ResponseMessageThinkingProps {
	/** Owning response, retained for compatibility with existing callers. */
	message: ResponseMessageStore;
	/** Reasoning supplied by the backend. */
	part: PixelMessageThinkingPart;
	/** Position in the transcript reveal queue. */
	status: ChunkStatus;
	/** Whether this is the initial streamed view. */
	isFirstView: boolean;
}

/** Reasoning is available on demand without displacing the conversation. */
export const ResponseMessageThinking = observer(
	({ part, status }: ResponseMessageThinkingProps) => {
		const { t } = useTranslation("room");
		const [isOpen, setIsOpen] = useState(false);
		if (status === "not_started") return null;
		return (
			<Collapsible open={isOpen} onOpenChange={setIsOpen}>
				<CollapsibleTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className="gap-2 text-muted-foreground"
					>
						<ChevronRightIcon
							aria-hidden="true"
							className={cn("size-4", isOpen && "rotate-90")}
						/>
						{t("studio.thinking")}
						{status === "active" && <Spinner />}
					</Button>
				</CollapsibleTrigger>
				<CollapsibleContent className="max-h-64 overflow-auto border-s-2 ps-4 text-muted-foreground">
					<Markdown
						dir="auto"
						components={THINKING_MARKDOWN_COMPONENTS}
					>
						{part.thinking}
					</Markdown>
				</CollapsibleContent>
			</Collapsible>
		);
	},
);
