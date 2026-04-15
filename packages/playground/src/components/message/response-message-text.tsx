import {
	ChevronDownIcon,
	ChevronUpIcon,
	CopyIcon,
	SkipForwardIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Code,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	H1,
	H2,
	H3,
	H4,
	Markdown,
	P,
	Quote,
	ScrollArea,
	ScrollBar,
	Separator,
	Table,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { useMarkdownTypewriter } from "@/hooks/use-markdown-typewriter";
import type { ResponseMessageStore, RoomStore } from "@/stores";
import type { PixelMessageTextPart } from "@/types";

const HTML_TAG_REGEX = /<\/?[a-z][\w:-]*(\s[^>]*)?>|<!doctype html>/i;
const HTML_PREVIEW_STREAM_THROTTLE_MS = 180;

const getErrorMessage = (error: unknown): string => {
	if (error instanceof Error && error.message) {
		return error.message;
	}

	return "Unable to copy content";
};

const copyToClipboard = async (
	value: string,
	onSuccess: () => void,
	onError: (message: string) => void,
) => {
	try {
		await navigator.clipboard.writeText(value);
		onSuccess();
	} catch (error) {
		onError(getErrorMessage(error));
	}
};

const extractStandaloneHtml = (content: string): string | null => {
	const trimmed = content.trim();

	if (!trimmed || trimmed.includes("```")) {
		return null;
	}

	if (!trimmed.startsWith("<") || !trimmed.endsWith(">")) {
		return null;
	}

	if (!HTML_TAG_REGEX.test(trimmed)) {
		return null;
	}

	return trimmed;
};

const useBufferedPreviewHtml = (html: string, isLoading?: boolean): string => {
	const [bufferedHtml, setBufferedHtml] = useState(html);
	const latestHtmlRef = useRef(html);
	const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	latestHtmlRef.current = html;

	useEffect(() => {
		if (!isLoading) {
			if (flushTimerRef.current) {
				clearTimeout(flushTimerRef.current);
				flushTimerRef.current = null;
			}

			setBufferedHtml(html);
			return;
		}

		if (!flushTimerRef.current) {
			flushTimerRef.current = setTimeout(() => {
				flushTimerRef.current = null;
				setBufferedHtml(latestHtmlRef.current);
			}, HTML_PREVIEW_STREAM_THROTTLE_MS);
		}
	}, [html, isLoading]);

	useEffect(() => {
		return () => {
			if (flushTimerRef.current) {
				clearTimeout(flushTimerRef.current);
			}
		};
	}, []);

	return bufferedHtml;
};

interface HtmlPreviewBlockProps {
	html: string;
	room?: RoomStore;
	isLoading?: boolean;
	copyTooltip: string;
	copySuccessMessage: string;
	copyLabel: string;
}

const createHtmlResponseFilePath = (): string => {
	return `save-html-response-${Date.now()}.html`;
};

const HtmlPreviewBlock: React.FC<HtmlPreviewBlockProps> = ({
	html,
	room,
	isLoading,
	copyTooltip,
	copySuccessMessage,
	copyLabel,
}) => {
	const [isFullViewOpen, setIsFullViewOpen] = useState(false);
	const [isSavingToRoom, setIsSavingToRoom] = useState(false);
	const [isCollapsed, setIsCollapsed] = useState(false);
	const previewHtml = useBufferedPreviewHtml(html, isLoading);

	const saveInRoom = async () => {
		if (!room || !html) {
			return;
		}

		const filePath = createHtmlResponseFilePath();
		try {
			setIsSavingToRoom(true);

			await room.runRoomPixel(
				`SaveInsightAssets(filePath=[${JSON.stringify(filePath)}], content=["<encode>${html}</encode>"]);`,
				false,
				false,
			);

			toast.success(`Saved in room as ${filePath}`);
		} catch (error) {
			toast.error(getErrorMessage(error));
		} finally {
			setIsSavingToRoom(false);
		}
	};

	return (
		<>
			<div className="relative overflow-hidden rounded-md border border-border bg-background">
				<div className="border-border border-b px-3 py-2 text-muted-foreground text-xs">
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-1">
							<button
								type="button"
								aria-label={
									isCollapsed
										? "Expand preview"
										: "Collapse preview"
								}
								className="inline-flex size-5 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
								disabled={!html}
								onClick={() =>
									setIsCollapsed((previous) => !previous)
								}
							>
								{isCollapsed ? (
									<ChevronDownIcon className="size-3.5" />
								) : (
									<ChevronUpIcon className="size-3.5" />
								)}
							</button>
							<span>
								HTML Preview
								{isCollapsed ? " - Collapsed" : ""}
							</span>
						</div>
						<div className="flex items-center gap-1">
							<Button
								className="-my-1 h-6 px-2 text-muted-foreground text-xs hover:text-foreground"
								variant="ghost"
								size="sm"
								disabled={
									!room ||
									!html ||
									isSavingToRoom ||
									isLoading
								}
								onClick={() => {
									void saveInRoom();
								}}
							>
								{isSavingToRoom ? "Saving..." : "Save In Room"}
							</Button>
							<Button
								className="-my-1 h-6 px-2 text-muted-foreground text-xs hover:text-foreground"
								variant="ghost"
								size="sm"
								disabled={isLoading}
								onClick={() => setIsFullViewOpen(true)}
							>
								Full View
							</Button>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										className="-my-1 -mr-2 h-6 gap-1 px-2 text-muted-foreground text-xs hover:text-foreground"
										variant="ghost"
										size="sm"
										disabled={!html || isLoading}
										onClick={() => {
											void copyToClipboard(
												html,
												() =>
													toast.success(
														copySuccessMessage,
													),
												(message) =>
													toast.error(message),
											);
										}}
									>
										<CopyIcon className="size-3.5" />
										{copyLabel}
									</Button>
								</TooltipTrigger>
								<TooltipContent side="bottom">
									{copyTooltip}
								</TooltipContent>
							</Tooltip>
						</div>
					</div>
				</div>
				{!isCollapsed && (
					<div className="relative">
						<iframe
							title="HTML Preview"
							className="h-[70dvh] min-h-[34rem] w-full border-0 bg-white"
							sandbox="allow-scripts"
							referrerPolicy="no-referrer"
							srcDoc={previewHtml}
						/>
						{isLoading && (
							<div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
								<div className="rounded-md border border-border/70 bg-background/75 px-3 py-1 font-medium text-[11px] text-muted-foreground uppercase tracking-[0.08em] shadow-sm">
									Loading Preview...
								</div>
							</div>
						)}
					</div>
				)}
			</div>
			<Dialog open={isFullViewOpen} onOpenChange={setIsFullViewOpen}>
				<DialogContent className="h-[100dvh] max-h-[100dvh] w-[100dvw] max-w-[100dvw] grid-rows-[auto_1fr] overflow-hidden rounded-none border-0 p-3 sm:w-[100dvw] sm:max-w-[100dvw]">
					<DialogHeader>
						<DialogTitle>HTML Preview</DialogTitle>
					</DialogHeader>
					<div className="relative h-full min-h-0">
						<iframe
							title="HTML Preview Full View"
							className="h-full min-h-0 w-full rounded-md border border-border bg-white"
							sandbox="allow-scripts"
							referrerPolicy="no-referrer"
							srcDoc={previewHtml}
						/>
						{isLoading && (
							<div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
								<div className="rounded-md border border-border/70 bg-background/75 px-3 py-1 font-medium text-[11px] text-muted-foreground uppercase tracking-[0.08em] shadow-sm">
									Loading Preview...
								</div>
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
};

const createMarkdownComponents = (
	room?: RoomStore,
	isHtmlPreviewLoading?: boolean,
) => ({
	h1: ({ children, ...props }) => (
		<H1 className="mt-5 font-semibold text-2xl text-inherit" {...props}>
			{children}
		</H1>
	),
	h2: ({ children, ...props }) => (
		<H2 className="mt-4 font-semibold text-inherit text-xl" {...props}>
			{children}
		</H2>
	),
	h3: ({ children, ...props }) => (
		<H3 className="mt-4 text-inherit text-lg" {...props}>
			{children}
		</H3>
	),
	h4: ({ children, ...props }) => (
		<H4 className="mt-3 text-inherit text-lg" {...props}>
			{children}
		</H4>
	),
	h5: ({ children, ...props }) => (
		<h5
			className="mt-2 scroll-m-20 font-semibold text-base text-inherit tracking-tight"
			{...props}
		>
			{children}
		</h5>
	),
	h6: ({ children, ...props }) => (
		<h6
			className="mt-2 scroll-m-20 font-medium text-base text-inherit tracking-tight"
			{...props}
		>
			{children}
		</h6>
	),
	p: ({ children, ...props }) => (
		<P className="mt-2 text-base text-inherit" {...props}>
			{children}
		</P>
	),
	a: ({ children, href, ...props }) => {
		if (href?.startsWith("room://") && room) {
			const path = `/${href.slice("room://".length)}`;

			// Folder link — ends with "/"
			if (path.endsWith("/")) {
				return (
					<button
						type="button"
						className="cursor-pointer font-medium text-base text-primary underline underline-offset-1"
						onClick={() => {
							room.addSidebarNode(`FILE_EXPLORER--${path}`, {
								type: "tab",
								name: "Files",
								component: "room-file-explorer",
								config: { initialPath: path },
								enableClose: true,
							});
						}}
					>
						{children}
					</button>
				);
			}

			// File link
			const filename = path.split("/").filter(Boolean).pop() ?? path;
			return (
				<button
					type="button"
					className="cursor-pointer font-medium text-base text-primary underline underline-offset-1"
					onClick={() => {
						room.addSidebarNode("FILE_EXPLORER", {
							type: "tab",
							name: "Files",
							component: "room-file-explorer",
							config: {},
							enableClose: true,
						});
						room.addSidebarNode(`FILE--${path}`, {
							type: "tab",
							name: filename,
							component: "room-file-editor",
							config: { name: filename, path },
							enableClose: true,
						});
					}}
				>
					{children}
				</button>
			);
		}
		return (
			<a
				href={href}
				className="font-medium text-base text-primary underline underline-offset-1"
				target="_blank"
				rel="noopener noreferrer"
				{...props}
			>
				{children}
			</a>
		);
	},
	ul: ({ children, ...props }) => (
		<ul
			className="my-1 ml-4 list-disc text-base text-inherit [&>li]:mt-1"
			{...props}
		>
			{children}
		</ul>
	),
	ol: ({ children, ...props }) => (
		<ol
			className="my-1 ml-4 list-decimal text-base text-inherit [&>li]:mt-1"
			{...props}
		>
			{children}
		</ol>
	),
	li: ({ children, ...props }) => (
		<li className="text-base text-inherit" {...props}>
			{children}
		</li>
	),
	blockquote: ({ children, ...props }) => (
		<Quote className="mt-1" {...props}>
			{children}
		</Quote>
	),
	hr: ({ ...props }) => <Separator className="mt-2 mb-1" {...props} />,
	code: ({ children, className, ...props }) => {
		const { t } = useTranslation("chat");
		// react-markdown sets className to "language-<lang>" on fenced code blocks.
		// Inline code (single backtick) has no className, so match will be null.
		const match = /language-(\w+)/.exec(className || "");
		const code = children as string;

		// Inline code — no language class means this is a `backtick` snippet inside
		// a paragraph. Return a plain <code> so we don't nest a <div> inside a <p>.
		if (!match?.[1]) {
			return (
				<code className={className} {...props}>
					{children}
				</code>
			);
		}

		// Fenced code block — render the full UI with copy button and syntax highlighting.
		const lang = match[1].toLowerCase() as React.ComponentProps<
			typeof Code
		>["language"];

		if (lang === "html") {
			return (
				<HtmlPreviewBlock
					html={code}
					room={room}
					isLoading={isHtmlPreviewLoading}
					copyTooltip="Copy"
					copySuccessMessage={t("notifications.copySuccess")}
					copyLabel="Copy"
				/>
			);
		}

		return (
			<div className="group/response-markdown relative">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							className="-ml-[120px] sticky top-0 right-0 z-10 float-right bg-background opacity-0 transition-opacity group-hover/response-markdown:opacity-100"
							variant="ghost"
							size="icon"
							disabled={!code}
							onClick={() => {
								void copyToClipboard(
									code,
									() =>
										toast.success(
											t("notifications.copySuccess"),
										),
									(message) => toast.error(message),
								);
							}}
						>
							<CopyIcon />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="bottom">
						{t("response.copyCode")}
					</TooltipContent>
				</Tooltip>
				<Code code={code} language={lang ? lang : "txt"} {...props} />
			</div>
		);
	},
	table: ({ ...props }) => (
		<ScrollArea className="w-full">
			<ScrollBar orientation="horizontal"></ScrollBar>
			<Table {...props} />
		</ScrollArea>
	),
});

interface ResponseMessageTextProps {
	/** Message to render */
	message: ResponseMessageStore;

	/** Thinking to render */
	part: PixelMessageTextPart;

	/** Is it the last part */
	isLast: boolean;
}

export const ResponseMessageText: React.FC<ResponseMessageTextProps> = observer(
	({ message, part, isLast }) => {
		const { t } = useTranslation("chat");
		const typewriter = useMarkdownTypewriter(part.text);
		const renderedText = typewriter.isTyping
			? typewriter.rendered
			: part.text;
		const isPreviewLoading =
			isLast && (message.isThinking || typewriter.isTyping);
		const standaloneHtml = useMemo(
			() => extractStandaloneHtml(renderedText),
			[renderedText],
		);
		const components = useMemo(
			() => createMarkdownComponents(message.room, isPreviewLoading),
			[message.room, isPreviewLoading],
		);

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

		return (
			<>
				{standaloneHtml ? (
					<HtmlPreviewBlock
						html={standaloneHtml}
						room={message.room}
						isLoading={isPreviewLoading}
						copyTooltip="Copy"
						copySuccessMessage={t("notifications.copySuccess")}
						copyLabel="Copy"
					/>
				) : (
					<Markdown
						components={components}
						className="[&>*:first-child]:mt-0"
						urlTransform={(url) => {
							if (url.startsWith("room://")) return url;
							if (/^(https?:|mailto:|#)/.test(url)) return url;
							return "";
						}}
					>
						{renderedText}
					</Markdown>
				)}
				{typewriter.isTyping && !message.isThinking && isLast && (
					<Tooltip>
						<TooltipTrigger asChild>
							<span className="absolute right-4 bottom-4 z-50">
								<Button
									size="icon-sm"
									variant={"outline"}
									disabled={!part.text}
									onClick={() => typewriter.skipToEnd()}
									aria-label="Fast Forward to End"
									className="shadow-lg"
								>
									<SkipForwardIcon />
								</Button>
							</span>
						</TooltipTrigger>
						<TooltipContent side="bottom">
							{t("response.fastForwardToEnd")}
						</TooltipContent>
					</Tooltip>
				)}
			</>
		);
	},
);
