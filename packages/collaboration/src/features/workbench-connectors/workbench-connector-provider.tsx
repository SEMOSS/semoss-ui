import { type ReactNode, useMemo } from "react";
import type {
	ConnectorSavedFile,
	ConnectorViewerProps,
} from "@semoss/connectors";
import { useTranslation } from "@semoss/i18n";
import { FILE_PANEL_EVENTS, getFilePanelScope } from "@semoss/panels";
import { InsightContext } from "@semoss/sdk/react";
import { toast } from "@semoss/ui/next";
import type {
	RoomSession,
	RoomSessionSnapshot,
} from "@/features/rooms/room-session";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import { WorkbenchConnectorContext } from "./workbench-connector.context";
import { WorkbenchConnectorNavigationProvider } from "./workbench-connector-navigation-provider";

interface WorkbenchConnectorProviderProps {
	/** The session that owns every saved file, including after navigation. */
	session: RoomSession;
	/** Readiness changes when the draft's isolated insight finishes opening. */
	snapshot: RoomSessionSnapshot;
	/** The workbench and conversation that share this session. */
	children: ReactNode;
}

/** Adapt account viewers to the current chat's insight, files, and next-message queue. */
export function WorkbenchConnectorProvider({
	session,
	snapshot,
	children,
}: WorkbenchConnectorProviderProps) {
	const { store } = useToolWorkbench();
	const { t } = useTranslation("chatConnectors");
	const { t: tTools } = useTranslation("chatTools");
	const insight = session.insight;
	const host = useMemo<ConnectorViewerProps>(() => {
		const target = tTools("card.chatFiles");
		const notifyFilesChanged = (file: ConnectorSavedFile): void => {
			store
				.getState()
				.events.actions.emit(FILE_PANEL_EVENTS.FILES_CHANGED, {
					scope: getFilePanelScope({
						type: "INSIGHT",
						insightId: session.insight.insightId,
					}),
					paths: [file.path],
				});
		};
		return {
			saveTargetName: target,
			prepareSave: async () => {
				const release = session.retain();
				try {
					await session.create(
						session.getSnapshot().title || "New chat",
					);
					return release;
				} catch (error) {
					release();
					throw error;
				}
			},
			onSaved: (file) => {
				notifyFilesChanged(file);
				toast.success(t("sources.saved", { name: file.name, target }));
			},
			onAddToContext: (file) => {
				session.addContextFile({
					fileName: file.name,
					fileLocation: file.path,
				});
				notifyFilesChanged(file);
				toast.success(t("sources.added", { name: file.name }));
			},
		};
	}, [session, store, t, tTools]);

	return (
		<InsightContext.Provider
			value={{
				isInitialized: insight.isInitialized,
				isReady: insight.isReady,
				isAuthorized: insight.isAuthorized,
				error: insight.error,
				system: insight.system,
				insightId: insight.insightId,
				actions: insight.actions,
			}}
		>
			<WorkbenchConnectorContext.Provider
				value={snapshot.isReady ? host : null}
			>
				<WorkbenchConnectorNavigationProvider key={insight.insightId}>
					{children}
				</WorkbenchConnectorNavigationProvider>
			</WorkbenchConnectorContext.Provider>
		</InsightContext.Provider>
	);
}
