import { Trash2 } from "lucide-react";
import { type Control, Controller, useFieldArray } from "react-hook-form";
import {
	Button,
	Checkbox,
	Muted,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from "@semoss/ui/next";
import {
	type AgentFormValues,
	HOOK_KIND_DESCRIPTIONS,
	PIXEL_HOOK_EVENTS,
	PIXEL_HOOK_KIND,
} from "./types";

export interface AgentHooksFieldProps {
	control: Control<AgentFormValues>;
	/** Hook kinds the server recognizes (GetWorkspace's `known_hook_kinds`). */
	knownKinds: string[];
}

export const AgentHooksField = ({
	control,
	knownKinds,
}: AgentHooksFieldProps) => {
	const {
		fields: hookFields,
		append: appendHook,
		remove: removeHook,
	} = useFieldArray({ control, name: "hooks" });

	// A no-param kind (git_commit/log_tools/ppt_to_pdf) is meaningless to add
	// twice - once present, drop it from the "add hook" list. `pixel` stays
	// addable repeatedly since distinct pixel expressions are legitimate.
	const addableKinds = knownKinds.filter(
		(kind) =>
			kind === PIXEL_HOOK_KIND ||
			!hookFields.some((f) => f.kind === kind),
	);

	return (
		<>
			<div className="flex flex-col gap-3 rounded-md border border-border p-3">
				{hookFields.length === 0 && (
					<Muted className="text-muted-foreground text-sm">
						No hooks added yet.
					</Muted>
				)}
				{hookFields.map((hookField, index) => (
					<div
						key={hookField.id}
						className="flex flex-col gap-2 border-border border-b pb-3 last:border-b-0 last:pb-0"
					>
						<div className="flex items-center justify-between gap-2">
							<span className="font-medium text-sm">
								{hookField.kind}
							</span>
							<Button
								variant="ghost"
								size="icon"
								type="button"
								onClick={() => removeHook(index)}
							>
								<Trash2 className="size-4" />
							</Button>
						</div>
						{hookField.kind === PIXEL_HOOK_KIND ? (
							<>
								<Controller
									name={`hooks.${index}.pixel`}
									control={control}
									render={({ field }) => (
										<Textarea
											aria-label="Pixel expression"
											placeholder="Pixel expression to run, e.g. MyReactor(arg='value');"
											className="max-h-[7.5rem]"
											{...field}
										/>
									)}
								/>
								<Controller
									name={`hooks.${index}.events`}
									control={control}
									render={({ field }) => (
										<div className="flex flex-col gap-1.5">
											<Muted className="text-muted-foreground text-xs">
												Fires on every event if none are
												checked
											</Muted>
											<div className="flex flex-wrap gap-x-4 gap-y-1.5">
												{PIXEL_HOOK_EVENTS.map(
													(event) => {
														const checked = (
															field.value ?? []
														).includes(event);
														return (
															// biome-ignore lint/a11y/noLabelWithoutControl: Checkbox forwards its ref/props to the underlying input via Radix
															<label
																key={event}
																className="flex items-center gap-1.5 text-sm"
															>
																<Checkbox
																	checked={
																		checked
																	}
																	onCheckedChange={(
																		next,
																	) => {
																		const current =
																			field.value ??
																			[];
																		field.onChange(
																			next
																				? [
																						...current,
																						event,
																					]
																				: current.filter(
																						(
																							e,
																						) =>
																							e !==
																							event,
																					),
																		);
																	}}
																/>
																{event}
															</label>
														);
													},
												)}
											</div>
										</div>
									)}
								/>
							</>
						) : (
							<Muted className="text-muted-foreground text-sm">
								{HOOK_KIND_DESCRIPTIONS[hookField.kind]}
							</Muted>
						)}
					</div>
				))}
			</div>
			<Select
				value=""
				onValueChange={(kind) =>
					appendHook(
						kind === PIXEL_HOOK_KIND
							? { kind, pixel: "", events: [] }
							: { kind },
					)
				}
				disabled={addableKinds.length === 0}
			>
				<SelectTrigger className="w-fit">
					<SelectValue placeholder="Add hook..." />
				</SelectTrigger>
				<SelectContent>
					{addableKinds.map((kind) => (
						<SelectItem key={kind} value={kind}>
							{kind}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</>
	);
};
