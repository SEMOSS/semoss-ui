import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface ChatHeaderProps {
	label: string;
	/** Omit both isCollapsed/onToggleCollapse for a header with no collapse affordance (e.g. a code block's header, which just needs a label + action buttons). */
	isCollapsed?: boolean;
	onToggleCollapse?: () => void;
	children?: ReactNode;
}

/**
 * Small header row for a content block (table, code, preview) — a label,
 * an optional collapse toggle, and a slot for action buttons (copy,
 * export, ...). Ported from playground's real
 * response-message-text/block-header.tsx, generalized so a caller that
 * doesn't need collapse (code blocks) can just omit those two props
 * instead of every consumer being forced into collapse behavior.
 */
export function ChatHeader({
	label,
	isCollapsed,
	onToggleCollapse,
	children,
}: ChatHeaderProps) {
	return (
		<div className="border-border border-b px-3 py-2 text-muted-foreground text-xs">
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-1">
					{onToggleCollapse && (
						<button
							type="button"
							aria-label={
								isCollapsed
									? `Expand ${label}`
									: `Collapse ${label}`
							}
							className="inline-flex size-5 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
							onClick={onToggleCollapse}
						>
							{isCollapsed ? (
								<ChevronDownIcon className="size-3.5" />
							) : (
								<ChevronUpIcon className="size-3.5" />
							)}
						</button>
					)}
					<span>
						{label}
						{isCollapsed ? " - Collapsed" : ""}
					</span>
				</div>
				{children && (
					<div className="flex items-center gap-1">{children}</div>
				)}
			</div>
		</div>
	);
}
