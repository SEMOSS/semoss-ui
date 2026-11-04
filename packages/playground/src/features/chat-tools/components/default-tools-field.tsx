import { useId } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Field,
	FieldDescription,
	FieldLabel,
	Label,
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
import { ChatToolDetails } from "./chat-tool-details";
import { CHAT_TOOL_LIST_CLASS_NAME } from "./chat-tool-list";
import { ROW_CHEVRON } from "./chat-tool-row";

const isMode = (value: string): value is DefaultToolMode =>
	(DEFAULT_TOOL_MODES as readonly string[]).includes(value);

/** What the model is told about each default tool, whatever its mode. */
const DEFAULT_TOOL_DEFINITIONS = new Map(
	buildFolderToolDefinitions({ executionOf: () => "auto" }).map(
		(definition) => [definition.name, definition],
	),
);

/** Props for {@link DefaultToolsField}. */
export interface DefaultToolsFieldProps {
	/** The room's `defaultTools` option. */
	defaultTools: RoomStore["options"]["defaultTools"];
	/** Store the new modes in the room's options. */
	onChange: (defaultTools: RoomStore["options"]["defaultTools"]) => void;
	/** Lock changes while the current turn is in progress. */
	disabled?: boolean;
}

/**
 * The settings that say how a chat runs each default tool, the folder tools
 * this browser adds to every message and runs in Chat Files: Auto runs it on
 * its own, Ask waits for the user's approval of each call, and Disabled leaves
 * it out of the messages. Each row opens to show what the model is told about
 * the tool. The room saves the choice with its other options before the next
 * message.
 */
export const DefaultToolsField = ({
	defaultTools,
	onChange,
	disabled = false,
}: DefaultToolsFieldProps) => {
	const { t } = useTranslation("chatTools");
	const idPrefix = useId();

	return (
		<Field>
			<FieldLabel>{t("defaultTools.label")}</FieldLabel>
			<FieldDescription>{t("defaultTools.description")}</FieldDescription>
			<ul className={CHAT_TOOL_LIST_CLASS_NAME}>
				{DEFAULT_TOOL_NAMES.map((name) => {
					const selectId = `${idPrefix}-${name}`;
					const title = t(`tools.titles.${name}`);
					const definition = DEFAULT_TOOL_DEFINITIONS.get(name);
					return (
						// relative, so the select's hidden native control is
						// placed inside the row: placed against a scroll area's
						// root instead, it stretches the panel below the form
						<li key={name} className="relative">
							<Collapsible>
								<div className="flex min-w-0 items-center gap-1 py-1 ps-1 pe-3">
									<CollapsibleTrigger
										className="group flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-accent focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
										aria-label={t(
											"defaultTools.showDetails",
											{
												tool: title,
											},
										)}
									>
										{ROW_CHEVRON}
									</CollapsibleTrigger>
									<Label
										htmlFor={selectId}
										className="flex min-w-0 flex-1 flex-col items-start gap-0.5 font-normal"
									>
										<span className="font-medium text-sm">
											{title}
										</span>
										<code className="truncate text-muted-foreground text-xs">
											{name}
										</code>
									</Label>
									<Select
										disabled={disabled}
										value={getDefaultToolMode(
											defaultTools,
											name,
										)}
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
										<SelectTrigger
											id={selectId}
											size="sm"
											className="w-32 shrink-0"
										>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{DEFAULT_TOOL_MODES.map((mode) => (
												<SelectItem
													key={mode}
													value={mode}
												>
													{t(
														`defaultTools.modes.${mode}`,
													)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<CollapsibleContent>
									<ChatToolDetails
										name={name}
										description={
											definition?.description ?? ""
										}
										parameters={listToolParameters(
											definition?.inputSchema,
										)}
									/>
								</CollapsibleContent>
							</Collapsible>
						</li>
					);
				})}
			</ul>
		</Field>
	);
};
