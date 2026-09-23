import { ArrowLeft, BookOpen, Wrench } from "lucide-react";
import {
	type RefObject,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import { type MCPConfig, splitMcpByType } from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	Button,
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
import type { RoomSettings } from "../types/room";

const MAX_INSTRUCTIONS_LENGTH = 8_000;

const roomSettingsSchema = z.object({
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
	agentName: string;
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
): RoomSettingsFormValues {
	const lockedIds = new Set(lockedMcp.map((value) => value.id));
	return {
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
	settings,
	inheritedMcp,
	returnFocusRef,
	onOpenChange,
	onSave,
}: RoomSettingsDialogProps) {
	const promptId = useId();
	const promptErrorId = useId();
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
		defaultValues: editableSettings(settings, lockedMcp),
	});
	const { errors, isSubmitting } = form.formState;
	const localMcp = form.watch("mcp");
	const { knowledge: localKnowledge, toolbox: localToolbox } =
		splitMcpByType(localMcp);
	const { knowledge: lockedKnowledge, toolbox: lockedToolbox } =
		splitMcpByType(lockedMcp);

	useEffect(() => {
		if (open && !wasOpenRef.current) {
			form.reset(editableSettings(settings, lockedMcp));
			setActiveView("settings");
		}
		wasOpenRef.current = open;
	}, [form, lockedMcp, open, settings]);

	function setMcp(values: MCPConfig[]): void {
		form.setValue("mcp", dedupeMcp(values), {
			shouldDirty: true,
			shouldValidate: true,
		});
		form.clearErrors("root.server");
	}

	async function handleSubmit(values: RoomSettingsFormValues): Promise<void> {
		try {
			await onSave({
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
		handleOpenChange(false);
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

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent
				className="max-h-[calc(100dvh-2rem)] overflow-hidden sm:max-w-2xl"
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
					<DialogHeader>
						<DialogTitle>Room settings</DialogTitle>
						<DialogDescription>
							Configure instructions and resources for this room
							only.
						</DialogDescription>
					</DialogHeader>
				) : (
					<DialogHeader className="flex-row items-start gap-3 text-left">
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
							<DialogTitle>
								{activeView === "knowledge"
									? "Add knowledge"
									: "Add toolboxes"}
							</DialogTitle>
							<DialogDescription className="mt-2">
								{activeView === "knowledge"
									? "Choose sources available to this room."
									: "Choose tools available to this room."}
							</DialogDescription>
						</div>
					</DialogHeader>
				)}
				<Form
					form={form}
					onSubmit={handleSubmit}
					noValidate
					aria-busy={isSubmitting}
					className="flex min-h-0 flex-col gap-6 overflow-hidden"
				>
					{isSettingsView ? (
						<>
							<fieldset
								disabled={isSubmitting}
								className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-y-auto pr-1"
							>
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
									disabled={isSubmitting}
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
									disabled={isSubmitting}
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
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									disabled={isSubmitting}
									onClick={() => handleOpenChange(false)}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={isSubmitting}>
									{isSubmitting && (
										<Spinner className="size-4" />
									)}
									{isSubmitting ? "Saving…" : "Save settings"}
								</Button>
							</DialogFooter>
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
							disabled={isSubmitting}
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
			</DialogContent>
		</Dialog>
	);
}
