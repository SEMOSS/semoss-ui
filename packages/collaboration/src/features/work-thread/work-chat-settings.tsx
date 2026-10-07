import { BookOpen, ChevronDown, Wrench } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { EngineSelect, splitMcpByType } from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	Badge,
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	FieldLabel,
	FieldLegend,
	FieldSet,
	Form,
	FormField,
	FormInput,
	FormTextarea,
	H3,
	P,
	Small,
	Spinner,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { useAgentDetail } from "@/features/agents/api/use-agent-detail";
import { CapabilityPicker } from "@/features/agents/components/capability-picker";
import { CapabilitySection } from "@/features/agents/components/capability-section";
import { useRoomModel } from "@/features/rooms/api/use-room-model";
import {
	type ThreadChatSettings,
	threadSettingsSchema,
} from "@/features/thread-assistant/thread-settings";
import { ThreadAgentSelect } from "./thread-agent-select";
import type {
	ChatSettingsDraft,
	WorkComposerSession,
} from "./work-composer-session";
import { useWorkThread } from "./work-thread-context";

const formSchema = threadSettingsSchema.extend({
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
});
type SettingsValues = z.infer<typeof formSchema>;
function formValues(settings: ThreadChatSettings): SettingsValues {
	return {
		...settings,
		temperature:
			settings.temperature === null ? "" : String(settings.temperature),
	};
}

interface WorkChatSettingsProps {
	/** The drawer keeps common choices visible and groups optional capabilities. */
	presentation?: "panel" | "drawer";
	/** Keeps form state above a portal that unmounts its visible content on close. */
	renderContainer?: (content: ReactNode, isSaving: boolean) => ReactNode;
	/** Retains only unfinished settings edits through composer and route remounts. */
	draftSession?: WorkComposerSession;
}

