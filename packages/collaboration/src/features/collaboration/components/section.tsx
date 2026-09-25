import type { ReactNode } from "react";
import { cn, H2 } from "@semoss/ui/next";

/** An unframed section for the operational Brain and Work surfaces. */
export function Section({
	title,
	children,
	action,
	className,
	variant = "plain",
}: {
	/** Section heading. */
	title: string;
	children: ReactNode;
	/** Optional supporting action. */
	action?: ReactNode;
	className?: string;
	/** Compact framed summaries in the contextual rail. */
	variant?: "plain" | "widget";
}) {
	return (
		<section
			className={cn(
				"space-y-4",
				variant === "widget" &&
					"space-y-3 rounded-xl bg-card p-4 shadow-sm ring-1 ring-border/50",
				className,
			)}
		>
			<div className="flex items-center justify-between gap-2">
				<H2
					className={cn(
						"font-medium text-base",
						variant === "widget" && "text-sm",
					)}
				>
					{title}
				</H2>
				{action}
			</div>
			{children}
		</section>
	);
}
