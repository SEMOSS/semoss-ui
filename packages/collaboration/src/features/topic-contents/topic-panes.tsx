import { ArrowLeft } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { Button, cn, H2, P } from "@semoss/ui/next";

interface TopicPanesProps {
	/** The list of what can be in the topic. */
	list: ReactNode;
	/** The open row, in full; absent while nothing is open. */
	reader?: ReactNode;
	/** Names the open row in the pane's bar. */
	readerTitle?: string;
	/** Beside the title, such as the open row's own add button. */
	readerAction?: ReactNode;
	onCloseReader: () => void;
	/** What the empty pane asks for; absent where the list has nothing to read and so no pane. */
	readerPrompt?: string;
}

/**
 * A list beside its reading pane, as a mail app has them. On a narrow screen the open row takes the list's
 * place, with a way back.
 */
export function TopicPanes({
	list,
	reader,
	readerTitle,
	readerAction,
	onCloseReader,
	readerPrompt,
}: TopicPanesProps) {
	const backRef = useRef<HTMLButtonElement>(null);
	// the row that opened the pane, for when a narrow screen comes back to the list
	const lastRowRef = useRef<HTMLElement | null>(null);
	const isReading = reader !== undefined;
	const wasReadingRef = useRef(false);
	useEffect(() => {
		// the back button only shows where the pane has replaced the list, taking the focused row with it
		if (isReading && backRef.current?.offsetParent) backRef.current.focus();
		// and going back takes the button away, so the keyboard returns to the row it came from
		else if (
			!isReading &&
			wasReadingRef.current &&
			document.activeElement === document.body
		)
			lastRowRef.current?.focus();
		wasReadingRef.current = isReading;
	}, [isReading]);

	return (
		<div className="flex min-h-0 min-w-0 flex-1">
			<div
				className={cn(
					"min-h-0 min-w-0 flex-1 flex-col",
					isReading ? "hidden xl:flex" : "flex",
					readerPrompt && "xl:max-w-md xl:border-r",
				)}
				// a click, not a focus: Safari does not focus a button it clicks
				onClickCapture={(event) => {
					if (event.target instanceof Element)
						lastRowRef.current = event.target.closest("button");
				}}
			>
				{list}
			</div>
			{readerPrompt && (
				<section
					aria-label="Reading pane"
					className={cn(
						"min-h-0 min-w-0 flex-1 flex-col xl:flex",
						isReading ? "flex" : "hidden",
					)}
				>
					{isReading ? (
						<>
							<div className="flex min-h-12 shrink-0 items-center gap-2 border-b px-3 py-2">
								<Button
									ref={backRef}
									type="button"
									variant="ghost"
									size="icon-sm"
									className="pointer-coarse:size-11 shrink-0 xl:hidden"
									aria-label="Back to the list"
									onClick={onCloseReader}
								>
									<ArrowLeft aria-hidden="true" />
								</Button>
								<H2 className="wrap-anywhere line-clamp-2 min-w-0 flex-1 font-medium text-sm">
									{readerTitle}
								</H2>
								{readerAction}
							</div>
							<div className="min-h-0 flex-1 overflow-y-auto p-4">
								{reader}
							</div>
						</>
					) : (
						<div className="flex flex-1 items-center justify-center p-6">
							<P className="text-muted-foreground text-sm">
								{readerPrompt}
							</P>
						</div>
					)}
				</section>
			)}
		</div>
	);
}
