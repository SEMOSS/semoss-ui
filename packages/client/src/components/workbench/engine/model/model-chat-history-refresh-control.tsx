import { RefreshCwIcon } from "lucide-react";
import type { FC } from "react";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { WorkbenchChromeProps } from "@/stores/workbench";
import { WORKBENCH_STYLES } from "../../core/workbench.chrome";
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
export const ModelChatHistoryRefreshControl: FC<
	WorkbenchChromeProps<Record<string, unknown>, ModelChatHistoryApi>
> = ({ value }) => (
	<Tooltip>
		<TooltipTrigger asChild>
			<Button
				variant="ghost"
				size="icon-sm"
				onClick={() => value?.refresh()}
				disabled={!value}
				aria-label="Refresh conversation history"
				data-testid="model-chat-history--refresh-btn"
				className={cn(
					"flex-none text-muted-foreground",
					WORKBENCH_STYLES.chromeButton,
				)}
			>
				<RefreshCwIcon className={WORKBENCH_STYLES.chromeIcon} />
			</Button>
		</TooltipTrigger>
		<TooltipContent>Refresh conversation history</TooltipContent>
	</Tooltip>
);
