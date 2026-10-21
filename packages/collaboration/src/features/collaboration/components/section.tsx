import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, cn, H2, H3 } from "@semoss/ui/next";

/** An unframed section for the operational Brain and Work surfaces. */
export function Section({
	title,
	children,
	action,
	icon: Icon,
	className,
	variant = "plain",
	flush = false,
	level = 2,
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
	/** 3 for a group inside another section. */
	level?: 2 | 3;
}) {
	const isCard = variant === "card";
	const Container = isCard ? Card : "div";
	const Heading = level === 3 ? H3 : H2;
	return (
		<section
			className={cn(
				"min-w-0",
				variant === "widget" &&
					"space-y-4 border-border border-b pb-6 last:border-0 last:pb-0",
				className,
			)}
		>
			<Container
				className={
					isCard
						? "min-w-0 gap-0 overflow-hidden p-0 shadow-none"
						: "space-y-4"
				}
			>
				<div
					className={cn(
						"flex items-center justify-between gap-2",
						isCard && "mx-5 border-border border-b pt-5 pb-4",
					)}
				>
					<Heading
						className={cn(
							"flex items-center gap-2",
							isCard
								? "font-display font-semibold text-base"
								: level === 3
									? "font-medium text-sm"
									: "font-medium text-base",
						)}
					>
						{Icon && (
							<Icon
								aria-hidden="true"
								className="size-4 shrink-0 text-muted-foreground"
							/>
						)}
						{title}
					</Heading>
					{action}
				</div>
				{isCard && !flush ? (
					<div className="space-y-3 p-5 pt-4">{children}</div>
				) : (
					children
				)}
			</Container>
		</section>
	);
}
