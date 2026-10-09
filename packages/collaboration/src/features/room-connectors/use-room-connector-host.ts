import { useCallback } from "react";
import type {
	ConnectorSavedFile,
	ConnectorViewerProps,
} from "@semoss/connectors";
import { useTranslation } from "@semoss/i18n";
import { FILE_PANEL_EVENTS, getFilePanelScope } from "@semoss/panels";
import { toast } from "@semoss/ui/next";
import { connectMicrosoft } from "../connectors/api/microsoft";
import { useToolWorkbench } from "../tools/tool-workbench.context";
import { useRoomConnectors } from "./room-connectors.context";

/** Capture the chat that started the operation, even when saving outlives navigation. */
export function useRoomConnectorHost(): ConnectorViewerProps {
	const { session } = useRoomConnectors();
	const { store, insightId } = useToolWorkbench();
	const { t } = useTranslation(["connectors", "room", "chatConnectors"]);
	const prepareSave = useCallback(async (): Promise<() => void> => {
		if (!session) throw new Error(t("connectors:errors.noInsight"));
		const release = session.retain();
		try {
			await session.create(session.getSnapshot().title);
			return release;
		} catch (error) {
			release();
			throw error;
		}
	}, [session, t]);
	const refreshFiles = useCallback(
		(file: ConnectorSavedFile) => {
			store
				.getState()
				.events.actions.emit(FILE_PANEL_EVENTS.FILES_CHANGED, {
					scope: getFilePanelScope({
						type: "INSIGHT",
						insightId: session?.insight.insightId ?? insightId,
					}),
					paths: [file.path],
				});
		},
		[store, session, insightId],
	);
	const onSaved = useCallback(
		(file: ConnectorSavedFile) => {
			refreshFiles(file);
			toast.success(t("connectors:actions.saved", { name: file.name }));
		},
		[refreshFiles, t],
	);
	const onAddToContext = useCallback(
		(file: ConnectorSavedFile) => {
			refreshFiles(file);
			session?.addContextFile({
				fileLocation: file.path,
				fileName: file.name,
			});
			toast.success(
				t("chatConnectors:sources.added", { name: file.name }),
			);
		},
		[refreshFiles, session, t],
	);
	const onSignIn = useCallback(async (): Promise<boolean> => {
		// Start OAuth in the click before awaiting so popup blockers allow it.
		const attempt = connectMicrosoft();
		try {
			await attempt;
			return true;
		} catch (error) {
			toast.error(
				t("chatConnectors:providers.connectError", {
					name: t("connectors:accounts.microsoft"),
					message: error instanceof Error ? error.message : "",
				}),
			);
			return false;
		}
	}, [t]);
	return {
		showHeader: false,
		saveTargetName: t("room:menuFileExplorer.name"),
		prepareSave: session ? prepareSave : undefined,
		onSaved,
		onAddToContext: session ? onAddToContext : undefined,
		onSignIn,
	};
}
