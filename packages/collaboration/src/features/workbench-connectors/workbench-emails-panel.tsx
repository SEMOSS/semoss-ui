import { Mail } from "lucide-react";
import { createElement, lazy, useCallback } from "react";
import type { MailboxViewControls } from "@semoss/connectors";
import {
	useWorkbench,
	useWorkbenchControl,
	useWorkbenchPanel,
	type WorkbenchPanelConfig,
	type WorkbenchPanelProps,
} from "@semoss/workbench";
import { useWorkbenchConnectorNavigation } from "./workbench-connector-navigation.context";
import { WorkbenchConnectorPanel } from "./workbench-connector-panel";
import {
	WorkbenchEmailsControl,
	type WorkbenchEmailsPanelValue,
} from "./workbench-emails-control";

const MailboxView = lazy(() =>
	import("@semoss/connectors").then((module) => ({
		default: module.MailboxView,
	})),
);

/** The user's Microsoft and Google mail in the chat workbench. */
export function WorkbenchEmailsPanel({ id }: WorkbenchPanelProps) {
	const { openMail, providers } = useWorkbenchConnectorNavigation();
	const { setValue } = useWorkbenchPanel<
		Record<string, never>,
		WorkbenchEmailsPanelValue
	>(id);
	const isCompact = useWorkbench((state) => state.layout.isMobileLayout);
	const publishControls = useCallback(
		(controls: MailboxViewControls): void => {
			setValue((current) => ({
				controls: {
					...current?.controls,
					[controls.provider]: controls,
				},
			}));
		},
		[setValue],
	);
	useWorkbenchControl(id, WorkbenchEmailsControl);
	return (
		<WorkbenchConnectorPanel browser="emails">
			{(props) => (
				<MailboxView
					{...props}
					presentation="compact"
					showRefresh={false}
					onControls={publishControls}
					providerControl={
						<div className="flex min-w-0 items-center gap-2">
							{props.providerControl}
							{isCompact &&
							props.provider === providers.emails ? (
								<WorkbenchEmailsControl id={id} />
							) : null}
						</div>
					}
					onOpenItem={(selection) =>
						openMail(props.provider, selection)
					}
				/>
			)}
		</WorkbenchConnectorPanel>
	);
}

/** A single retained mail panel per chat. */
export const WORKBENCH_EMAILS_PANEL = {
	name: "Emails",
	icon: ({ className }) =>
		createElement(Mail, { "aria-hidden": true, className }),
	canClose: false,
	canRename: false,
	mount: "keepAlive",
	content: WorkbenchEmailsPanel,
} satisfies WorkbenchPanelConfig<
	Record<string, never>,
	WorkbenchEmailsPanelValue
>;
