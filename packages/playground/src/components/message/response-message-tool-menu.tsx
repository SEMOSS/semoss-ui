import {
	ChevronsLeftRightIcon,
	ChevronsRightLeftIcon,
	MoreHorizontalIcon,
	PanelRightCloseIcon,
	PanelRightOpenIcon,
	TvMinimalIcon,
	XCircleIcon,
} from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@semoss/ui/next";
import type { ResponseMessageStore, ToolStore } from "@/stores";

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

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				{!isFullButton ? (
					<Button
						type="button"
						size={label ? "sm" : "icon"}
						variant="ghost"
						className="mr-2 shrink-0 gap-1.5"
						onClick={(e) => e.stopPropagation()}
					>
						{label && (
							<span className="pr-1 font-normal text-muted-foreground text-sm">
								{label}
							</span>
						)}
						<MoreHorizontalIcon className="size-4" />
					</Button>
				) : (
					<button
						type="button"
						className="flex shrink-0 cursor-pointer items-center gap-2 self-stretch rounded-r-lg px-4.5 hover:bg-accent"
						onClick={(e) => e.stopPropagation()}
					>
						{label && (
							<span className="text-muted-foreground text-sm">
								{label}
							</span>
						)}
						<MoreHorizontalIcon className="size-4 text-muted-foreground" />
					</button>
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
				<DropdownMenuItem
					onClick={() => {
						tool.openTool("inline");
						tool.setIsExpanded(true);
					}}
				>
					<TvMinimalIcon />
					{t("actions.expand")}
				</DropdownMenuItem>
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
				{showCancelInMenu && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							variant="destructive"
							onClick={() => {
								message.saveToolExecution(
									tool,
									"",
									"cancelled",
									{},
								);
								tool.closeTool();
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
