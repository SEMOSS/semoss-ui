import { HammerIcon, XIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import type { MCPConfig } from "@semoss/shared";
import { useToolboxTools } from "../use-toolbox-tools";
import { ChatToolRow } from "./chat-tool-row";
import { ToolGroupRow } from "./tool-group-row";
import { ToolList } from "./tool-list";
import { TooltipIconButton } from "./tooltip-icon-button";

/** Props for {@link ToolboxRow}. */
interface ToolboxRowProps {
	/** The toolbox. */
	toolbox: MCPConfig;
	/** Take the toolbox out of the room; left out when it cannot be removed. */
	onRemove?: () => void;
	/** Lock removal while the current turn is in progress. */
	disabled?: boolean;
}

/**
 * One toolbox as a row of a bordered tool list, the way a connector's tools
 * are: opening it the first time reads its tools, each showing whether it
 * runs on its own or asks first and opening to what the model is told about
 * it.
 */
export const ToolboxRow = ({
	toolbox,
	onRemove,
	disabled = false,
}: ToolboxRowProps) => {
	const { t } = useTranslation(["chatTools", "room"]);
	const { status, tools, load } = useToolboxTools(toolbox);
	const name = toolbox.name || toolbox.id;
	const removeLabel = t("room:settings.removeSelection", { name: name });

	const handleOpenChange = (isOpen: boolean): void => {
		if (isOpen && status === "idle") load();
	};

	return (
		<ToolGroupRow
			label={name}
			icon={
				<HammerIcon
					aria-hidden
					className="size-4 shrink-0 text-muted-foreground"
				/>
			}
			count={status === "ready" ? tools.length : undefined}
			onOpenChange={handleOpenChange}
			trailing={
				onRemove ? (
					<TooltipIconButton
						label={removeLabel}
						icon={<XIcon aria-hidden />}
						disabled={disabled}
						onClick={onRemove}
					/>
				) : undefined
			}
		>
			<ToolList
				variant="group"
				status={status}
				isEmpty={tools.length === 0}
				errorMessage={t("chatTools:sections.toolbox.error")}
				emptyMessage={t("chatTools:sections.toolbox.empty")}
				onRetry={load}
			>
				{tools.map((tool) => (
					<ChatToolRow key={tool.name} tool={tool} />
				))}
			</ToolList>
		</ToolGroupRow>
	);
};
