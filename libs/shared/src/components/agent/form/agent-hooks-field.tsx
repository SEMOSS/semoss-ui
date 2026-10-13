import { Plus } from "lucide-react";
import { useEffect, useId } from "react";
import {
	type UseFormClearErrors,
	type UseFormSetError,
	useWatch,
} from "react-hook-form";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	type Control,
	Controller,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
	Muted,
	Small,
	Textarea,
	ToggleGroup,
	ToggleGroupItem,
	useFieldArray,
} from "@semoss/ui/next";
import { type AgentHookCapabilities, PIXEL_HOOK_KIND } from "../agent.types";
import {
	AgentHookHeader,
	getAgentHookIcon,
	useAgentHookCopy,
} from "../agent-hook-header";
import { AgentHookBindingsField } from "./agent-hook-bindings-field";
import type { AgentFormValues } from "./types";

const hasPixelTerminator = (pixel: string) =>
	pixel.trim().length === 0 || pixel.trimEnd().endsWith(";");

interface AgentHooksFieldProps {
	control: Control<AgentFormValues>;
	setError: UseFormSetError<AgentFormValues>;
	clearErrors: UseFormClearErrors<AgentFormValues>;
	/** Locks hook additions while saving, including an open menu. */
	disabled?: boolean;
	/** Hook kinds the server recognizes (GetWorkspace's `known_hook_kinds`). */
	knownKinds: string[];
	/** Runtime-owned form metadata keyed by hook kind. */
	capabilities: AgentHookCapabilities;
}

