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
	effectiveIsLarge: boolean;
	showCancelInMenu: boolean;
}

export const ResponseMessageToolMenu = ({
	message,
	tool,
	effectiveIsLarge,
	showCancelInMenu,
}: ResponseMessageToolMenuProps) => {
	const { t } = useTranslation("chat");

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				{effectiveIsLarge ? (
					<Button
						type="button"
						size="icon"
						variant="ghost"
						className="mr-2 shrink-0"
						onClick={(e) => e.stopPropagation()}
					>
						<MoreHorizontalIcon className="size-4" />
					</Button>
				) : (
					<button
						type="button"
						className="flex shrink-0 cursor-pointer items-center self-stretch rounded-r-lg px-4.5 hover:bg-accent"
						onClick={(e) => e.stopPropagation()}
					>
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
						? t("tool.collapse")
						: t("tool.openInline")}
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => {
						tool.openTool("inline");
						tool.setIsExpanded(true);
					}}
				>
					<TvMinimalIcon />
					{t("tool.expand")}
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
						? t("tool.closeInSidebar")
						: t("tool.openInSidebar")}
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
							{t("tool.cancel")}
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
