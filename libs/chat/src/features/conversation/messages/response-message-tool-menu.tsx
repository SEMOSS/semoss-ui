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
import { decideAgentToolAction } from "../store/agent-harness";
import type { ResponseMessageStore } from "../store/response-message.store";
import type { ToolStore } from "../store/tool.store";

/** Props for {@link ResponseMessageToolMenu}. */
interface ResponseMessageToolMenuProps {
	/** The response the call belongs to, which saves a cancelled call. */
	message: ResponseMessageStore;
	/** The call the menu acts on. */
	tool: ToolStore;
	/** Draw the trigger as the full-height end of the pill, not an icon button. */
	isFullButton?: boolean;
	/** Text shown beside the trigger's icon. */
	label?: string;
	/** Whether the menu offers Cancel. */
	shouldShowCancel: boolean;
}

/**
 * The ⋯ menu on a tool call's pill. Cancel rejects an agent run's pending
 * action, or saves a chat call as cancelled, and then closes the call.
 */
export const ResponseMessageToolMenu = ({
	message,
	tool,
	isFullButton,
	label,
	shouldShowCancel,
}: ResponseMessageToolMenuProps) => {
	const { t } = useTranslation("tool");
	// the ref guards a second click before the disabled state renders
	const cancellingRef = useRef(false);
	const [isCancelling, setIsCancelling] = useState(false);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				{!isFullButton ? (
					<Button
						type="button"
						aria-label={t("activity.actions")}
						size={label ? "sm" : "icon-sm"}
						variant="ghost"
						className="shrink-0 gap-1.5"
						onClick={(e) => e.stopPropagation()}
					>
						{label && (
							<span className="pe-1 font-normal text-muted-foreground text-sm">
								{label}
							</span>
						)}
						<MoreHorizontalIcon
							aria-hidden="true"
							className="size-4"
						/>
					</Button>
				) : (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						aria-label={t("activity.actions")}
						className="h-auto min-h-8 shrink-0 gap-2 self-stretch rounded-s-none rounded-e-lg px-2"
						onClick={(e) => e.stopPropagation()}
					>
						{label && (
							<span className="text-muted-foreground text-sm">
								{label}
							</span>
						)}
						<MoreHorizontalIcon
							aria-hidden="true"
							className="size-4 text-muted-foreground"
						/>
					</Button>
				)}
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{shouldShowCancel && (
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
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
