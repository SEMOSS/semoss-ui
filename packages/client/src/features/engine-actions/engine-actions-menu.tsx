import { CopyPlus, DownloadIcon, RotateCw } from "lucide-react";
import { useState } from "react";
import type { Role } from "@semoss/sdk";
import { formatToDataTestId } from "@semoss/utility/text";
import {
	ActionsMenu,
	type ActionsMenuItem,
} from "@/components/shared/actions-menu";
import { CloneEngineDialog } from "@/features/engine-clone/clone-engine-dialog";
import { ExportEngineDialog } from "@/features/engine-export/export-engine-dialog";
import {
	ENGINE_SUBTYPES_WITH_DATA,
	useEngineExport,
} from "@/features/engine-export/use-engine-export";
import { RestartEngineDialog } from "@/features/engine-restart/restart-engine-dialog";
import { useEngine } from "@/hooks/useEngine";
import { useNavigate } from "@/hooks/useNavigate";

/** The dialog an action opens */
type ActionDialog = "EXPORT" | "CLONE" | "RESTART";

/** An engine action, with the roles the backend lets run it */
interface EngineAction extends ActionsMenuItem {
	/** The permissions that can run the action */
	roles: Role[];
}

/**
 * The engine header's Actions menu: clone, export and restart the engine, each
 * for the roles that can run it. It is not shown to a viewer who has none.
 */
export const EngineActionsMenu = () => {
	const { catalog, engine, permission } = useEngine();
	const navigate = useNavigate();
	const { isExporting, exportEngine } = useEngineExport(engine.engine_id);
	const [dialog, setDialog] = useState<ActionDialog | null>(null);
	// a new key each time the clone dialog opens starts its name from the engine's
	const [cloneKey, setCloneKey] = useState(0);

	const engineName = engine.engine_display_name || engine.engine_name;
	const canIncludeData = ENGINE_SUBTYPES_WITH_DATA.includes(
		engine.engine_subtype ?? "",
	);

	const actions: EngineAction[] = [
		{
			id: "clone",
			label: "Clone",
			icon: CopyPlus,
			roles: ["OWNER"],
			onSelect: () => {
				setCloneKey((key) => key + 1);
				setDialog("CLONE");
			},
		},
		{
			id: "export",
			label: "Export",
			icon: DownloadIcon,
			roles: ["OWNER"],
			isBusy: isExporting,
			busyLabel: "Exporting...",
			onSelect: () => {
				if (canIncludeData) {
					setDialog("EXPORT");
				} else {
					void exportEngine(false);
				}
			},
		},
		{
			id: "restart",
			label: "Restart",
			icon: RotateCw,
			roles: ["OWNER"],
			onSelect: () => setDialog("RESTART"),
		},
	];

	return (
		<>
			<ActionsMenu
				items={actions.filter((action) =>
					action.roles.includes(permission),
				)}
				testIdPrefix={formatToDataTestId(
					`engineHeader-${catalog.name}-actions`,
				)}
			/>
			<ExportEngineDialog
				open={dialog === "EXPORT"}
				engineLabel={catalog.name}
				onExport={(includeData) => {
					setDialog(null);
					void exportEngine(includeData);
				}}
				onClose={() => setDialog(null)}
			/>
			<CloneEngineDialog
				key={cloneKey}
				open={dialog === "CLONE"}
				engineId={engine.engine_id}
				engineName={engineName}
				engineLabel={catalog.name}
				onSubmit={(cloneId) => {
					setDialog(null);
					if (cloneId) {
						navigate(`${catalog.path}/${cloneId}`);
					}
				}}
			/>
			<RestartEngineDialog
				open={dialog === "RESTART"}
				engineId={engine.engine_id}
				engineName={engineName}
				engineLabel={catalog.name}
				onClose={() => setDialog(null)}
			/>
		</>
	);
};
