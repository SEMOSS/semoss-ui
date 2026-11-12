import { type ReactNode, useId } from "react";
import { Card, H2 } from "@semoss/ui/next";

/** One card of a hero page: its title, a count and a detail on the first line, the content below. */
export function BriefPanel({
	title,
	count,
	detail,
	children,
}: {
	title: string;
	/** How many things the card holds, shown beside the title. */
	count?: number;
	detail?: ReactNode;
	children: ReactNode;
}) {
	const titleId = useId();
	return (
		// as tall as its row, so the cards beside it end on one line
		<section aria-labelledby={titleId} className="h-full min-w-0">
			<Card className="h-full min-w-0 gap-4 p-6 shadow-xs">
				<header className="flex min-h-8 flex-wrap items-center justify-between gap-x-3 gap-y-2">
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
			</Card>
		</section>
	);
}