export const AgentHooksField = ({
	control,
	setError,
	clearErrors,
	disabled,
	knownKinds,
	capabilities,
}: AgentHooksFieldProps) => {
	const idPrefix = useId();
	const { t } = useTranslation("agent");
	const { getLabel, getDescription } = useAgentHookCopy();
	const {
		fields: hookFields,
		append: appendHook,
		remove: removeHook,
	} = useFieldArray({ control, name: "hooks" });
	const hooks = useWatch({ control, name: "hooks" }) ?? [];
	const pixelSemicolonError = t("form.hooks.pixelSemicolonError");

	useEffect(() => {
		hooks.forEach((hook, index) => {
			if (hook.kind !== PIXEL_HOOK_KIND) return;
			const name = `hooks.${index}.pixel` as const;
			if (!hasPixelTerminator(hook.pixel ?? "")) {
				setError(name, {
					type: "validate",
					message: pixelSemicolonError,
				});
			}
		});
	}, [hooks, pixelSemicolonError, setError]);

	// A no-param kind (git_commit/log_tools/ppt_to_pdf) is meaningless to add
	// twice - once present, drop it from the "add hook" list. `pixel` stays
	// addable repeatedly since distinct pixel expressions are legitimate.
	const addableKinds = knownKinds.filter(
		(kind) =>
			kind === PIXEL_HOOK_KIND ||
			!hookFields.some((f) => f.kind === kind),
	);

	return (
		<div className="flex flex-col gap-3">
			{hookFields.length === 0 ? (
				<Muted className="font-normal">{t("empty.hooks")}</Muted>
			) : (
				<ul className="flex flex-col gap-2">
					{hookFields.map((hookField, index) => {
						const pixelId = `${idPrefix}-pixel-${index}`;
						const capability = capabilities[hookField.kind];
						const bindingSources =
							capability?.binding_sources ?? [];
						return (
							<li
								key={hookField.id}
								className="flex flex-col gap-3 rounded-md border border-border bg-card p-4"
							>
								<AgentHookHeader
									kind={hookField.kind}
									onRemove={() => removeHook(index)}
								/>
								{hookField.kind === PIXEL_HOOK_KIND && (
									<>
										<Controller
											name={`hooks.${index}.pixel`}
											control={control}
											rules={{
												validate: (value) =>
													hasPixelTerminator(
														value ?? "",
													) || pixelSemicolonError,
											}}
											render={({ field, fieldState }) => {
												const error =
													fieldState.error?.message;
												const errorId = `${pixelId}-error`;
												return (
													<Field
														data-invalid={!!error}
													>
														<FieldLabel
															htmlFor={pixelId}
														>
															{t(
																"form.hooks.pixelLabel",
															)}
														</FieldLabel>
														<Textarea
															{...field}
															id={pixelId}
															placeholder="LogMessage(message=[agent_output]);"
															rows={2}
															className="max-h-40 font-mono text-xs"
															aria-invalid={
																!!error
															}
															aria-describedby={
																errorId
															}
														/>
														{error ? (
															<FieldError
																id={errorId}
															>
																{error}
															</FieldError>
														) : (
															<FieldDescription
																id={errorId}
															>
																{t(
																	"form.hooks.pixelSemicolonHelp",
																)}
															</FieldDescription>
														)}
													</Field>
												);
											}}
										/>
										<Controller
											name={`hooks.${index}.events`}
											control={control}
											render={({
												field: eventsField,
											}) => (
												<>
													<Controller
														name={`hooks.${index}.bindings`}
														control={control}
														render={({
															field,
															fieldState,
														}) => (
															<AgentHookBindingsField
																pixel={
																	hooks[index]
																		?.pixel ??
																	""
																}
																value={
																	field.value
																}
																events={
																	eventsField.value ??
																	[]
																}
																runtimeEvents={
																	capability?.events ??
																	[]
																}
																sources={
																	bindingSources
																}
																onChange={
																	field.onChange
																}
																onBlur={
																	field.onBlur
																}
																error={
																	fieldState
																		.error
																		?.message
																}
																onValidityChange={(
																	message,
																) => {
																	const name =
																		`hooks.${index}.bindings` as const;
																	if (
																		message
																	) {
																		setError(
																			name,
																			{
																				type: "validate",
																				message,
																			},
																		);
																	} else {
																		clearErrors(
																			name,
																		);
																	}
																}}
															/>
														)}
													/>
													<div className="flex flex-col gap-1.5">
														<Small>
															{t("hooks.runsOn")}
														</Small>
														<ToggleGroup
															type="multiple"
															variant="outline"
															size="sm"
															spacing={2}
															className="flex-wrap"
															aria-label={t(
																"form.hooks.eventsLabel",
															)}
															value={
																eventsField.value ??
																[]
															}
															onValueChange={
																eventsField.onChange
															}
														>
															{(
																capability?.events ??
																[]
															).map((event) => (
																<ToggleGroupItem
																	key={event}
																	value={
																		event
																	}
																	className="font-mono text-xs"
																>
																	{event}
																</ToggleGroupItem>
															))}
														</ToggleGroup>
														<FieldDescription>
															{t(
																"form.hooks.eventsHelp",
															)}
														</FieldDescription>
													</div>
												</>
											)}
										/>
									</>
								)}
							</li>
						);
					})}
				</ul>
			)}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="w-fit"
						disabled={disabled || addableKinds.length === 0}
					>
						<Plus aria-hidden="true" />
						{t("form.hooks.add")}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" className="w-72">
					{addableKinds.map((kind) => {
						const Icon = getAgentHookIcon(kind);
						const description = getDescription(kind);
						return (
							<DropdownMenuItem
								disabled={disabled}
								key={kind}
								className="items-start"
								onSelect={() =>
									appendHook(
										kind === PIXEL_HOOK_KIND
											? {
													kind,
													pixel: "",
													events: [],
													bindings: {},
												}
											: { kind },
									)
								}
							>
								<Icon aria-hidden="true" className="mt-0.5" />
								<div className="flex min-w-0 flex-col">
									<span>{getLabel(kind)}</span>
									{description && (
										<span className="text-muted-foreground text-xs">
											{description}
										</span>
									)}
								</div>
							</DropdownMenuItem>
						);
					})}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
};
