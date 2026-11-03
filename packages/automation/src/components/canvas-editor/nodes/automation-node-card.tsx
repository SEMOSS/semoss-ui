import type { LucideIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import {
	cn,
	P,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";

interface AutomationNodeCardProps extends ComponentProps<"div"> {
	/** Public display label for the step. */
	label: string;
	/** Icon chosen from the existing automation node catalog. */
	icon: LucideIcon;
	/** Catalog color or semantic token for the icon. */
	iconClassName?: string;
	/** Optional zero-based step number used by the editor. */
	index?: number;
	/** Optional editor metadata below the label. */
	subtitle?: string;
	/** Editor-owned status indicator. */
	status?: ReactNode;
	/** Editor-owned hover actions. */
	actions?: ReactNode;
	/** Connection handles surrounding the card. */
	ports?: ReactNode;
	/** Optional editor details below the heading. */
	children?: ReactNode;
	/** State styling supplied by the editor. */
	className?: string;
}

/** Shared node presentation with no automation state, configuration, or actions of its own. */
export function AutomationNodeCard({
	label,
	icon: Icon,
	iconClassName,
	index,
	subtitle,
	status,
	actions,
	ports,
	children,
	className,
	...props
}: AutomationNodeCardProps) {
	return (
		<div
			{...props}
			className={cn(
				"group relative w-70 rounded-2xl border-2 border-border shadow-sm",
				className,
			)}
		>
			<div className="relative z-1 m-0.5 rounded-xl bg-card">
				{actions}
				<div className="px-4 py-3">
					<div className="flex items-center gap-3">
						<span
							className={cn(
								"relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-primary",
								iconClassName,
							)}
						>
							<Icon className="size-4.5" aria-hidden />
							{index !== undefined && (
								<span className="-top-1.5 -left-1.5 absolute flex size-4 items-center justify-center rounded-full border border-border bg-muted font-medium text-muted-foreground text-xs">
									{index + 1}
								</span>
							)}
						</span>
						<div className="min-w-0 flex-1">
							<Tooltip disableHoverableContent={false}>
								<TooltipTrigger asChild>
									<P className="truncate font-semibold text-sm leading-snug">
										{label}
									</P>
								</TooltipTrigger>
								<TooltipContent side="top">
									{label}
								</TooltipContent>
							</Tooltip>
							{subtitle && (
								<P className="mt-0.5 truncate text-muted-foreground text-xs uppercase tracking-wide">
									{subtitle}
								</P>
							)}
						</div>
						{status}
					</div>
					{children}
				</div>
			</div>
			{ports}
		</div>
	);
}
