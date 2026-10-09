import { CalendarDays, Mail } from "lucide-react";
import { createElement, lazy, Suspense, useCallback } from "react";
import type { MailDetailViewControls } from "@semoss/connectors";
import { useTranslation } from "@semoss/i18n";
import { Logins } from "@semoss/sdk";
import { Button } from "@semoss/ui/next";
import {
	useWorkbench,
	useWorkbenchControl,
	useWorkbenchPanel,
	type WorkbenchPanelConfig,
	WorkbenchPanelLoading,
	type WorkbenchPanelProps,
} from "@semoss/workbench";
import { useWorkbenchConnectorFocus } from "./use-workbench-connector-focus";
import { useWorkbenchConnectorHost } from "./workbench-connector.context";
import {
	useWorkbenchConnectorNavigation,
	type WorkbenchConnectorItemConfig,
	type WorkbenchConnectorItemValue,
} from "./workbench-connector-navigation.context";
import { WorkbenchMailDetailControl } from "./workbench-mail-detail-control";

const MailDetailView = lazy(() =>
	import("@semoss/connectors").then((module) => ({
		default: module.MailDetailView,
	})),
);
const CalendarEventDetailView = lazy(() =>
	import("@semoss/connectors").then((module) => ({
		default: module.CalendarEventDetailView,
	})),
);
const CalendarAgendaView = lazy(() =>
	import("@semoss/connectors").then((module) => ({
		default: module.CalendarAgendaView,
	})),
);

/** A retained main-stage reader or full calendar belonging to this chat's insight. */
export function WorkbenchConnectorDetailPanel({ id }: WorkbenchPanelProps) {
	const { config, value, name, isVisible, setValue } = useWorkbenchPanel<
		WorkbenchConnectorItemConfig,
		WorkbenchConnectorItemValue | undefined
	>(id);
	const isCompact = useWorkbench((state) => state.layout.isMobileLayout);
	const host = useWorkbenchConnectorHost();
	const navigation = useWorkbenchConnectorNavigation();
	const { t } = useTranslation("sidebar");
	const { t: connectorText } = useTranslation("connectors");
	const rootRef = useWorkbenchConnectorFocus(
		id,
		isVisible,
		config.kind !== "calendar",
	);
	const { provider } = config;
	const isMail = config.kind === "thread" || config.kind === "message";
	const publishMailControls = useCallback(
		(controls: MailDetailViewControls): void => {
			if (
				controls.provider !== config.provider ||
				controls.kind !== config.kind ||
				controls.itemId !== config.itemId
			)
				return;
			setValue((current) => {
				if (
					current?.kind !== "mail" ||
					current.selection.id !== controls.itemId ||
					current.selection.kind !== controls.kind
				)
					return current;
				return { ...current, controls };
			});
		},
		[config.provider, config.kind, config.itemId, setValue],
	);
	useWorkbenchControl(
		id,
		isMail && !isCompact ? WorkbenchMailDetailControl : null,
	);
	const onBack = (): void =>
		navigation.returnToBrowser({
			browser: isMail ? "emails" : "calendar",
			provider,
			itemKey:
				value?.kind === "event"
					? value.selection.itemKey.replace(/^grid:/, "")
					: value?.selection.itemKey,
		});
	const viewerProps = {
		...host,
		provider,
		showHeader: false,
		onSignIn: () =>
			Logins.connect(
				provider === "microsoft" ? "MICROSOFT" : "GOOGLE",
				provider,
			),
		onBack,
	};
	const loading = (
		<WorkbenchPanelLoading label={connectorText("common.loading")} />
	);

	return (
		<section
			ref={rootRef}
			aria-label={name}
			tabIndex={-1}
			className="size-full min-h-0 min-w-0 bg-background"
		>
			{!host ? (
				loading
			) : (
				<Suspense fallback={loading}>
					{config.kind === "calendar" ? (
						<CalendarAgendaView
							{...viewerProps}
							responsive
							calendar={navigation.calendars[provider]}
							onOpenEvent={(selection) =>
								navigation.openEvent(provider, selection)
							}
						/>
					) : isMail && value?.kind === "mail" ? (
						<MailDetailView
							{...viewerProps}
							selection={value.selection}
							showOpenIn={isCompact}
							onControls={publishMailControls}
						/>
					) : config.kind === "event" && value?.kind === "event" ? (
						<CalendarEventDetailView
							{...viewerProps}
							selection={value.selection}
						/>
					) : (
						<div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
							<p className="text-muted-foreground text-sm">
								{t("workbench.itemUnavailable")}
							</p>
							<Button variant="outline" onClick={onBack}>
								{t("workbench.backToBrowser")}
							</Button>
						</div>
					)}
				</Suspense>
			)}
		</section>
	);
}

const DETAIL_PANEL = {
	canRename: false,
	mount: "keepAlive",
	matches: (a, b) =>
		a.provider === b.provider && a.kind === b.kind && a.itemId === b.itemId,
	content: WorkbenchConnectorDetailPanel,
} satisfies WorkbenchPanelConfig<
	WorkbenchConnectorItemConfig,
	WorkbenchConnectorItemValue
>;

export const WORKBENCH_EMAIL_DETAIL_PANEL = {
	...DETAIL_PANEL,
	name: "Email",
	icon: ({ className }) =>
		createElement(Mail, { "aria-hidden": true, className }),
} satisfies WorkbenchPanelConfig<
	WorkbenchConnectorItemConfig,
	WorkbenchConnectorItemValue
>;

export const WORKBENCH_CALENDAR_EVENT_PANEL = {
	...DETAIL_PANEL,
	name: "Event",
	icon: ({ className }) =>
		createElement(CalendarDays, { "aria-hidden": true, className }),
} satisfies WorkbenchPanelConfig<
	WorkbenchConnectorItemConfig,
	WorkbenchConnectorItemValue
>;

export const WORKBENCH_CALENDAR_FULL_PANEL = {
	...WORKBENCH_CALENDAR_EVENT_PANEL,
	name: "Calendar",
} satisfies WorkbenchPanelConfig<
	WorkbenchConnectorItemConfig,
	WorkbenchConnectorItemValue
>;
