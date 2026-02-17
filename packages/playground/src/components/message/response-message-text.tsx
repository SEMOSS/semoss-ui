import { CopyIcon, SkipForwardIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import {
	Button,
	Code,
	Markdown,
	ScrollArea,
	ScrollBar,
	Table,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { useMarkdownTypewriter } from "@/hooks/use-markdown-typewriter";
import type { ResponseMessageStore } from "@/stores";
import type { PixelMessageTextPart } from "@/types";

const TEXT_MARKDOWN_COMPONENTS = {
	code: ({ children, className, ...props }) => {
		const match = /language-(\w+)/.exec(className || "");
		const code = children as string;

		let lang: string = "";
		if (match?.[1]) {
			lang = match[1];
		}

		return (
			<div className="group/response-markdown relative">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							className="absolute top-0 right-0 bg-background opacity-0 transition-opacity group-hover/response-markdown:opacity-100"
							variant="ghost"
							size="icon"
							disabled={!code}
							onClick={() => {
								try {
									navigator.clipboard.writeText(code);

									toast.success(
										"Successfully copied to clipboard",
									);
								} catch (e) {
									toast.error(e.message);
								}
							}}
						>
							<CopyIcon />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="bottom">Copy Code</TooltipContent>
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
};

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
		const typewriter = useMarkdownTypewriter(part.text);

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
					components={TEXT_MARKDOWN_COMPONENTS}
					className="[&>*:first-child]:mt-0"
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
							Fast Forward to End
						</TooltipContent>
					</Tooltip>
				)}
			</>
		);
	},
);
