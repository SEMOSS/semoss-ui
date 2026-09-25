import { ArrowLeft, BookOpen, Wrench } from "lucide-react";
import {
	type RefObject,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import { EngineSelect, type MCPConfig, splitMcpByType } from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	Button,
	cn,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Field,
	FieldError,
	FieldLabel,
	Form,
	FormField,
	Input,
	Muted,
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	Spinner,
	Textarea,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { toError } from "@semoss/utility";
import { mcpConfigSchema } from "@/features/agents/api/agent-schemas";
import { CapabilityPicker } from "@/features/agents/components/capability-picker";
import { CapabilitySection } from "@/features/agents/components/capability-section";
import type { AgentConfiguration } from "@/features/agents/types/agent";
import { useRoomModel } from "../api/use-room-model";
import type { RoomSettings } from "../types/room";

const MAX_INSTRUCTIONS_LENGTH = 8_000;

const roomSettingsSchema = z.object({
	modelId: z.string(),
	temperature: z
		.string()
		.refine(
			(value) =>
				value === "" ||
				(Number.isFinite(Number(value)) &&
					Number(value) >= 0 &&
					Number(value) <= 1),
			"Enter a temperature from 0 to 1.",
		),
	instructions: z
		.string()
		.max(
			MAX_INSTRUCTIONS_LENGTH,
			"The room system prompt cannot exceed 8,000 characters.",
		),
	mcp: z.array(mcpConfigSchema),
});

type RoomSettingsFormValues = z.infer<typeof roomSettingsSchema>;
type RoomSettingsView = "settings" | "knowledge" | "toolboxes";

interface RoomSettingsDialogProps {
	open: boolean;
	/** Use a right-side overlay drawer for new-room settings. */
	presentation?: "dialog" | "drawer";
	agentName: string;
	agent?: AgentConfiguration;
	modelId?: string;
	modelName?: string;
	isReadOnly?: boolean;
	isModelLocked?: boolean;
	onConfigure?: () => void;
	settings: RoomSettings;
	inheritedMcp: MCPConfig[];
	returnFocusRef: RefObject<HTMLButtonElement | null>;
	onOpenChange: (open: boolean) => void;
	onSave: (settings: RoomSettings) => Promise<void>;
}

function dedupeMcp(values: MCPConfig[]): MCPConfig[] {
	const unique = new Map<string, MCPConfig>();
	for (const value of values) {
		if (!unique.has(value.id)) unique.set(value.id, value);
	}
	return Array.from(unique.values());
}

function editableSettings(
	settings: RoomSettings,
	lockedMcp: MCPConfig[],
	modelId = "",
): RoomSettingsFormValues {
	const lockedIds = new Set(lockedMcp.map((value) => value.id));
	return {
		modelId: settings.modelId ?? modelId,
		temperature:
			settings.temperature == null ? "" : String(settings.temperature),
		instructions: settings.instructions,
		mcp: dedupeMcp(
			settings.mcp.filter(
				(value) =>
					!value.fromWorkspace &&
					!value.fromRoom &&
					!lockedIds.has(value.id),
			),
		),
	};
}

/** Edit room-only instructions and resources without changing the selected agent. */
export function RoomSettingsDialog({
	open,
	presentation = "dialog",
	agentName,
	agent,
	modelId = "",
	modelName = "",
	isReadOnly = false,
	isModelLocked = false,
	onConfigure,
	settings,
	inheritedMcp,
	returnFocusRef,
	onOpenChange,
	onSave,
}: RoomSettingsDialogProps) {
	const promptId = useId();
	const temperatureId = useId();
	const promptErrorId = useId();
	const descriptionId = useId();
	const wasOpenRef = useRef(false);
	const knowledgeAddButtonRef = useRef<HTMLButtonElement>(null);
	const toolboxAddButtonRef = useRef<HTMLButtonElement>(null);
	const [activeView, setActiveView] = useState<RoomSettingsView>("settings");
	const lockedMcp = useMemo(
		() =>
			dedupeMcp([
				...inheritedMcp.map((value) => ({
					...value,
					fromWorkspace: true,
				})),
				...settings.mcp.filter(
					(value) => value.fromWorkspace || value.fromRoom,
				),
			]),
		[inheritedMcp, settings.mcp],
	);
	const form = useForm<RoomSettingsFormValues>({
		resolver: zodResolver(roomSettingsSchema),
		defaultValues: editableSettings(settings, lockedMcp, modelId),
	});
	const { errors, isSubmitting } = form.formState;
	const selectedModel = form.watch("modelId");
	const model = useRoomModel(open ? selectedModel : "");
	const isDisabled = isSubmitting || isReadOnly;
	const localMcp = form.watch("mcp");
	const { knowledge: localKnowledge, toolbox: localToolbox } =
		splitMcpByType(localMcp);
	const { knowledge: lockedKnowledge, toolbox: lockedToolbox } =
		splitMcpByType(lockedMcp);

	useEffect(() => {
		if (open && !wasOpenRef.current) {
			form.reset(editableSettings(settings, lockedMcp, modelId));
			setActiveView("settings");
		}
		wasOpenRef.current = open;
	}, [form, lockedMcp, modelId, open, settings]);

	function setMcp(values: MCPConfig[]): void {
		form.setValue("mcp", dedupeMcp(values), {
			shouldDirty: true,
			shouldValidate: true,
		});
		form.clearErrors("root.server");
	}

	async function handleSubmit(values: RoomSettingsFormValues): Promise<void> {
		if (isReadOnly) return;
		try {
			await onSave({
				modelId: isModelLocked ? modelId : values.modelId,
				temperature:
					values.temperature === ""
						? null
						: Number(values.temperature),
				instructions: values.instructions,
				mcp: dedupeMcp(values.mcp),
			});
		} catch (cause: unknown) {
			form.setError("root.server", {
				type: "server",
				message: `Room settings could not be saved. ${toError(cause).message}`,
			});
			return;
		}
		setActiveView("settings");
		onOpenChange(false);
	}

	function handleOpenChange(nextOpen: boolean): void {
		if (!nextOpen && isSubmitting) return;
		if (!nextOpen) setActiveView("settings");
		onOpenChange(nextOpen);
	}

	function handlePickerDone(): void {
		const addButton =
			activeView === "knowledge"
				? knowledgeAddButtonRef
				: toolboxAddButtonRef;
		setActiveView("settings");
		requestAnimationFrame(() => addButton.current?.focus());
	}

	const isSettingsView = activeView === "settings";
	const activePickerKind =
		activeView === "knowledge" ? "KNOWLEDGE" : "TOOLBOX";
	const isDrawer = presentation === "drawer";
	const SettingsRoot = isDrawer ? Sheet : Dialog;
	const SettingsContent = isDrawer ? SheetContent : DialogContent;
	const SettingsHeader = isDrawer ? SheetHeader : DialogHeader;
	const SettingsTitle = isDrawer ? SheetTitle : DialogTitle;
	const SettingsDescription = isDrawer ? SheetDescription : DialogDescription;
	const SettingsFooter = isDrawer ? SheetFooter : DialogFooter;

	return (
		<SettingsRoot open={open} onOpenChange={handleOpenChange}>
			<SettingsContent
				aria-describedby={descriptionId}
				className={
					isDrawer
						? "h-dvh w-full overflow-hidden p-6 motion-reduce:animate-none sm:max-w-xl"
						: "overflow-hidden sm:max-w-2xl"
				}
				showCloseButton={!isSubmitting}
				onEscapeKeyDown={(event) => {
					if (isSubmitting) event.preventDefault();
				}}
				onInteractOutside={(event) => {
					if (isSubmitting) event.preventDefault();
				}}
				onCloseAutoFocus={(event) => {
					event.preventDefault();
					returnFocusRef.current?.focus();
				}}
			>
				{isSettingsView ? (
					<SettingsHeader className="shrink-0 p-0 pr-10">
						<SettingsTitle>Room settings</SettingsTitle>
						<SettingsDescription>
							<span id={descriptionId}>
								Configure the model, instructions and resources
								for this room only.
							</span>
						</SettingsDescription>
					</SettingsHeader>
				) : (
					<SettingsHeader className="shrink-0 flex-row items-start gap-3 p-0 pr-10 text-left">
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							aria-label="Back to room settings"
							onClick={handlePickerDone}
						>
							<ArrowLeft aria-hidden="true" />
						</Button>
						<div className="min-w-0 flex-1">
							<SettingsTitle>
								{activeView === "knowledge"
									? "Add knowledge"
									: "Add toolboxes"}
							</SettingsTitle>
							<SettingsDescription className="mt-2">
								<span id={descriptionId}>
									{activeView === "knowledge"
										? "Choose sources available to this room."
										: "Choose tools available to this room."}
								</span>
							</SettingsDescription>
						</div>
					</SettingsHeader>
				)}
				<Form
					form={form}
					onSubmit={handleSubmit}
					noValidate
					aria-busy={isSubmitting}
					className={cn(
						"flex min-h-0 flex-col gap-6 overflow-hidden",
						isDrawer && "flex-1",
					)}
				>
					{isSettingsView ? (
						<>
							<fieldset
								disabled={isDisabled}
								className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-y-auto pr-1"
							>
								<section
									className="space-y-2"
									aria-label="Agent configuration"
								>
									<div className="flex flex-wrap items-center justify-between gap-2">
										<span className="font-medium text-sm">
											Agent: {agentName}
										</span>
										{onConfigure && (
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={onConfigure}
											>
												Agent settings
											</Button>
										)}
									</div>
									{agent && (
										<>
											<Muted className="block text-xs">
												Skills:{" "}
												{agent.skills
													.map((skill) => skill.name)
													.join(", ") ||
													"None configured"}
											</Muted>
											<Muted className="block text-xs">
												Agent limits:{" "}
												{agent.config_json?.budgets
													?.max_turns ?? 40}{" "}
												turns;{" "}
												{agent.config_json?.budgets
													?.max_reflections ??
													"backend default"}{" "}
												reflections
												{agent.config_json?.budgets
													?.max_seconds !== undefined
													? `; ${agent.config_json.budgets.max_seconds} seconds`
													: ""}
												.
											</Muted>
										</>
									)}
								</section>
								{isReadOnly && (
									<Muted>
										Settings are read-only while this run is
										active, including while waiting for
										approval.
									</Muted>
								)}
								<FormField
									control={form.control}
									name="modelId"
									render={({ field }) => (
										<fieldset className="space-y-2">
											<legend className="font-medium text-sm">
												Model
											</legend>
											<EngineSelect
												value={field.value}
												name={
													model.engine
														?.engine_display_name ||
													model.engine?.engine_name ||
													(field.value === modelId
														? modelName
														: field.value)
												}
												engineTypes={["MODEL"]}
												metaFilters={[
													{ tag: "text-generation" },
												]}
												disabled={
													isDisabled || isModelLocked
												}
												onChange={(engine) =>
													field.onChange(
														engine.engine_id,
													)
												}
											/>
										</fieldset>
									)}
								/>
								<div className="space-y-2">
									<FormField
										control={form.control}
										name="temperature"
										render={({ field, fieldState }) => (
											<Field
												data-invalid={
													fieldState.invalid
												}
											>
												<FieldLabel
													htmlFor={temperatureId}
												>
													Temperature
												</FieldLabel>
												<Input
													{...field}
													id={temperatureId}
													type="number"
													min={0}
													max={1}
													step={0.01}
													placeholder="Backend default"
													disabled={isDisabled}
													aria-invalid={
														fieldState.invalid
													}
													aria-describedby={`${temperatureId}-help${fieldState.error ? ` ${temperatureId}-error` : ""}`}
												/>
												<Muted
													id={`${temperatureId}-help`}
													className="text-xs"
												>
													Optional. Leave empty to use
													the backend default.
												</Muted>
												{fieldState.error && (
													<FieldError
														id={`${temperatureId}-error`}
													>
														{
															fieldState.error
																.message
														}
													</FieldError>
												)}
											</Field>
										)}
									/>
									<Button
										type="button"
										size="sm"
										variant="outline"
										disabled={
											isDisabled ||
											form.watch("temperature") === ""
										}
										onClick={() =>
											form.setValue("temperature", "", {
												shouldDirty: true,
												shouldValidate: true,
											})
										}
									>
										Reset temperature
									</Button>
								</div>
								<FormField
									control={form.control}
									name="instructions"
									render={({ field, fieldState }) => (
										<Field
											data-invalid={fieldState.invalid}
										>
											<FieldLabel htmlFor={promptId}>
												Instructions
											</FieldLabel>
											<Textarea
												{...field}
												id={promptId}
												className="max-h-64 min-h-32 resize-y overflow-y-auto"
												maxLength={
													MAX_INSTRUCTIONS_LENGTH
												}
												aria-invalid={
													fieldState.invalid
												}
												aria-describedby={
													fieldState.error
														? promptErrorId
														: undefined
												}
												placeholder="Add room-specific instructions"
											/>
											{fieldState.error && (
												<FieldError id={promptErrorId}>
													{fieldState.error.message}
												</FieldError>
											)}
										</Field>
									)}
								/>
								<CapabilitySection
									title="Knowledge"
									description="Sources available to this room."
									emptyText="No knowledge added yet."
									icon={BookOpen}
									items={[
										...lockedKnowledge.map((value) => ({
											...value,
											readOnly: true,
											sourceLabel: value.fromRoom
												? "From room"
												: "From agent",
										})),
										...localKnowledge,
									]}
									disabled={isDisabled}
									addButtonRef={knowledgeAddButtonRef}
									onAdd={() => setActiveView("knowledge")}
									onRemove={(id) =>
										setMcp(
											localMcp.filter(
												(value) => value.id !== id,
											),
										)
									}
								/>
								<CapabilitySection
									title="Toolboxes"
									description="Tools available to this room."
									emptyText="No toolboxes added yet."
									icon={Wrench}
									items={[
										...lockedToolbox.map((value) => ({
											...value,
											readOnly: true,
											sourceLabel: value.fromRoom
												? "From room"
												: "From agent",
										})),
										...localToolbox,
									]}
									disabled={isDisabled}
									addButtonRef={toolboxAddButtonRef}
									onAdd={() => setActiveView("toolboxes")}
									onRemove={(id) =>
										setMcp(
											localMcp.filter(
												(value) => value.id !== id,
											),
										)
									}
								/>
							</fieldset>
							{errors.root?.server?.message && (
								<Alert variant="destructive">
									<AlertDescription>
										{errors.root.server.message}
									</AlertDescription>
								</Alert>
							)}
							<SettingsFooter className="shrink-0 flex-col gap-2 p-0 sm:flex-row sm:justify-end">
								<Button
									type="button"
									variant="outline"
									disabled={isSubmitting}
									onClick={() => handleOpenChange(false)}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={isDisabled}>
									{isSubmitting && (
										<Spinner className="size-4" />
									)}
									{isSubmitting ? "Saving…" : "Save settings"}
								</Button>
							</SettingsFooter>
						</>
					) : (
						<CapabilityPicker
							kind={activePickerKind}
							presentation="embedded"
							autoFocusSearch
							values={
								activeView === "knowledge"
									? localKnowledge
									: localToolbox
							}
							lockedValues={
								activeView === "knowledge"
									? lockedKnowledge
									: lockedToolbox
							}
							disabled={isDisabled}
							onChange={(values) =>
								setMcp(
									activeView === "knowledge"
										? [...values, ...localToolbox]
										: [...localKnowledge, ...values],
								)
							}
							onDone={handlePickerDone}
						/>
					)}
				</Form>
			</SettingsContent>
		</SettingsRoot>
	);
}
