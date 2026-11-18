import type { ReactNode } from "react";
import { H1, P } from "@semoss/ui/next";

interface CollaborationHeroHeaderProps {
	/** A small label or a link back, on the line above the title. */
	eyebrow?: ReactNode;
	/** The page's one heading. */
	title: ReactNode;
	/** What the page is for, in a sentence. */
	description?: ReactNode;
	/** Status and page actions, on one quiet line under the description. */
	children?: ReactNode;
}

/** The heading a hero page opens with, over the photo. */
export function CollaborationHeroHeader({
	eyebrow,
	title,
	description,
	children,
}: CollaborationHeroHeaderProps) {
	return (
		<header className="flex flex-col items-start gap-1 pt-4 pb-6 lg:px-6 lg:pt-14">
			{/* on desktop the line is kept even when empty, so the title sits at one height on every page */}
			<div className="flex items-center text-muted-foreground text-sm lg:min-h-5">
				{eyebrow}
			</div>
			<H1 className="text-3xl leading-tight tracking-tight sm:text-5xl">
				{title}
			</H1>
			{description ? (
				<P className="text-lg text-muted-foreground">{description}</P>
			) : null}
			{children ? (
				<div className="flex min-h-7 flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-sm">
					{children}
				</div>
			) : null}
		</header>
	);
}
