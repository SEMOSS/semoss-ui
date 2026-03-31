import { CopyIcon, Quote, SkipForwardIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Code,
	H1,
	H2,
	H3,
	H4,
	Markdown,
	P,
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

const createMarkdownComponents = (room?: RoomStore) => ({
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
			const path = "/" + href.slice("room://".length);

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
		const lang = match[1];

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
								try {
									navigator.clipboard.writeText(code);

									toast.success(
										t("notifications.copySuccess"),
									);
								} catch (e) {
									toast.error(e.message);
								}
							}}
						>
							<CopyIcon />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="bottom">
						{t("response.copyCode")}
					</TooltipContent>
				</Tooltip>
				<Code code={code} lang={lang || undefined} {...props} />
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
		const components = useMemo(
			() => createMarkdownComponents(message.room),
			[message.room],
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
				<Markdown
					components={components}
					className="[&>*:first-child]:mt-0"
					urlTransform={(url) => {
						if (url.startsWith("room://")) return url;
						if (/^(https?:|mailto:|#)/.test(url)) return url;
						return "";
					}}
				>
					{typewriter.isTyping ? typewriter.rendered : part.text}
				</Markdown>
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
