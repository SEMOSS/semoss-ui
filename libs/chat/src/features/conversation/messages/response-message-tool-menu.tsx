import { MoreHorizontalIcon, XCircleIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	toast,
} from "@semoss/ui/next";
import type { ResponseMessageStore } from "../../room/store/response-message.store";
import type { ToolStore } from "../../room/store/tool.store";
import { decideAgentToolAction } from "../../room/turns/agent-turn-runner";

/** Props for {@link ResponseMessageToolMenu}. */
interface ResponseMessageToolMenuProps {
	/** The response the call belongs to, which saves a cancelled call. */
	message: ResponseMessageStore;
	/** The call the menu acts on. */
	tool: ToolStore;
}

/**
 * The ⋯ menu on a tool call's pill. Cancel rejects an agent run's pending
 * action, or saves a chat call as cancelled, and then closes the call.
 */
export const ResponseMessageToolMenu = ({
	message,
	tool,
}: ResponseMessageToolMenuProps) => {
	const { t } = useTranslation("tool");
	// the ref guards a second click before the disabled state renders
	const cancellingRef = useRef(false);
	const [isCancelling, setIsCancelling] = useState(false);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					type="button"
					aria-label={t("activity.actions")}
					size="icon-sm"
					variant="ghost"
					className="shrink-0 gap-1.5"
					onClick={(e) => e.stopPropagation()}
				>
					<MoreHorizontalIcon aria-hidden="true" className="size-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem
					variant="destructive"
					disabled={isCancelling}
					onClick={async () => {
						if (cancellingRef.current) return;
						cancellingRef.current = true;
						setIsCancelling(true);
						try {
							if (tool.pendingAction)
								await decideAgentToolAction(tool, "reject");
							else
								await message.saveToolExecution(
									tool,
									"",
									"cancelled",
									{},
								);
							tool.closeTool();
						} catch (error) {
							toast.error(
								error instanceof Error
									? error.message
									: t("activity.cancelError"),
							);
						} finally {
							cancellingRef.current = false;
							setIsCancelling(false);
						}
					}}
				>
					<XCircleIcon />
					{t("actions.cancel")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
