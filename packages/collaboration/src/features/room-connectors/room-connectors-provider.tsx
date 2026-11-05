import { type ReactNode, useCallback, useEffect } from "react";
import {
	type CalendarEventSelection,
	type ConnectorAccount,
	type MailSelection,
	useCalendarWindow,
} from "@semoss/connectors";
import { useTranslation } from "@semoss/i18n";
import type { RoomSession } from "../rooms/room-session";
import { useToolWorkbench } from "../tools/tool-workbench.context";
import {
	CALENDAR_BROWSER_PANEL,
	EMAIL_BROWSER_PANEL,
	EVENT_DETAIL_PANEL,
	FULL_CALENDAR_PANEL,
	MAIL_DETAIL_PANEL,
	ONEDRIVE_BROWSER_PANEL,
	TEAMS_CHANNELS_PANEL,
	TEAMS_CHATS_PANEL,
	TEAMS_FILES_PANEL,
} from "./room-connectors.constants";
import { RoomConnectorsContext } from "./room-connectors.context";
import type {
	ConnectorBrowser,
	ConnectorPanelValue,
	RoomConnectorsContextValue,
} from "./room-connectors.types";

// each rail browser, and the name one opened on demand is given
const BROWSERS: Record<ConnectorBrowser, { type: string; nameKey: string }> = {
	mail: { type: EMAIL_BROWSER_PANEL, nameKey: "mail.emails" },
	calendar: { type: CALENDAR_BROWSER_PANEL, nameKey: "calendar.title" },
	onedrive: { type: ONEDRIVE_BROWSER_PANEL, nameKey: "services.onedrive" },
	"teams-chats": { type: TEAMS_CHATS_PANEL, nameKey: "services.teamsChats" },
	"teams-channels": {
		type: TEAMS_CHANNELS_PANEL,
		nameKey: "services.teamsChannels",
	},
	"teams-files": { type: TEAMS_FILES_PANEL, nameKey: "services.teamsFiles" },
};

/** Keep connector state inside the current chat's retained workbench lifetime. */
export function RoomConnectorsProvider({
	session,
	children,
}: {
	session?: RoomSession;
	children: ReactNode;
}) {
	const { store, openWorkbench } = useToolWorkbench();
	const { t } = useTranslation("connectors");
	const microsoft = useCalendarWindow();
	const google = useCalendarWindow();
	useEffect(() => {
		store
			.getState()
			.layout.actions.renamePanel(EMAIL_BROWSER_PANEL, t("mail.emails"));
		store
			.getState()
			.layout.actions.renamePanel(
				CALENDAR_BROWSER_PANEL,
				t("calendar.title"),
			);
	}, [store, t]);
	const activate = useCallback(
		(id: string) => {
			store
				.getState()
				.layout.actions.setPanelValue(id, (previous: unknown) => {
					const value = previous as ConnectorPanelValue | undefined;
					return {
						...value,
						focusRequestId: (value?.focusRequestId ?? 0) + 1,
					};
				});
			openWorkbench();
		},
		[store, openWorkbench],
	);
	const openMail = useCallback(
		(selection: MailSelection) => {
			const itemId =
				selection.kind === "message"
					? selection.message.id
					: selection.conversation.conversationId;
			const title =
				selection.kind === "message"
					? selection.message.subject
					: selection.conversation.latest.subject;
			const id = store.getState().layout.actions.selectPanel(
				MAIL_DETAIL_PANEL,
				{
					provider: selection.provider,
					kind: selection.kind,
					itemId,
					selection,
				},
				{
					name: title || t("common.noSubject"),
					target: { kind: "join", tabsetId: "tools" },
				},
			);
			activate(id);
		},
		[activate, store, t],
	);
	const openEvent = useCallback(
		(provider: ConnectorAccount, selection: CalendarEventSelection) => {
			const id = store.getState().layout.actions.selectPanel(
				EVENT_DETAIL_PANEL,
				{ provider, itemId: selection.event.id, selection },
				{
					name: selection.event.subject || t("calendar.noTitle"),
					target: { kind: "join", tabsetId: "tools" },
				},
			);
			activate(id);
		},
		[activate, store, t],
	);
	const openCalendar = useCallback(
		(provider: ConnectorAccount) => {
			const { actions, isMobileLayout } = store.getState().layout;
			const id = actions.selectPanel(
				FULL_CALENDAR_PANEL,
				{ provider },
				{
					name: t(
						provider === "microsoft"
							? "services.outlookCalendar"
							: "services.googleCalendar",
					),
					target: { kind: "join", tabsetId: "tools" },
				},
			);
			if (!isMobileLayout) actions.collapseBorder("left");
			activate(id);
		},
		[activate, store, t],
	);
	const returnToBrowser = useCallback(
		(
			browser: ConnectorBrowser,
			provider: ConnectorAccount,
			itemKey?: string,
			returnFocusId?: string,
		) => {
			const { type, nameKey } = BROWSERS[browser];
			const actions = store.getState().layout.actions;
			const id = actions.selectPanel(
				type,
				{ provider },
				{ name: t(nameKey), target: { kind: "border", side: "left" } },
			);
			actions.setPanelValue(id, (previous: unknown) => {
				const value = previous as ConnectorPanelValue | undefined;
				return {
					...value,
					focusItem: {
						itemKey: itemKey ?? "",
						requestId: (value?.focusItem?.requestId ?? 0) + 1,
					},
				};
			});
			openWorkbench(undefined, returnFocusId);
		},
		[openWorkbench, store, t],
	);
	const value: RoomConnectorsContextValue = {
		session,
		calendars: { microsoft, google },
		openMail,
		openEvent,
		openCalendar,
		returnToBrowser,
	};
	return (
		<RoomConnectorsContext.Provider value={value}>
			{children}
		</RoomConnectorsContext.Provider>
	);
}
