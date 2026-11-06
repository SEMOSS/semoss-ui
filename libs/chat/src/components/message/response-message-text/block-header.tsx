import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import type { ReactNode } from "react";

interface BlockHeaderProps {
	label: string;
	isCollapsed: boolean;
	onToggleCollapse: () => void;
	collapseDisabled?: boolean;
	children?: ReactNode;
}

export const BlockHeader = ({
	label,
	isCollapsed,
	onToggleCollapse,
	collapseDisabled,
	children,
}: BlockHeaderProps) => {
	return (
		<div className="border-border border-b px-3 py-2 text-muted-foreground text-xs">
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-1">
					<button
						type="button"
						aria-label={
							isCollapsed
								? `Expand ${label}`
								: `Collapse ${label}`
						}
						className="inline-flex size-5 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
						disabled={collapseDisabled}
						onClick={onToggleCollapse}
					>
						{isCollapsed ? (
							<ChevronDownIcon className="size-3.5" />
						) : (
							<ChevronUpIcon className="size-3.5" />
						)}
					</button>
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
};
