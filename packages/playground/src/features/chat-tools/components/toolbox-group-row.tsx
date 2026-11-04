import { HammerIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import type { MCPConfig } from "@semoss/shared";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useToolboxTools } from "../use-toolbox-tools";
import { ChatToolGroupRow } from "./chat-tool-group-row";
import { ChatToolListStatus } from "./chat-tool-list-status";
import { ChatToolRow } from "./chat-tool-row";

/** Props for {@link ToolboxGroupRow}. */
export interface ToolboxGroupRowProps {
	/** The toolbox. */
	toolbox: MCPConfig;
	/** Take the toolbox out of the room; left out when it cannot be removed. */
	onRemove?: () => void;
	/** Lock removal while the current turn is in progress. */
	disabled?: boolean;
}

/**
 * One toolbox as a row of a bordered tool list, the way a connector's tools
 * are: opening it reads its tools, each showing whether it runs on its own or
 * asks first and opening to what the model is told about it.
 */
export const ToolboxGroupRow = ({
	toolbox,
	onRemove,
	disabled = false,
}: ToolboxGroupRowProps) => {
	const { t } = useTranslation(["chatTools", "room"]);
	const [isOpen, setIsOpen] = useState(false);
	const { status, tools, reload } = useToolboxTools(toolbox, isOpen);
	const name = toolbox.name || toolbox.id;
	const removeLabel = t("room:settings.removeSelection", { name: name });

	return (
		<ChatToolGroupRow
			label={name}
			icon={
				<HammerIcon
					aria-hidden
					className="size-4 shrink-0 text-muted-foreground"
				/>
			}
			count={status === "ready" ? tools.length : undefined}
			onOpenChange={setIsOpen}
			trailing={
				onRemove ? (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								disabled={disabled}
								aria-label={removeLabel}
								onClick={onRemove}
							>
								<XIcon aria-hidden />
							</Button>
						</TooltipTrigger>
						<TooltipContent>{removeLabel}</TooltipContent>
					</Tooltip>
				) : undefined
			}
		>
			{status === "error" ? (
				<ChatToolListStatus
					status="error"
					message={t("chatTools:panel.toolboxToolsError")}
					onRetry={reload}
				/>
			) : status === "ready" && tools.length === 0 ? (
				<ChatToolListStatus
					status="empty"
					message={t("chatTools:panel.toolboxNoTools")}
				/>
			) : status === "ready" ? (
				tools.map((tool) => <ChatToolRow key={tool.name} tool={tool} />)
			) : (
				<ChatToolListStatus status="loading" />
			)}
		</ChatToolGroupRow>
	);
};
