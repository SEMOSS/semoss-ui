import {
	ArrowLeftIcon,
	ArrowRightIcon,
	CircleAlert,
	CopyIcon,
	MessageCircleIcon,
	Quote,
	RefreshCwIcon,
	ThumbsDownIcon,
	ThumbsUpIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Button,
	H1,
	H2,
	H3,
	H4,
	Markdown,
	P,
	Separator,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { useLoadingMessage } from "@/hooks/useLoadingMessage";
import {
	InputMessageStore,
	type ResponseMessageStore,
	type RoomStore,
	RootMessageStore,
} from "@/stores";
import { AppLogo } from "../common";
import { ResponseMessageTool } from "./response-message-tool";

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
			className="font-medium text-primary text-primary text-sm underline underline-offset-1"
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

interface ResponseMessageProps {
	/** Room */
	room: RoomStore;

	/** Message to render */
	message: ResponseMessageStore;
}

export const ResponseMessage: React.FC<ResponseMessageProps> = observer(
	({ room, message }) => {
		const thinkingMessage = useLoadingMessage(room.isLoading);

		const [thinking, setThinking] = useState<string>("");

		// get the parent input message
		let inputMessage: InputMessageStore | null = null;
		if (message.parent instanceof InputMessageStore) {
			inputMessage = message.parent;
		}

		/**
		 * Copy the text
		 * @param text - text to copy
		 */
		const copyMessage = (text: string) => {
			try {
				navigator.clipboard.writeText(text);

				toast.success("Successfully copied to clipboard");
			} catch (e) {
				toast.error(e.message);
			}
		};

		/**
		 * Record the feedback
		 * @param rating - positive or negative
		 */
		const recordFeedback = async (rating: boolean) => {
			try {
				await message.recordFeedback(rating);

				toast.success("Successfully saved feedback");
			} catch (e) {
				toast.error(e.message);
			}
		};

		/**
		 * Copy the text
		 * @param text - text to copy
		 */
		const rewriteMessage = async () => {
			try {
				await message.rewriteMessage();

				toast.success("Successfully rewrote message");
			} catch (e) {
				toast.error(e.message);
			}
		};

		const areToolsActive =
			message.type === "RESPONSE" &&
			message.tools.some((tool) => !tool.response);

		return (
			<div className="group mb-0 flex w-full flex-col gap-4">
				<div className="group flex flex-row items-center gap-2">
					{message.isThinking ? (
						<div className="flex size-4 animate-spin items-center justify-center">
							<AppLogo full={false} />
						</div>
					) : (
						<MessageCircleIcon className="size-4" />
					)}
					<span className="mr-0.5 font-medium text-base">
						{message.model.name ?? "Agent"}
					</span>
				</div>
				{(message.isThinking || message.thinking.length > 0) && (
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
									{message.thinking || thinkingMessage}
								</Markdown>
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				)}
				{message.text ? (
					<Markdown className="[&>*:first-child]:mt-0">
						{message.text}
					</Markdown>
				) : null}
				{message.tools.map((t) => (
					<ResponseMessageTool
						key={`tool-${t.id}`}
						message={message}
						tool={t}
					/>
				))}
				{areToolsActive && (
					<p className="mt-2 flex items-center gap-2 text-muted-foreground text-sm">
						<CircleAlert className="size-4" />
						Please complete the tool(s) to proceed.
					</p>
				)}
				<div className="-ml-2.5 flex flex-1 flex-row items-center justify-start gap-1 opacity-0 transition-opacity group-hover:opacity-100">
					{inputMessage?.siblings.length > 1 && (
						<>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										disabled={!inputMessage.previousSibling}
										onClick={() => {
											if (!inputMessage.previousSibling) {
												return;
											}

											inputMessage.previousSibling.activateMessage();
										}}
									>
										<ArrowLeftIcon />
									</Button>
								</TooltipTrigger>
								<TooltipContent side="bottom">
									Previous Message
								</TooltipContent>
							</Tooltip>
							<span className="text-muted-foreground text-xs">
								{inputMessage.position + 1}/
								{inputMessage.siblings.length}
							</span>

							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										disabled={!inputMessage.nextSibling}
										onClick={() => {
											if (!inputMessage.nextSibling) {
												return;
											}

											inputMessage.nextSibling.activateMessage();
										}}
									>
										<ArrowRightIcon />
									</Button>
								</TooltipTrigger>
								<TooltipContent side="bottom">
									Next Message
								</TooltipContent>
							</Tooltip>
						</>
					)}

					{inputMessage && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									disabled={
										inputMessage.parent instanceof
											RootMessageStore ||
										message.room.mode === "executing"
									}
									variant="ghost"
									size="icon"
									onClick={() => {
										rewriteMessage();
									}}
								>
									<RefreshCwIcon />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="bottom">
								Rewrite Message
							</TooltipContent>
						</Tooltip>
					)}

					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => {
									recordFeedback(true);
								}}
							>
								<ThumbsUpIcon />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">
							Share Positive Feedback
						</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => {
									recordFeedback(false);
								}}
							>
								<ThumbsDownIcon />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">
							Share Negative Feedback
						</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								disabled={!message.text}
								onClick={() => {
									if (!message.text) {
										return;
									}

									copyMessage(message.text);
								}}
							>
								<CopyIcon />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">
							Copy Response
						</TooltipContent>
					</Tooltip>
				</div>
			</div>
		);
	},
);
