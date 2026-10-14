import { type ReactNode, useId } from "react";
import { Card, cn, H2 } from "@semoss/ui/next";

/** The quiet, shared framing for agenda, handled work, and assistant tools. */
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
			<Card className={cn("min-w-0 gap-0 p-5 shadow-none", className)}>
				<header className="mb-4 flex min-h-7 items-center justify-between gap-3 border-b pb-4">
					<H2
						id={titleId}
						className="font-mono font-normal text-muted-foreground text-xs uppercase tracking-widest"
					>
						{title}
					</H2>
					{detail !== undefined && detail !== null && (
						<span className="text-muted-foreground text-sm">
							{detail}
						</span>
					)}
				</header>
				{children}
			</Card>
		</section>
	);
}
