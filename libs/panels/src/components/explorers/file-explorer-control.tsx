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

	// the resource whose access decides whether New shows; an insight's
	// files and a user's own have none to check
	const mode = value?.mode;
	const resource =
		mode?.type === "APP"
			? { type: "PROJECT" as const, id: mode.app }
			: mode?.type === "ENGINE"
				? { type: "ENGINE" as const, id: mode.engine }
				: mode?.type === "STORAGE"
					? { type: "ENGINE" as const, id: mode.storage }
					: null;
	// read the session's permission rather than `useAccess`: a chrome
	// control renders outside its panel's subtree, so it cannot reuse the
	// access the panel resolved, but both share the session's one read
	const { canEdit } = useSessionPermissions(
		resource?.type ?? "ENGINE",
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
