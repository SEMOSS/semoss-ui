import { type ReactNode, useState } from "react";
import { type ConnectorAccount, useCalendarWindow } from "@semoss/connectors";
import { useTranslation } from "@semoss/i18n";
import {
	CALENDAR_EVENT_PANEL_TYPE,
	CALENDAR_FULL_PANEL_TYPE,
	CALENDAR_PANEL_TYPE,
	EMAIL_DETAIL_PANEL_TYPE,
	EMAILS_PANEL_TYPE,
} from "@/features/tools/tool-workbench.constants";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import {
	CONNECTOR_DETAIL_FOCUS_EVENT,
	type WorkbenchConnectorBrowser,
	type WorkbenchConnectorItemConfig,
	type WorkbenchConnectorItemValue,
	type WorkbenchConnectorNavigation,
	WorkbenchConnectorNavigationContext,
	type WorkbenchConnectorReturnTarget,
} from "./workbench-connector-navigation.context";

interface WorkbenchConnectorNavigationProviderProps {
	/** Rail browsers and main-stage details for one chat session. */
	children: ReactNode;
}

/** Keep account choices and calendar dates shared across the chat's dock panels. */
export function WorkbenchConnectorNavigationProvider({
	children,
}: WorkbenchConnectorNavigationProviderProps) {
	const { store } = useToolWorkbench();
	const { t } = useTranslation("sidebar");
	const { t: connectorText } = useTranslation("connectors");
	const microsoftCalendar = useCalendarWindow();
	const googleCalendar = useCalendarWindow();
	const [providers, setProviders] = useState<
		Record<WorkbenchConnectorBrowser, ConnectorAccount>
	>({ emails: "microsoft", calendar: "microsoft" });
	const [returnTarget, setReturnTarget] =
		useState<WorkbenchConnectorReturnTarget | null>(null);

	function setProvider(
		browser: WorkbenchConnectorBrowser,
		provider: ConnectorAccount,
	): void {
		setProviders((current) => ({ ...current, [browser]: provider }));
	}

	function openDetail(
		type: string,
		config: WorkbenchConnectorItemConfig,
		name: string,
		value?: WorkbenchConnectorItemValue,
	): void {
		const { layout, events } = store.getState();
		const mainTabset =
			layout.tabsets.find(
				(tabset) => tabset.id === layout.lastTabsetId,
			) ?? layout.tabsets[0];
		const helpText = `${connectorText(`accounts.${config.provider}`)} · ${name}`;
		const id = layout.actions.selectPanel(
			type,
			{ ...config },
			{
				name,
				helpText,
				target: { kind: "join", tabsetId: mainTabset?.id ?? "tools" },
			},
		);
		layout.actions.updatePanel(id, { name, helpText });
		if (value)
			layout.actions.setPanelValue(id, (current) => {
				const previous = current as
					| WorkbenchConnectorItemValue
					| undefined;
				const controls =
					previous?.kind === "mail" ? previous.controls : undefined;
				return value.kind === "mail" &&
					controls?.provider === config.provider &&
					controls.kind === config.kind &&
					controls.itemId === config.itemId
					? { ...value, controls }
					: value;
			});
		events.actions.emit(CONNECTOR_DETAIL_FOCUS_EVENT, { id });
	}

	const navigation: WorkbenchConnectorNavigation = {
		providers,
		calendars: { microsoft: microsoftCalendar, google: googleCalendar },
		returnTarget,
		setProvider,
		openMail: (provider, selection) => {
			openDetail(
				EMAIL_DETAIL_PANEL_TYPE,
				{ provider, kind: selection.kind, itemId: selection.id },
				selection.title,
				{ kind: "mail", selection },
			);
		},
		openEvent: (provider, selection) => {
			openDetail(
				CALENDAR_EVENT_PANEL_TYPE,
				{ provider, kind: "event", itemId: selection.event.id },
				selection.event.subject || t("workbench.calendar"),
				{ kind: "event", selection },
			);
		},
		openCalendar: (provider) => {
			openDetail(
				CALENDAR_FULL_PANEL_TYPE,
				{ provider, kind: "calendar" },
				`${connectorText(`accounts.${provider}`)} · ${t("workbench.calendar")}`,
			);
			if (!store.getState().layout.isMobileLayout) {
				store.getState().layout.actions.collapseBorder("left");
			}
		},
		returnToBrowser: (target) => {
			setProvider(target.browser, target.provider);
			setReturnTarget({ ...target });
			store
				.getState()
				.layout.actions.selectPanel(
					target.browser === "emails"
						? EMAILS_PANEL_TYPE
						: CALENDAR_PANEL_TYPE,
				);
		},
	};

	return (
		<WorkbenchConnectorNavigationContext.Provider value={navigation}>
			{children}
		</WorkbenchConnectorNavigationContext.Provider>
	);
}
