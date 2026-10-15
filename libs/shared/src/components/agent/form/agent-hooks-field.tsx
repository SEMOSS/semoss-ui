import { Plus } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	type Control,
	Controller,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	FieldDescription,
	FieldLabel,
	Muted,
	Small,
	Textarea,
	ToggleGroup,
	ToggleGroupItem,
	useFieldArray,
} from "@semoss/ui/next";
import { PIXEL_HOOK_EVENTS, PIXEL_HOOK_KIND } from "../agent.types";
import {
	AgentHookHeader,
	getAgentHookIcon,
	useAgentHookCopy,
} from "../agent-hook-header";
import type { AgentFormValues } from "./types";

interface AgentHooksFieldProps {
	control: Control<AgentFormValues>;
	/** Locks hook additions while saving, including an open menu. */
	disabled?: boolean;
	/** Hook kinds the server recognizes (GetWorkspace's `known_hook_kinds`). */
	knownKinds: string[];
}

export const AgentHooksField = ({
	control,
	disabled,
	knownKinds,
}: AgentHooksFieldProps) => {
	const idPrefix = useId();
	const { t } = useTranslation("agent");
	const { getLabel, getDescription } = useAgentHookCopy();
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
		<div className="flex flex-col gap-3">
			{hookFields.length === 0 ? (
				<Muted className="font-normal">{t("empty.hooks")}</Muted>
			) : (
				<ul className="flex flex-col gap-2">
					{hookFields.map((hookField, index) => {
						const pixelId = `${idPrefix}-pixel-${index}`;
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
										<div className="flex flex-col gap-1.5">
											<FieldLabel htmlFor={pixelId}>
												{t("form.hooks.pixelLabel")}
											</FieldLabel>
											<Controller
												name={`hooks.${index}.pixel`}
												control={control}
												render={({ field }) => (
													<Textarea
														id={pixelId}
														placeholder="MyReactor(arg='value');"
														rows={2}
														className="max-h-40 font-mono text-xs"
														{...field}
													/>
												)}
											/>
										</div>
										<Controller
											name={`hooks.${index}.events`}
											control={control}
											render={({ field }) => (
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
															field.value ?? []
														}
														onValueChange={
															field.onChange
														}
													>
														{PIXEL_HOOK_EVENTS.map(
															(event) => (
																<ToggleGroupItem
																	key={event}
																	value={
																		event
																	}
																	className="font-mono text-xs"
																>
																	{event}
																</ToggleGroupItem>
															),
														)}
													</ToggleGroup>
													<FieldDescription>
														{t(
															"form.hooks.eventsHelp",
														)}
													</FieldDescription>
												</div>
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
											? { kind, pixel: "", events: [] }
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
