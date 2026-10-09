import { MailboxView } from "@semoss/connectors";
import { Spinner } from "@semoss/ui/next";
import type { WorkbenchPanelProps } from "@semoss/workbench";
import { useRoomConnectors } from "./room-connectors.context";
import type { ConnectorPanelConfig } from "./room-connectors.types";
import { useConnectorPanel } from "./use-connector-panel";

/** Compact Outlook browser retained independently of its detail tabs. */
export function EmailBrowserPanel({ id }: WorkbenchPanelProps) {
	const { panel, host, isReady } =
		useConnectorPanel<ConnectorPanelConfig>(id);
	const { openMail } = useRoomConnectors();
	if (!isReady) return <Spinner className="m-4" />;
	return (
		<MailboxView
			key={panel.config.provider}
			{...host}
			provider={panel.config.provider}
			presentation="compact"
			onOpenItem={openMail}
			focusItem={panel.value?.focusItem}
		/>
	);
}
