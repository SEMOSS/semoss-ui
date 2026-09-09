import { FilePlus2Icon } from "lucide-react";
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
 * Open the explorer's new-file overlay at the current directory.
 *
 * No action is preselected, so the overlay opens on its action picker and the
 * user chooses upload / new file / new folder there. Renders nothing when the
 * explorer cannot mutate its tree.
 */
export const FileExplorerNewAction: React.FC<FileExplorerActionProps> = ({
	explorer,
	className,
	iconClassName = "size-3",
}) => {
	const { t } = useTranslation("common");
	const label = t("fileExplorer.createTooltip", {
		path: explorer.header.path,
	});

	if (!explorer.capabilities.mutate) {
		return null;
	}

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					data-testid="file-explorer-new-button"
					variant="ghost"
					size="icon-sm"
					className={className}
					aria-label={label}
					onClick={() => explorer.commands.openNewFile()}
				>
					<FilePlus2Icon aria-hidden className={iconClassName} />
				</Button>
			</TooltipTrigger>
			<TooltipContent>{label}</TooltipContent>
		</Tooltip>
	);
};
