import { FilePlus2Icon, RefreshCwIcon } from "lucide-react";
import type { FC } from "react";
import { useSessionPermissions } from "@semoss/sdk/react";
import type { FileExplorerApi } from "@semoss/shared";
import {
	useWorkbenchPanel,
	WorkbenchChromeButton,
	type WorkbenchPanelProps,
} from "@semoss/workbench";
import type { FileExplorerParams } from "./file-explorer-panel";

/** File explorer refresh and create actions for the active panel. */
export const FileExplorerControl: FC<WorkbenchPanelProps> = ({ id }) => {
	const { value } = useWorkbenchPanel<FileExplorerParams, FileExplorerApi>(
		id,
	);

	const resource = value
		? value.mode.type === "APP"
			? ({ type: "PROJECT", id: value.mode.app } as const)
			: value.mode.type === "ENGINE"
				? ({ type: "ENGINE", id: value.mode.engine } as const)
				: value.mode.type === "STORAGE"
					? ({ type: "ENGINE", id: value.mode.storage } as const)
					: null
		: null;
	// a chrome control renders outside its panel's subtree, so it reads the
	// session's shared permission for the same resource
	const { canEdit } = useSessionPermissions(
		resource?.type ?? "PROJECT",
		resource?.id ?? null,
	);

	if (!value) return null;

	const readOnlyResource = resource ? !canEdit : false;
	const canCreate =
		!readOnlyResource &&
		(value.capabilities.mutate || value.capabilities.upload);

	return (
		<>
			{canCreate ? (
				<WorkbenchChromeButton
					icon={FilePlus2Icon}
					label="New"
					onClick={() => value.commands.openNewFile()}
					data-testid="file-explorer-new-button"
				/>
			) : null}
			<WorkbenchChromeButton
				icon={RefreshCwIcon}
				label="Refresh"
				tooltip={`Refresh ${value.header.path}`}
				onClick={() => value.commands.refresh()}
				data-testid="file-explorer-refresh-button"
			/>
		</>
	);
};
