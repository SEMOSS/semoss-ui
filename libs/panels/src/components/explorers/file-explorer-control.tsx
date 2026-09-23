import { FilePlus2Icon, RefreshCwIcon } from "lucide-react";
import type { FC } from "react";
import { useAccess } from "@semoss/sdk/react";
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
			? { type: "PROJECT" as const, id: value.mode.app }
			: value.mode.type === "ENGINE"
				? { type: "ENGINE" as const, id: value.mode.engine }
				: value.mode.type === "STORAGE"
					? { type: "ENGINE" as const, id: value.mode.storage }
					: null
		: null;
	const access = useAccess(resource?.type ?? "INSIGHT", resource?.id ?? "");

	if (!value) return null;

	const readOnlyResource = resource
		? access.status !== "ready" || access.readOnly
		: false;
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
