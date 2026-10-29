import {
	MoreHorizontalIcon,
	PanelRightCloseIcon,
	PanelRightOpenIcon,
	XCircleIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	toast,
} from "@semoss/ui/next";
import { decideAgentToolAction } from "@/stores/message/agent-harness";
import type { ResponseMessageStore } from "@/stores/message/response-message.store";
import type { ToolStore } from "@/stores/tool/tool.store";

export interface ResponseMessageToolMenuProps {
	message: ResponseMessageStore;
	tool: ToolStore;
	isFullButton?: boolean;
	label?: string;
	showCancelInMenu: boolean;
}

export const ResponseMessageToolMenu = ({
	message,
	tool,
	isFullButton,
	label,
	showCancelInMenu,
}: ResponseMessageToolMenuProps) => {
	const { t } = useTranslation("tool");
	const isOpenInSidebar = tool.isOpen && tool.display === "sidebar";
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
				<DropdownMenuItem
					onClick={() => {
						tool.openTool(isOpenInSidebar ? "inline" : "sidebar");
					}}
				>
					{isOpenInSidebar ? (
						<PanelRightOpenIcon aria-hidden="true" />
					) : (
						<PanelRightCloseIcon aria-hidden="true" />
					)}
					{isOpenInSidebar
						? t("actions.openInline")
						: t("actions.openInSidebar")}
				</DropdownMenuItem>

				{showCancelInMenu && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							variant="destructive"
							disabled={isCancelling}
							onClick={async () => {
								if (cancellingRef.current) return;
								cancellingRef.current = true;
								setIsCancelling(true);
								try {
									if (tool.pendingAction)
										await decideAgentToolAction(
											tool,
											"reject",
										);
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
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
