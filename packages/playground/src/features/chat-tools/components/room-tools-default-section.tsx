import { useId } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import type { RoomStore } from "@/stores/room/room.store";
import { listToolParameters } from "../tools/chat-tool-info";
import {
	DEFAULT_TOOL_MODES,
	DEFAULT_TOOL_NAMES,
	type DefaultToolMode,
	getDefaultToolMode,
	setDefaultToolMode,
} from "../tools/default-tools";
import { buildFolderToolDefinitions } from "../tools/folder-tools";
import { ChatToolRow, MODE_COLUMN_CLASS_NAME } from "./chat-tool-row";
import { RoomToolsSection } from "./room-tools-section";
import { ToolList } from "./tool-list";

/**
 * Whether a select's value is a default tool mode.
 *
 * @param value - The value the select reports.
 * @return Whether it is `auto`, `ask`, or `disabled`.
 */
const isMode = (value: string): value is DefaultToolMode =>
	(DEFAULT_TOOL_MODES as readonly string[]).includes(value);

/** What the model is told about each default tool, whatever its mode. */
const DEFAULT_TOOL_DEFINITIONS = new Map(
	buildFolderToolDefinitions({ executionOf: () => "auto" }).map(
		(definition) => [definition.name, definition],
	),
);

/** Props for {@link RoomToolsDefaultSection}. */
export interface RoomToolsDefaultSectionProps {
	/** The room's `defaultTools` option. */
	defaultTools: RoomStore["options"]["defaultTools"];
	/** Store the new modes in the room's options. */
	onChange: (defaultTools: RoomStore["options"]["defaultTools"]) => void;
	/** Lock changes while the current turn is in progress. */
	disabled?: boolean;
	/**
	 * Agent runs bring their own tools instead, so the section says so in
	 * place of the list.
	 */
	isAgentMode?: boolean;
}

/**
 * Settings' Default section: how a chat runs each default tool, the folder
 * tools this browser adds to every message and runs in Room Files. Auto runs
 * it on its own, Ask waits for the user's approval of each call, and Disabled
 * leaves it out of the messages. Each tool is the same row as in the other
 * sections, with its mode set in the row's mode column, and opens to show
 * what the model is told about the tool. The room saves the choice with its
 * other options before the next message.
 */
export const RoomToolsDefaultSection = ({
	defaultTools,
	onChange,
	disabled = false,
	isAgentMode = false,
}: RoomToolsDefaultSectionProps) => {
	const { t } = useTranslation("chatTools");
	const idPrefix = useId();

	return (
		<RoomToolsSection
			title={t("sections.default.title")}
			tooltip={t("sections.default.tooltip")}
			count={isAgentMode ? undefined : DEFAULT_TOOL_NAMES.length}
		>
			<ToolList
				isEmpty={isAgentMode}
				emptyMessage={t("sections.default.agentNote")}
			>
				{DEFAULT_TOOL_NAMES.map((name) => {
					const selectId = `${idPrefix}-${name}`;
					const definition = DEFAULT_TOOL_DEFINITIONS.get(name);
					const mode = getDefaultToolMode(defaultTools, name);
					return (
						<ChatToolRow
							key={name}
							tool={{
								name: name,
								title: t(`tools.titles.${name}`),
								description: definition?.description ?? "",
								execution: mode === "ask" ? "ask" : "auto",
								parameters: listToolParameters(
									definition?.inputSchema,
								),
							}}
							renderMode={(titleId) => (
								<Select
									disabled={disabled}
									value={mode}
									onValueChange={(value) => {
										if (!disabled && isMode(value)) {
											onChange(
												setDefaultToolMode(
													defaultTools,
													name,
													value,
												),
											);
										}
									}}
								>
									{/* named by the tool and the mode it shows */}
									<SelectTrigger
										id={selectId}
										size="sm"
										aria-labelledby={`${titleId} ${selectId}`}
										className={MODE_COLUMN_CLASS_NAME}
									>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{DEFAULT_TOOL_MODES.map((option) => (
											<SelectItem
												key={option}
												value={option}
											>
												{t(
													`defaultTools.modes.${option}`,
												)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						/>
					);
				})}
			</ToolList>
		</RoomToolsSection>
	);
};
