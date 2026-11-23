import { type ReactNode, useId } from "react";
import { Card, cn, H2 } from "@semoss/ui/next";

/** One card of a hero page: its title, a count and a detail on the first line, the content below. */
export function BriefPanel({
	title,
	count,
	detail,
	dense = false,
	plain = false,
	hideHeader = false,
	children,
}: {
	title: string;
	/** How many things the card holds, shown beside the title. */
	count?: number;
	detail?: ReactNode;
	/** Tighter padding, for a card that sits inside another panel. */
	dense?: boolean;
	/** Flat container without outer card chrome, for embedding inside an existing card. */
	plain?: boolean;
	/** Keeps the heading accessible to screen readers without taking visual space. */
	hideHeader?: boolean;
	children: ReactNode;
}) {
	const titleId = useId();
	const body = (
		<>
			<header
				className={cn(
					"flex min-h-8 flex-wrap items-center justify-between gap-x-3 gap-y-2",
					hideHeader && "sr-only",
				)}
			>
				<div className="flex items-center gap-3">
					<H2 id={titleId} className="text-xl leading-tight">
						{title}
					</H2>
					{count !== undefined && (
						<span className="rounded-md bg-muted px-2 py-0.5 font-medium text-muted-foreground text-sm tabular-nums">
							{count}
						</span>
					)}
				</div>
				{detail !== undefined && detail !== null && (
					<span className="flex shrink-0 items-center gap-2 text-muted-foreground text-sm">
						{detail}
					</span>
				)}
			</header>
			{children}
		</>
	);
	return (
		// as tall as its row, so the cards beside it end on one line
		<section aria-labelledby={titleId} className="h-full min-w-0">
			{plain ? (
				<div className="flex h-full min-w-0 flex-col gap-3 px-2 py-1">
					{body}
				</div>
			) : (
				<Card
					className={cn(
						"h-full min-w-0 shadow-xs",
						dense ? "gap-3 p-5" : "gap-4 p-6",
					)}
				>
					{body}
				</Card>
			)}
		</section>
	);
}
