import { BookOpen, Settings2, Wrench } from "lucide-react";
import { createElement, useEffect, useId } from "react";
import { EngineSelect, splitMcpByType } from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	Button,
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
import type { WorkbenchPanelConfig } from "@semoss/workbench";
import { useAgentDetail } from "@/features/agents/api/use-agent-detail";
import { CapabilityPicker } from "@/features/agents/components/capability-picker";
import { CapabilitySection } from "@/features/agents/components/capability-section";
import { useRoomModel } from "@/features/rooms/api/use-room-model";
import {
	type ThreadChatSettings,
	threadSettingsSchema,
} from "@/features/thread-assistant/thread-settings";
import { ThreadAgentSelect } from "./thread-agent-select";
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

/** Persist settings for future turns without replacing the conversation. */
export function WorkSettingsPanel() {
	const { session, snapshot, title } = useWorkThread();
	const id = useId();
	const form = useForm<SettingsValues>({
		resolver: zodResolver(formSchema),
		defaultValues: formValues(snapshot.settings),
	});
	const { errors, isSubmitting, dirtyFields } = form.formState;
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
		form.reset(formValues(snapshot.settings), { keepDirtyValues: true });
	}, [form, snapshot.settings]);
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
			form.reset(formValues(session.getSnapshot().settings));
		} catch (cause) {
			form.setError("root.server", {
				message:
					cause instanceof Error
						? cause.message
						: "Could not save settings.",
			});
		}
	};
	return (
		<div className="flex h-full min-h-0 flex-col">
			<Form
				form={form}
				onSubmit={handleSubmit}
				noValidate
				aria-busy={isSubmitting}
				className="flex min-h-0 flex-1 flex-col"
			>
				<div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
					<div className="space-y-2">
						<H3 className="text-lg">Chat settings</H3>
						<P className="text-muted-foreground">
							These settings apply to future messages in this
							thread.
						</P>
					</div>
					<FormField
						name="agentId"
						render={({ field }) => (
							<FieldSet className="min-w-0 gap-2">
								<FieldLegend variant="label">Agent</FieldLegend>
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
									disabled={isSubmitting}
									onChange={field.onChange}
								/>
							</FieldSet>
						)}
					/>
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
								<FieldLegend variant="label">Model</FieldLegend>
								<EngineSelect
									value={field.value}
									name={
										model.engine?.engine_display_name ||
										model.engine?.engine_name ||
										(snapshot.modelId === field.value
											? snapshot.modelName
											: "") ||
										"Choose model"
									}
									disabled={isSubmitting}
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
						label="Additional thread instructions"
						description={
							<span id={`${id}-instructions-help`}>
								Added to the agent’s instructions for this
								conversation.
							</span>
						}
						aria-describedby={`${id}-instructions-help`}
						rows={4}
						disabled={isSubmitting}
					/>
					<FormInput
						name="temperature"
						label="Temperature"
						description={
							<span id={`${id}-temperature-help`}>
								0–1. Leave blank to use the model’s default.
							</span>
						}
						aria-describedby={`${id}-temperature-help`}
						type="number"
						step="0.1"
						min="0"
						max="1"
						disabled={isSubmitting}
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
									isSubmitting ||
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
											(resource) =>
												resource.id !== resourceId,
										),
										{ shouldDirty: true },
									)
								}
							>
								<CapabilityPicker
									kind={kind}
									values={current}
									lockedValues={inherited}
									disabled={isSubmitting}
									onChange={(values) =>
										form.setValue(
											"mcp",
											[...other, ...values],
											{ shouldDirty: true },
										)
									}
								/>
							</CapabilitySection>
						);
					})}
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
							: "Settings up to date"}
					</Small>
					<Button
						type="button"
						variant="outline"
						disabled={isSubmitting}
						onClick={() =>
							form.reset(formValues(snapshot.settings))
						}
					>
						Reset
					</Button>
					<Button
						type="submit"
						disabled={
							isLocked ||
							isSubmitting ||
							agent.isLoading ||
							Boolean(agent.error)
						}
					>
						{isSubmitting && <Spinner />}
						{isSubmitting ? "Saving…" : "Save changes"}
					</Button>
				</div>
			</Form>
		</div>
	);
}
export const WORK_SETTINGS_PANEL: WorkbenchPanelConfig = {
	name: "Settings",
	icon: ({ className }) =>
		createElement(Settings2, { className, "aria-hidden": true }),
	canRename: false,
	mount: "keepAlive",
	content: WorkSettingsPanel,
};