/** Persist settings for future turns without replacing the conversation. */
export function WorkChatSettings({
	presentation = "panel",
	renderContainer,
	draftSession,
}: WorkChatSettingsProps = {}) {
	const { session, snapshot, title } = useWorkThread();
	const id = useId();
	const isDrawer = presentation === "drawer";
	const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
	const form = useForm<SettingsValues>({
		resolver: zodResolver(formSchema),
		defaultValues: formValues(snapshot.settings),
	});
	const { errors, isSubmitting, dirtyFields } = form.formState;
	const committedAgentId = useRef(snapshot.settings.agentId);
	const restoredDraftSession = useRef<WorkComposerSession | undefined>(
		undefined,
	);
	const isChangingSettings = isSubmitting || snapshot.isSavingSettings;
	const agentId = form.watch("agentId");
	const modelId = form.watch("modelId");
	const resources = form.watch("mcp");
	const agent = useAgentDetail(agentId);
	const model = useRoomModel(modelId);
	const inherited = (agent.agent?.mcp ?? []).map((resource) => ({
		...resource,
		fromWorkspace: true,
	}));
	const inheritedIds = new Set(inherited.map((resource) => resource.id));
	const editable = resources.filter(
		(resource) => !inheritedIds.has(resource.id),
	);
	const sections = splitMcpByType([...inherited, ...editable]);
	const isLocked =
		!snapshot.isReady ||
		snapshot.isCompacting ||
		snapshot.isLoadingModel ||
		snapshot.isSavingSettings ||
		snapshot.isPreparing ||
		snapshot.turn.isRunning ||
		snapshot.turn.isSubmitting ||
		snapshot.turn.isRestoring ||
		snapshot.hasUnconfirmedSubmission ||
		snapshot.isCreationUncertain;
	useEffect(() => {
		const retained =
			draftSession !== restoredDraftSession.current
				? draftSession?.getChatSettingsDraft()
				: null;
		form.reset(formValues(snapshot.settings), { keepDirtyValues: true });
		if (retained) {
			for (const field of [
				"modelId",
				"agentId",
				"instructions",
				"temperature",
				"mcp",
			] as const) {
				const value = retained[field];
				if (value !== undefined)
					form.setValue(field, value, { shouldDirty: true });
			}
		}
		restoredDraftSession.current = draftSession;
		// A toolbar selection commits only the agent; preserve every other form draft.
		if (committedAgentId.current !== snapshot.settings.agentId) {
			form.resetField("agentId", {
				defaultValue: snapshot.settings.agentId,
			});
			committedAgentId.current = snapshot.settings.agentId;
		}
	}, [draftSession, form, snapshot.settings]);
	useEffect(() => {
		if (!draftSession) return;
		const retainDraft = (): void => {
			const values = form.getValues();
			const draft: ChatSettingsDraft = {
				...(form.getFieldState("modelId").isDirty
					? { modelId: values.modelId }
					: {}),
				...(form.getFieldState("agentId").isDirty
					? { agentId: values.agentId }
					: {}),
				...(form.getFieldState("instructions").isDirty
					? { instructions: values.instructions }
					: {}),
				...(form.getFieldState("temperature").isDirty
					? { temperature: values.temperature }
					: {}),
				...(form.getFieldState("mcp").isDirty
					? { mcp: values.mcp }
					: {}),
			};
			draftSession.setChatSettingsDraft(
				Object.keys(draft).length ? draft : null,
			);
		};
		const unsubscribe = form.subscribe({
			formState: { values: true, dirtyFields: true },
			callback: retainDraft,
		});
		retainDraft();
		return unsubscribe;
	}, [draftSession, form]);
	const resetSettings = (settings: ThreadChatSettings): void => {
		form.reset(formValues(settings));
		draftSession?.setChatSettingsDraft(null);
	};
	const handleSubmit = async (values: SettingsValues): Promise<void> => {
		if (isLocked) return;
		try {
			await session.saveSettings(title, {
				...values,
				temperature:
					values.temperature === ""
						? null
						: Number(values.temperature),
				mcp: values.mcp.filter(
					(resource) => !inheritedIds.has(resource.id),
				),
			});
			resetSettings(session.getSnapshot().settings);
		} catch (cause) {
			form.setError("root.server", {
				message:
					cause instanceof Error
						? cause.message
						: "Could not save settings.",
			});
		}
	};
	const advancedSettings = (
		<>
			<FormInput
				name="temperature"
				label="Temperature"
				description="0–1. Leave blank to use the model’s default."
				type="number"
				step="0.1"
				min="0"
				max="1"
				disabled={isChangingSettings}
			/>
			{(["KNOWLEDGE", "TOOLBOX"] as const).map((kind) => {
				const isKnowledge = kind === "KNOWLEDGE";
				const items = isKnowledge
					? sections.knowledge
					: sections.toolbox;
				const localItems = splitMcpByType(editable);
				const current = isKnowledge
					? localItems.knowledge
					: localItems.toolbox;
				const other = isKnowledge
					? localItems.toolbox
					: localItems.knowledge;
				return (
					<CapabilitySection
						key={kind}
						title={isKnowledge ? "Knowledge" : "Tools"}
						description={
							isKnowledge
								? "Sources available to this conversation."
								: "Capabilities available to the selected agent."
						}
						emptyText={
							isKnowledge
								? "No additional knowledge."
								: "No additional tools."
						}
						icon={isKnowledge ? BookOpen : Wrench}
						disabled={
							isChangingSettings ||
							agent.isLoading ||
							Boolean(agent.error)
						}
						items={items.map((resource) => ({
							id: resource.id,
							name: resource.name,
							readOnly: inheritedIds.has(resource.id),
							sourceLabel: "From agent",
						}))}
						onRemove={(resourceId) =>
							form.setValue(
								"mcp",
								editable.filter(
									(resource) => resource.id !== resourceId,
								),
								{ shouldDirty: true },
							)
						}
					>
						<CapabilityPicker
							kind={kind}
							values={current}
							lockedValues={inherited}
							disabled={isChangingSettings}
							onChange={(values) =>
								form.setValue("mcp", [...other, ...values], {
									shouldDirty: true,
								})
							}
						/>
					</CapabilitySection>
				);
			})}
			<section aria-labelledby={`${id}-skills`}>
				<H3 id={`${id}-skills`} className="font-medium text-base">
					Skills
				</H3>
				<P className="mt-1 text-muted-foreground text-sm">
					Skills are inherited from the selected agent.
				</P>
				{agentId && agent.agent?.skills.length ? (
					<ul className="mt-3 divide-y">
						{agent.agent.skills.map((skill) => (
							<li
								key={skill.id}
								className="flex min-w-0 items-center gap-3 py-2"
							>
								<Small className="wrap-anywhere min-w-0 flex-1">
									{skill.name}
								</Small>
								<Badge variant="outline">From agent</Badge>
							</li>
						))}
					</ul>
				) : (
					<P className="mt-3 text-muted-foreground text-sm">
						{agent.isLoading
							? "Loading inherited skills…"
							: agent.error
								? "Skills are unavailable until the agent loads."
								: "No inherited skills."}
					</P>
				)}
			</section>
		</>
	);
	const content = (
		<div
			className={
				isDrawer
					? "flex min-h-0 flex-1 flex-col"
					: "flex h-full min-h-0 flex-col"
			}
		>
			<Form
				form={form}
				onSubmit={handleSubmit}
				onError={(validationErrors) => {
					if (isDrawer && validationErrors.temperature)
						setIsAdvancedOpen(true);
				}}
				noValidate
				aria-busy={isSubmitting}
				className="flex min-h-0 flex-1 flex-col"
			>
				<div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
					{!isDrawer && (
						<>
							<div className="space-y-2">
								<H3 className="text-lg">Chat settings</H3>
								<P className="text-muted-foreground">
									These settings apply to future messages in
									this conversation.
								</P>
							</div>
							<FormField
								name="agentId"
								render={({ field }) => (
									<FieldSet className="min-w-0 gap-2">
										<FieldLegend variant="label">
											Agent
										</FieldLegend>
										<ThreadAgentSelect
											value={field.value}
											name={
												agent.agent?.name ||
												(field.value ===
												snapshot.settings.agentId
													? snapshot.agent?.name
													: "") ||
												field.value
											}
											disabled={isChangingSettings}
											triggerRef={field.ref}
											onBlur={field.onBlur}
											onChange={field.onChange}
										/>
									</FieldSet>
								)}
							/>
						</>
					)}
					{agent.isLoading && (
						<output className="flex items-center gap-2 text-sm">
							<Spinner />
							Loading agent…
						</output>
					)}
					{agent.error && (
						<Alert variant="destructive">
							<AlertDescription>
								Could not load this agent. Choose another or
								retry.
								<Button
									type="button"
									variant="outline"
									onClick={agent.refresh}
								>
									Retry agent
								</Button>
							</AlertDescription>
						</Alert>
					)}
					<FormField
						name="modelId"
						render={({ field }) => (
							<FieldSet className="min-w-0 gap-2">
								<FieldLabel htmlFor={`${id}-model`}>
									Model
								</FieldLabel>
								<EngineSelect
									id={`${id}-model`}
									className={
										isDrawer
											? "pointer-coarse:min-h-11"
											: undefined
									}
									value={field.value}
									name={
										model.engine?.engine_display_name ||
										model.engine?.engine_name ||
										(snapshot.modelId === field.value
											? snapshot.modelName
											: "") ||
										"Choose model"
									}
									disabled={isChangingSettings}
									engineTypes={["MODEL"]}
									metaFilters={[{ tag: "text-generation" }]}
									onChange={(engine) =>
										field.onChange(engine.engine_id)
									}
									popoverContentProps={{ align: "start" }}
								/>
								{errors.modelId && (
									<P className="text-destructive">
										{errors.modelId.message}
									</P>
								)}
							</FieldSet>
						)}
					/>
					{snapshot.modelError && (
						<Alert variant="destructive">
							<AlertDescription>
								<span>{snapshot.modelError}</span>
								<Button
									type="button"
									variant="outline"
									disabled={snapshot.isLoadingModel}
									onClick={() =>
										void session.resolveDefaults()
									}
								>
									Retry models
								</Button>
							</AlertDescription>
						</Alert>
					)}
					<FormTextarea
						name="instructions"
						label={
							isDrawer
								? "Instructions"
								: "Additional conversation instructions"
						}
						description={
							isDrawer
								? "Preferences for how the assistant responds."
								: "Added to the agent’s instructions for this conversation."
						}
						rows={4}
						disabled={isChangingSettings}
					/>
					{isDrawer ? (
						<Collapsible
							open={isAdvancedOpen}
							onOpenChange={setIsAdvancedOpen}
						>
							<CollapsibleTrigger asChild>
								<Button
									type="button"
									variant="ghost"
									className="pointer-coarse:min-h-11 w-full justify-between px-0"
								>
									Advanced
									<ChevronDown
										aria-hidden="true"
										className={
											isAdvancedOpen
												? "rotate-180"
												: undefined
										}
									/>
								</Button>
							</CollapsibleTrigger>
							<CollapsibleContent className="space-y-6 pt-4">
								{advancedSettings}
							</CollapsibleContent>
						</Collapsible>
					) : (
						advancedSettings
					)}
					{(errors.root?.server || snapshot.settingsError) && (
						<Alert variant="destructive">
							<AlertDescription>
								{errors.root?.server?.message ||
									snapshot.settingsError}
							</AlertDescription>
						</Alert>
					)}
					{isLocked && (
						<P className="text-muted-foreground">
							Settings can be saved after the current connection
							or response finishes.
						</P>
					)}
				</div>
				<div className="flex shrink-0 flex-wrap items-center gap-2 border-t bg-background px-4 py-3">
					<Small className="mr-auto text-muted-foreground">
						{Object.keys(dirtyFields).length
							? "Unsaved changes"
							: isDrawer
								? "Saved"
								: "Settings up to date"}
					</Small>
					<Button
						type="button"
						variant="outline"
						className={
							isDrawer ? "pointer-coarse:min-h-11" : undefined
						}
						disabled={isChangingSettings}
						onClick={() => resetSettings(snapshot.settings)}
					>
						Reset
					</Button>
					<Button
						type="submit"
						className={
							isDrawer ? "pointer-coarse:min-h-11" : undefined
						}
						disabled={
							isLocked ||
							isSubmitting ||
							agent.isLoading ||
							Boolean(agent.error)
						}
					>
						{isSubmitting && <Spinner />}
						{isSubmitting
							? "Saving…"
							: isDrawer
								? "Save"
								: "Save changes"}
					</Button>
				</div>
			</Form>
		</div>
	);
	return renderContainer
		? renderContainer(content, isChangingSettings)
		: content;
}
