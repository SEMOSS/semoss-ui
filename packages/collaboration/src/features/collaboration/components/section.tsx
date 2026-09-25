import type { ReactNode } from "react";
import { cn, H2 } from "@semoss/ui/next";

/** An unframed section for the operational Brain and Work surfaces. */
export function Section({
	title,
	children,
	action,
	className,
}: {
	/** Section heading. */
	title: string;
	children: ReactNode;
	/** Optional supporting action. */
	action?: ReactNode;
	className?: string;
}) {
	return (
		<section className={cn("space-y-4", className)}>
			<div className="flex items-center justify-between gap-2">
				<H2 className="font-medium text-base">{title}</H2>
				{action}
			</div>
			{children}
		</section>
	);
}
