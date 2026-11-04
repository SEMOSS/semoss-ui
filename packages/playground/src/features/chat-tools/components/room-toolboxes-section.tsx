import type { MCPConfig } from "@semoss/shared";
import { CHAT_TOOL_LIST_CLASS_NAME } from "./chat-tool-list";
import { ChatToolsSection } from "./chat-tools-section";
import { ToolboxGroupRow } from "./toolbox-group-row";

/** Props for {@link RoomToolboxesSection}. */
export interface RoomToolboxesSectionProps {
	/** The section's heading. */
	title: string;
	/** What the section holds, shown in its info tooltip. */
	tooltip: string;
	/** The toolboxes, in the order they are shown. */
	toolboxes: MCPConfig[];
	/** Take a toolbox out of the room; left out when they cannot be removed. */
	onRemove?: (toolbox: MCPConfig) => void;
	/** Lock removal while the current turn is in progress. */
	disabled?: boolean;
}

/**
 * Toolboxes in Settings' Tools, such as the ones the user added or the ones
 * the room's agent brings: each opens to its tools. Nothing is shown when
 * there are none.
 */
export const RoomToolboxesSection = ({
	title,
	tooltip,
	toolboxes,
	onRemove,
	disabled = false,
}: RoomToolboxesSectionProps) => {
	if (toolboxes.length === 0) return null;
	return (
		<ChatToolsSection
			level={5}
			title={title}
			tooltip={tooltip}
			count={toolboxes.length}
		>
			<ul className={CHAT_TOOL_LIST_CLASS_NAME}>
				{toolboxes.map((toolbox) => (
					<ToolboxGroupRow
						key={toolbox.id}
						toolbox={toolbox}
						disabled={disabled}
						onRemove={
							onRemove ? () => onRemove(toolbox) : undefined
						}
					/>
				))}
			</ul>
		</ChatToolsSection>
	);
};
