import { useId } from "react";
import { useTranslation } from "@semoss/i18n";
import {
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
import {
	DEFAULT_TOOL_MODES,
	DEFAULT_TOOL_NAMES,
	type DefaultToolMode,
	getDefaultToolMode,
	setDefaultToolMode,
} from "../tools/default-tools";

const isMode = (value: string): value is DefaultToolMode =>
	(DEFAULT_TOOL_MODES as readonly string[]).includes(value);

/** Props for {@link TeamworkDefaultToolsField}. */
export interface TeamworkDefaultToolsFieldProps {
	/** The room's `defaultTools` option. */
	defaultTools: RoomStore["options"]["defaultTools"];
	/** Store the new modes in the room's options. */
	onChange: (defaultTools: RoomStore["options"]["defaultTools"]) => void;
	/** Lock changes while the current turn is in progress. */
	disabled?: boolean;
}

/**
 * The room settings that say how a chat runs each default tool, the folder
 * tools this browser adds to every message and runs in Chat Files: Auto runs
 * it on its own, Ask waits for the user's approval of each call, and Disabled
 * leaves it out of the messages. The room saves the choice with its other
 * options before the next message.
 */
export const TeamworkDefaultToolsField = ({
	defaultTools,
	onChange,
	disabled = false,
}: TeamworkDefaultToolsFieldProps) => {
	const { t } = useTranslation("teamwork");
	const idPrefix = useId();

	return (
		<Field>
			<FieldLabel>{t("defaultTools.label")}</FieldLabel>
			<FieldDescription>{t("defaultTools.description")}</FieldDescription>
			<ul className="flex flex-col divide-y divide-border rounded-md border border-border">
				{DEFAULT_TOOL_NAMES.map((name) => {
					const selectId = `${idPrefix}-${name}`;
					return (
						// relative, so the select's hidden native control is
						// placed inside the row: placed against a scroll area's
						// root instead, it stretches the panel below the form
						<li
							key={name}
							className="relative flex min-w-0 items-center gap-3 px-3 py-2"
						>
							<Label
								htmlFor={selectId}
								className="flex min-w-0 flex-1 flex-col items-start gap-0.5 font-normal"
							>
								<span className="font-medium text-sm">
									{t(`tools.titles.${name}`)}
								</span>
								<code className="truncate text-muted-foreground text-xs">
									{name}
								</code>
							</Label>
							<Select
								disabled={disabled}
								value={getDefaultToolMode(defaultTools, name)}
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
										<SelectItem key={mode} value={mode}>
											{t(`defaultTools.modes.${mode}`)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</li>
					);
				})}
			</ul>
		</Field>
	);
};
