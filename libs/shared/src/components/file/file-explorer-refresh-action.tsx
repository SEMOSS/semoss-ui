import { RefreshCwIcon } from "lucide-react";
import type React from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { FileExplorerActionProps } from "./file-explorer.types";

/**
 * Reload the explorer's current listing.
 *
 * A header renders this, and a host that hoists the explorer's controls
 * elsewhere (e.g. a workbench panel chrome control) renders the same component,
 * so both surfaces stay identical.
 *
 * Deliberately draws nothing that changes with the explorer's state: a chrome
 * control does not re-render when its panel does, so a status-driven glyph
 * would freeze there.
 */
export const FileExplorerRefreshAction: React.FC<FileExplorerActionProps> = ({
	explorer,
	className,
	iconClassName = "size-3",
}) => {
	const { t } = useTranslation("common");
	const label = t("fileExplorer.refreshTooltip", {
		path: explorer.header.path,
	});

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					data-testid="file-explorer-refresh-button"
					variant="ghost"
					size="icon-sm"
					className={className}
					aria-label={label}
					onClick={() => explorer.commands.refresh()}
				>
					<RefreshCwIcon aria-hidden className={iconClassName} />
				</Button>
			</TooltipTrigger>
			<TooltipContent>{label}</TooltipContent>
		</Tooltip>
	);
};
