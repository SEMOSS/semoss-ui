import { type ReactNode, useId } from "react";
import { Card, cn, H2 } from "@semoss/ui/next";

/** A quiet section: the same heading style as Today's list, content in one card. */
export function BriefPanel({
	title,
	detail,
	children,
	className,
}: {
	title: string;
	detail?: ReactNode;
	children: ReactNode;
	className?: string;
}) {
	const titleId = useId();
	return (
		<section aria-labelledby={titleId} className="min-w-0">
			<header className="mb-3 flex min-h-8 items-center justify-between gap-3 px-1">
				<H2 id={titleId} className="font-display font-semibold text-lg">
					{title}
				</H2>
				{detail !== undefined && detail !== null && (
					<span className="text-muted-foreground text-sm">
						{detail}
					</span>
				)}
			</header>
			<Card
				className={cn("min-w-0 gap-0 px-5 py-1 shadow-none", className)}
			>
				{children}
			</Card>
		</section>
	);
}
