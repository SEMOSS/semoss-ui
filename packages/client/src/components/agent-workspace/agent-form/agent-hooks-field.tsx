import { ChevronRight, Trash2 } from "lucide-react";
import {
	type Control,
	Controller,
	type UseFormClearErrors,
	type UseFormSetError,
	useFieldArray,
} from "react-hook-form";
import {
	Button,
	Checkbox,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Muted,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from "@semoss/ui/next";
import { AgentHookBindingsField } from "./agent-hook-bindings-field";
import {
	type AgentFormValues,
	HOOK_KIND_DESCRIPTIONS,
	PIXEL_HOOK_EVENTS,
	PIXEL_HOOK_KIND,
} from "./types";

export interface AgentHooksFieldProps {
	control: Control<AgentFormValues>;
	setError: UseFormSetError<AgentFormValues>;
	clearErrors: UseFormClearErrors<AgentFormValues>;
	/** Hook kinds the server recognizes (GetWorkspace's `known_hook_kinds`). */
	knownKinds: string[];
}

export const AgentHooksField = ({
	control,
	setError,
	clearErrors,
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
					<Collapsible
						key={hookField.id}
						defaultOpen
						className="group/hook border-border border-b pb-3 last:border-b-0 last:pb-0"
					>
						<div className="flex items-center justify-between gap-2">
							<CollapsibleTrigger asChild>
								<Button
									type="button"
									variant="ghost"
									className="min-w-0 flex-1 justify-start px-1"
								>
									<ChevronRight className="size-4 shrink-0 transition-transform group-data-[state=open]/hook:rotate-90" />
									<span className="truncate font-medium text-sm">
										{hookField.kind}
									</span>
								</Button>
							</CollapsibleTrigger>
							<Button
								variant="ghost"
								size="icon"
								type="button"
								aria-label="Remove hook"
								onClick={() => removeHook(index)}
							>
								<Trash2 className="size-4" />
							</Button>
						</div>
						<CollapsibleContent className="flex flex-col gap-2 pt-1">
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
										name={`hooks.${index}.bindings`}
										control={control}
										render={({ field, fieldState }) => (
											<AgentHookBindingsField
												value={field.value}
												onChange={field.onChange}
												onBlur={field.onBlur}
												error={
													fieldState.error?.message
												}
												onValidityChange={(message) => {
													const name =
														`hooks.${index}.bindings` as const;
													if (message) {
														setError(name, {
															type: "validate",
															message,
														});
													} else {
														clearErrors(name);
													}
												}}
											/>
										)}
									/>
									<Controller
										name={`hooks.${index}.events`}
										control={control}
										render={({ field }) => (
											<div className="flex flex-col gap-1.5">
												<Muted className="text-muted-foreground text-xs">
													Fires on every event if none
													are checked
												</Muted>
												<div className="flex flex-wrap gap-x-4 gap-y-1.5">
													{PIXEL_HOOK_EVENTS.map(
														(event) => {
															const checked = (
																field.value ??
																[]
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
						</CollapsibleContent>
					</Collapsible>
				))}
			</div>
			<Select
				value=""
				onValueChange={(kind) =>
					appendHook(
						kind === PIXEL_HOOK_KIND
							? { kind, pixel: "", events: [], bindings: {} }
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
