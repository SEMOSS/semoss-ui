import { useTranslation } from "@semoss/i18n";
import type { MCPConfig } from "@semoss/shared";
import { RoomToolsSection } from "./room-tools-section";
import { ToolList } from "./tool-list";
import { ToolboxRow } from "./toolbox-row";

/** Props for {@link RoomToolsToolboxesSection}. */
type RoomToolsToolboxesSectionProps =
	| {
			/** The toolboxes the room's agent brings, which cannot be removed here. */
			variant: "agent";
			/** The toolboxes, in the order they are shown. */
			toolboxes: MCPConfig[];
	  }
	| {
			/** The toolboxes the user added to the room. */
			variant: "added";
			/** The toolboxes, in the order they are shown. */
			toolboxes: MCPConfig[];
			/** Take a toolbox out of the room. */
			onRemove: (toolbox: MCPConfig) => void;
			/** Lock removal while the current turn is in progress. */
			disabled?: boolean;
	  };

/**
 * Settings' Agent or Toolboxes section: the toolboxes the room's agent brings,
 * or the ones the user added, each opening to its tools. Nothing is shown
 * when there are none.
 */
export const RoomToolsToolboxesSection = (
	props: RoomToolsToolboxesSectionProps,
) => {
	const { t } = useTranslation("chatTools");
	const { variant, toolboxes } = props;
	if (toolboxes.length === 0) return null;

	const sectionKey = variant === "agent" ? "agent" : "toolboxes";
	const onRemove = props.variant === "added" ? props.onRemove : undefined;
	const disabled = props.variant === "added" && props.disabled === true;
	return (
		<RoomToolsSection
			title={t(`sections.${sectionKey}.title`)}
			tooltip={t(`sections.${sectionKey}.tooltip`)}
			count={toolboxes.length}
		>
			<ToolList>
				{toolboxes.map((toolbox) => (
					<ToolboxRow
						key={toolbox.id}
						toolbox={toolbox}
						disabled={disabled}
						onRemove={
							onRemove ? () => onRemove(toolbox) : undefined
						}
					/>
				))}
			</ToolList>
		</RoomToolsSection>
	);
};
