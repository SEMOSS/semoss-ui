import { RefreshCwIcon } from "lucide-react";
import type { FC } from "react";
import type { WorkbenchPanelProps } from "@semoss/workbench";
import { useWorkbenchPanel, WorkbenchChromeButton } from "@semoss/workbench";
import type { ModelChatHistoryApi } from "./model-chat-conversations";

/**
 * The history panel's chrome control: reload the conversation list. The panel
 * refreshes itself when the active room changes, but a room renamed or deleted
 * elsewhere needs a manual pull.
 *
 * The list lives in the panel's own state, which the chrome cannot read — a
 * control draws in a separate subtree that does not re-render with its panel.
 * So the panel publishes a refresh function on its scratch `value` and this
 * calls it. That also means the glyph must be fixed: a spinner driven by the
 * panel's loading flag would never turn.
 *
 * @name ModelChatHistoryRefreshControl
 * @return The refresh chrome button.
 */
export const ModelChatHistoryRefreshControl: FC<WorkbenchPanelProps> = ({
	id,
}) => {
	const { value } = useWorkbenchPanel<
		Record<string, unknown>,
		ModelChatHistoryApi
	>(id);

	return (
		<WorkbenchChromeButton
			icon={RefreshCwIcon}
			label="Refresh conversation history"
			onClick={() => value?.refresh()}
			disabled={!value}
			data-testid="model-chat-history--refresh-btn"
		/>
	);
};
