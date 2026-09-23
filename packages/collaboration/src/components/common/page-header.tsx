import type { ReactNode } from "react";
import { cn, H3, P, Small } from "@semoss/ui/next";

interface PageHeaderProps {
	/** Optional context shown above the page title. */
	eyebrow?: ReactNode;
	/** The page's primary heading. */
	title: ReactNode;
	/** Concise supporting copy for the page. */
	description: ReactNode;
	/** The page's primary action. */
	action: ReactNode;
}

/** Standard title, description, and primary-action row for collection pages. */
export function PageHeader({
	eyebrow,
	title,
	description,
	action,
}: PageHeaderProps) {
	return (
		<header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
			<div className="min-w-0">
				{eyebrow ? (
					<Small className="text-muted-foreground uppercase tracking-widest">
						{eyebrow}
					</Small>
				) : null}
				<H3 className={cn(eyebrow && "mt-2")}>{title}</H3>
				<P className="mt-1 max-w-prose text-muted-foreground">
					{description}
				</P>
			</div>
			<div className="w-full shrink-0 sm:w-auto [&>*]:min-h-11 [&>*]:w-full sm:[&>*]:min-h-0 sm:[&>*]:w-auto">
				{action}
			</div>
		</header>
	);
}
