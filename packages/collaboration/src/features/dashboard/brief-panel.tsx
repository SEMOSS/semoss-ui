import { type ReactNode, useId } from "react";
import { Card, H2 } from "@semoss/ui/next";

/** One of Today's cards: its title and a detail on the first line, the content below. */
export function BriefPanel({
	title,
	detail,
	children,
}: {
	title: string;
	detail?: ReactNode;
	children: ReactNode;
}) {
	const titleId = useId();
	return (
		// as tall as its row, so the cards beside it end on one line
		<section aria-labelledby={titleId} className="h-full min-w-0">
			<Card className="h-full min-w-0 gap-4 p-6 shadow-xs">
				<header className="flex min-h-8 items-center justify-between gap-3">
					<H2 id={titleId} className="text-xl leading-tight">
						{title}
					</H2>
					{detail !== undefined && detail !== null && (
						<span className="shrink-0 text-muted-foreground text-sm">
							{detail}
						</span>
					)}
				</header>
				{children}
			</Card>
		</section>
	);
}
