import { FilePlus2Icon, RefreshCwIcon } from "lucide-react";
import type { FC } from "react";
import { useStore } from "zustand";
import type { FileExplorerApi } from "@semoss/shared";
import {
	useWorkbenchPanel,
	WorkbenchChromeButton,
	type WorkbenchPanelProps,
} from "@semoss/workbench";
import { useAccessStore } from "../../hooks/use-access";
import { getPermissionKey } from "../../types/access.types";
import type { FileExplorerParams } from "./file-explorer-panel";

/** File explorer refresh and create actions for the active panel. */
export const FileExplorerControl: FC<WorkbenchPanelProps> = ({ id }) => {
	const { value } = useWorkbenchPanel<FileExplorerParams, FileExplorerApi>(
		id,
	);

	const accessKey = value
		? value.mode.type === "APP"
			? getPermissionKey("PROJECT", value.mode.app)
			: value.mode.type === "ENGINE"
				? getPermissionKey("ENGINE", value.mode.engine)
				: value.mode.type === "STORAGE"
					? getPermissionKey("ENGINE", value.mode.storage)
					: null
		: null;
	// read the cache directly rather than through `useAccess`: a chrome
	// control renders outside its panel's subtree, so it cannot reuse the
	// access the panel already resolved
	const accessStore = useAccessStore();
	const permission = useStore(accessStore, (state) =>
		accessKey ? state.permissions[accessKey]?.permission : undefined,
	);

	if (!value) return null;

	const readOnlyResource = accessKey
		? !(permission === "OWNER" || permission === "EDIT")
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
