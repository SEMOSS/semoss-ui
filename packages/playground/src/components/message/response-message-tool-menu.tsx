import {
	ChevronsLeftRightIcon,
	ChevronsRightLeftIcon,
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
	useIsMobile,
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
	const isMobile = useIsMobile();
	const { t } = useTranslation("tool");
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
						if (tool.isOpen && tool.display === "inline") {
							tool.closeTool();
						} else {
							tool.openTool("inline");
						}
					}}
				>
					{tool.isOpen && tool.display === "inline" ? (
						<ChevronsRightLeftIcon />
					) : (
						<ChevronsLeftRightIcon />
					)}
					{tool.isOpen && tool.display === "inline"
						? t("actions.collapse")
						: t("actions.openInline")}
				</DropdownMenuItem>
				{(!isMobile || (tool.isOpen && tool.display === "sidebar")) && (
					<DropdownMenuItem
						onClick={() => {
							if (tool.isOpen && tool.display === "sidebar") {
								tool.closeTool();
							} else {
								tool.openTool("sidebar");
							}
						}}
					>
						{tool.isOpen && tool.display === "sidebar" ? (
							<PanelRightOpenIcon />
						) : (
							<PanelRightCloseIcon />
						)}
						{tool.isOpen && tool.display === "sidebar"
							? t("actions.closeInSidebar")
							: t("actions.openInSidebar")}
					</DropdownMenuItem>
				)}

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
