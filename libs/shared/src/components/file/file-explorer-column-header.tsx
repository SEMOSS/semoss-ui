import { CircleHelpIcon } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { FileExplorerApi } from "./file-explorer.types";

/** Props for {@link FileExplorerColumnHeader}. */
interface FileExplorerColumnHeaderProps {
	/** The explorer whose date column the line resizes. */
	explorer: FileExplorerApi;
}

/**
 * The Name and Date Modified row over a file tree, with the line that resizes
 * the date column. The date column's width is read from the
 * `--date-col-width` custom property its tree publishes.
 *
 * @param props - The explorer it resizes.
 * @returns The row.
 */
export const FileExplorerColumnHeader = ({
	explorer,
}: FileExplorerColumnHeaderProps) => {
	const { t } = useTranslation("common");
	const { tree } = explorer;

	const handleResizeKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
		// match the mouse handler: in RTL the column is on the leading edge,
		// so the arrow keys swap
		const target = e.currentTarget;
		const isRtl =
			target.closest("[dir]")?.getAttribute("dir") === "rtl" ||
			getComputedStyle(target).direction === "rtl";
		const grow = isRtl ? e.key === "ArrowRight" : e.key === "ArrowLeft";
		const shrink = isRtl ? e.key === "ArrowLeft" : e.key === "ArrowRight";
		if (grow) {
			tree.setDateColWidth((w) => Math.min(280, w + 8));
		} else if (shrink) {
			tree.setDateColWidth((w) => Math.max(100, w - 8));
		}
	};

	return (
		<div className="flex shrink-0 select-none items-center border-b px-2 text-muted-foreground text-xs">
			<div className="flex min-w-20 flex-1 items-center gap-1 overflow-hidden">
				<span className="overflow-hidden truncate font-medium">
					{t("fileExplorer.name")}
				</span>
				<Tooltip disableHoverableContent={false}>
					<TooltipTrigger asChild>
						<Button
							data-testid="file-explorer-bulk-shortcuts-button"
							variant="ghost"
							size="icon-sm"
							aria-label={t("fileExplorer.bulkShortcutsAria")}
							className="shrink-0"
						>
							<CircleHelpIcon aria-hidden className="size-3" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						{t("fileExplorer.bulkShortcutsTooltip")}
					</TooltipContent>
				</Tooltip>
			</div>
			<div
				data-testid="file-explorer-date-column-resizer"
				role="slider"
				aria-orientation="vertical"
				aria-label={t("fileExplorer.resizeDateColumn")}
				aria-valuemin={100}
				aria-valuemax={280}
				aria-valuenow={tree.dateColWidth}
				tabIndex={0}
				className="group flex cursor-col-resize items-center self-stretch px-2 focus-visible:outline-none"
				onMouseDown={tree.onDividerMouseDown}
				onKeyDown={handleResizeKeyDown}
			>
				<div className="h-full w-px bg-border transition-colors group-hover:bg-primary/70 group-focus-visible:w-0.5 group-focus-visible:bg-ring" />
			</div>
			{/* reads the same custom property the rows do, so the header and
			    the column can never drift */}
			<span className="w-(--date-col-width,100px) overflow-hidden truncate px-2 text-end font-medium">
				{t("fileExplorer.dateModified")}
			</span>
			{/* the width of each row's More actions button */}
			<span aria-hidden className="w-7 shrink-0" />
		</div>
	);
};
