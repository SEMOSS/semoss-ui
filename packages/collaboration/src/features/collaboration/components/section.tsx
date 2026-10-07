import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn, H2 } from "@semoss/ui/next";

/** An unframed section for the operational Brain and Work surfaces. */
export function Section({
	title,
	children,
	action,
	icon: Icon,
	className,
	variant = "plain",
	flush = false,
}: {
	/** Section heading. */
	title: string;
	children: ReactNode;
	/** Optional supporting action. */
	action?: ReactNode;
	/** Optional marker before the heading. */
	icon?: LucideIcon;
	className?: string;
	/** Compact summaries separated by rules in the contextual rail, or a framed card in the Work and Brain rails. */
	variant?: "plain" | "widget" | "card";
	/** Card only: a ruled header over edge-to-edge rows that bring their own padding. */
	flush?: boolean;
}) {
	const isCard = variant === "card";
	return (
		<section
			className={cn(
				isCard
					? "overflow-hidden rounded-xl border border-border bg-card shadow-sm"
					: "space-y-4",
				variant === "widget" &&
					"space-y-4 border-border border-b pb-6 last:border-0 last:pb-0",
				className,
			)}
		>
			<div
				className={cn(
					"flex items-center justify-between gap-2",
					isCard && "px-4",
					isCard && (flush ? "border-border border-b py-3" : "pt-4"),
				)}
			>
				<H2 className="flex items-center gap-2 font-medium text-base">
					{Icon && (
						<Icon
							aria-hidden="true"
							className="size-4 shrink-0 text-primary"
						/>
					)}
					{title}
				</H2>
				{action}
			</div>
			{isCard && !flush ? (
				<div className="space-y-3 px-4 pt-2.5 pb-4">{children}</div>
			) : (
				children
			)}
		</section>
	);
}
