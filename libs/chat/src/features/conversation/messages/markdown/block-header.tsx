import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "@semoss/i18n";

/** Props for {@link BlockHeader}. */
interface BlockHeaderProps {
	/** The block's kind, such as its language, shown beside the toggle. */
	label: string;
	/** Whether the block's body is hidden. */
	isCollapsed: boolean;
	/** Collapses or expands the block. */
	onToggleCollapse: () => void;
	/** Disables the toggle, such as while the block has no content yet. */
	isCollapseDisabled?: boolean;
	/** The block's actions, at the end of the row. */
	children?: ReactNode;
}

/** The header row of a code, HTML, notebook, or diagram block in a response. */
export const BlockHeader = ({
	label,
	isCollapsed,
	onToggleCollapse,
	isCollapseDisabled,
	children,
}: BlockHeaderProps) => {
	const { t } = useTranslation("chat");

	return (
		<div className="border-border border-b px-3 py-2 text-muted-foreground text-xs">
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-1">
					<button
						type="button"
						aria-label={
							isCollapsed
								? t("blocks.expand", { label })
								: t("blocks.collapse", { label })
						}
						className="inline-flex size-5 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
						disabled={isCollapseDisabled}
						onClick={onToggleCollapse}
					>
						{isCollapsed ? (
							<ChevronDownIcon className="size-3.5" />
						) : (
							<ChevronUpIcon className="size-3.5" />
						)}
					</button>
					<span>
						{isCollapsed ? t("blocks.collapsed", { label }) : label}
					</span>
				</div>
				{children && (
					<div className="flex items-center gap-1">{children}</div>
				)}
			</div>
		</div>
	);
};
