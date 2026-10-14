import { MailDetailView } from "@semoss/connectors";
import { Spinner } from "@semoss/ui/next";
import type { WorkbenchPanelProps } from "@semoss/workbench";
import { useRoomConnectors } from "./room-connectors.context";
import type { MailPanelConfig } from "./room-connectors.types";
import { useConnectorPanel } from "./use-connector-panel";

/** A mail tab keeps its original provider and loaded controls on every reopen. */
export function MailDetailPanel({ id }: WorkbenchPanelProps) {
	const { panel, host, isReady } = useConnectorPanel<MailPanelConfig>(id);
	const { returnToBrowser } = useRoomConnectors();
	const { selection, provider } = panel.config;
	if (!isReady) return <Spinner className="m-4" />;
	return (
		<MailDetailView
			{...host}
			selection={selection}
			focusRequestId={panel.value?.focusRequestId}
			onBack={() => returnToBrowser("mail", provider, selection.itemKey)}
		/>
	);
}
