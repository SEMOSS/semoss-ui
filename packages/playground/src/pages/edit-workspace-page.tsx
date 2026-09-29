import {
	BlocksIcon,
	BookOpenIcon,
	HammerIcon,
	Maximize2Icon,
	SparklesIcon,
	UsersRound,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "@semoss/i18n";
import { usePixel } from "@semoss/sdk/react";
import {
	AGENT_FORM_DEFAULT_VALUES,
	type AgentWorkspace,
	MCPSelector,
	MembersTable,
	PromptSelector,
	SkillSelector,
	toAgentFormValues,
} from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	Button,
	Form,
	FormInput,
	FormTextarea,
	Spinner,
	toast,
	useForm,
	zodResolver,
} from "@semoss/ui/next";
import { InstructionsModal } from "@/components/workspace/instructions-modal";
import {
	createEditWorkspaceFormSchema,
	type EditWorkspaceFormValues,
} from "@/features/agents/edit-workspace-form.schema";
import { WorkspaceAgentFields } from "@/features/agents/workspace-agent-fields";
import { useChat } from "@/hooks/use-chat";
import { useRoot } from "@/hooks/use-root";
import { mcpToPlatformUrl, promptToPlatformUrl } from "@/utility/mcp-utils";

const FORM_ID = "workspace-edit-form";

/**
 * Renders the EditWorkspacePage for editing existing agents.
 *
 * Keeps the Playground layout and validation, composing the shared agent
 * settings into the same form. Members are saved separately per action.
 */
export const EditWorkspacePage = observer(() => {
	const { t } = useTranslation(["workspace", "common", "notifications"]);
	const { workspaceId } = useParams<{ workspaceId: string }>();
	const navigate = useNavigate();
	const { chat } = useChat();
	const { root } = useRoot();

	const form = useForm<EditWorkspaceFormValues>({
		resolver: zodResolver(
			createEditWorkspaceFormSchema(t("common:placeholders.enterName")),
		),
		defaultValues: AGENT_FORM_DEFAULT_VALUES,
	});
	const { name, instructions, knowledge, toolboxes, skills, prompts } =
		form.watch();
	const isSaving = form.formState.isSubmitting;
	const hydratedWorkspace = useRef<string | null>(null);
	const isDirty = form.formState.isDirty;
	const [instructionsModal, setInstructionsModal] = useState(false);

	const getWorkspace = usePixel<AgentWorkspace & { workspace_id: string }>(
		workspaceId ? `GetWorkspace(workspaceId=["${workspaceId}"]);` : "",
		{
			data: null,
			onError: (_d, e) => {
				toast.error(
					t("workspace:edit.failedToLoad", {
						error: e instanceof Error ? e.message : "Unknown error",
					}),
				);
			},
		},
	);

	// Refetches must not overwrite unsaved changes. A different agent gets fresh defaults.
	useEffect(() => {
		if (
			getWorkspace.status !== "SUCCESS" ||
			!getWorkspace.data ||
			getWorkspace.data.workspace_id !== workspaceId ||
			hydratedWorkspace.current === workspaceId
		)
			return;
		const w = getWorkspace.data;
		form.reset({
			...toAgentFormValues(w),
			instructions: (w.system_prompt || "").replace(/\\n/g, "\n"),
		});
		hydratedWorkspace.current = workspaceId;
	}, [form, workspaceId, getWorkspace.status, getWorkspace.data]);

	if (
		getWorkspace.status === "INITIAL" ||
		getWorkspace.status === "LOADING"
	) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	if (
		getWorkspace.status === "ERROR" ||
		!workspaceId ||
		!getWorkspace.data ||
		getWorkspace.data.workspace_id !== workspaceId
	) {
		return (
			<div className="@container relative h-full w-full overflow-hidden">
				<div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-8 @3xl:px-12 @md:px-6 px-4 pt-8 pb-4">
					<h1 className="font-semibold text-2xl">
						{t("workspace:edit.errorTitle")}
					</h1>
					<p className="text-base text-muted-foreground">
						{t("workspace:edit.errorDescription")}
					</p>
				</div>
			</div>
		);
	}

	const handleCancel = () => {
		navigate(`/agent/${workspaceId}`);
	};

	const handleSubmit = async (values: EditWorkspaceFormValues) => {
		form.clearErrors("root.server");
		try {
			const warning = await chat.editWorkspace(workspaceId, values);
			if (warning) toast.warning(warning);
		} catch (err) {
			form.setError("root.server", {
				message:
					err instanceof Error
						? err.message
						: t("notifications:workspace.saveError"),
			});
			return;
		}
		navigate(`/agent/${workspaceId}`);
	};

	return (
		<div className="@container h-full w-full overflow-y-auto">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
				{/* Sticky header so Save/Cancel stay reachable while scrolling */}
				<div className="-mx-4 -mt-6 sm:-mx-6 sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b bg-background px-4 py-4 sm:px-6">
					<div className="min-w-0 flex-1">
						<div className="font-semibold text-2xl text-foreground leading-tight">
							{t("workspace:edit.title")}
						</div>
						<div className="text-muted-foreground text-sm">
							{t("workspace:edit.subtitle")}
						</div>
					</div>
					<div className="flex shrink-0 items-center gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={handleCancel}
							disabled={isSaving}
							data-testid="workspace-edit-page--cancel-btn"
						>
							{t("common:buttons.cancel")}
						</Button>
						<Button
							type="submit"
							form={FORM_ID}
							disabled={isSaving || !name.trim() || !isDirty}
							data-testid="workspace-edit-page--save-btn"
						>
							{t("workspace:actions.save")}
						</Button>
					</div>
				</div>

				{/* Members section is OUTSIDE the form because member changes
				    are saved per-action by MembersTable, not as part of the
				    workspace save payload. */}
				<Form
					form={form}
					id={FORM_ID}
					onSubmit={handleSubmit}
					noValidate
					aria-busy={isSaving}
					className="flex flex-col gap-8"
				>
					{form.formState.errors.root?.server?.message && (
						<Alert variant="destructive">
							<AlertDescription>
								{form.formState.errors.root.server.message}
							</AlertDescription>
						</Alert>
					)}
					{/* About */}
					<section className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:p-6">
						<h2 className="font-semibold text-foreground text-lg">
							{t("workspace:detail.about.title")}
						</h2>
						<FormInput
							name="name"
							label={t("workspace:form.nameLabel")}
							placeholder={t("common:placeholders.enterName")}
							disabled={isSaving}
							required
							data-testid="workspace-edit-page--name"
						/>
						<FormInput
							name="description"
							label={t("workspace:form.descriptionLabel")}
							placeholder={t(
								"common:placeholders.enterDescription",
							)}
							disabled={isSaving}
							data-testid="workspace-edit-page--description"
						/>
						<div className="flex flex-col gap-2">
							<FormTextarea
								name="instructions"
								label={t("workspace:form.instructionsLabel")}
								placeholder={t(
									"common:placeholders.enterInstructions",
								)}
								rows={6}
								disabled={isSaving}
								description={t(
									"workspace:instructions.charCount",
									{ count: instructions.length },
								)}
								data-testid="workspace-edit-page--instructions"
							/>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="self-end"
								onClick={() => setInstructionsModal(true)}
								disabled={isSaving}
								data-testid="workspace-edit-page--expand-instructions-btn"
							>
								<Maximize2Icon />
								{t("workspace:instructions.expand")}
							</Button>
						</div>
					</section>

					{/* Knowledge */}
					<section className="flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4 sm:p-6">
						<h2 className="flex items-center gap-2 font-semibold text-foreground text-lg">
							<BookOpenIcon className="size-5" />
							{t("workspace:detail.tabs.knowledge")}
						</h2>
						<MCPSelector
							presentation="list"
							type="KNOWLEDGE"
							values={knowledge}
							disabled={isSaving}
							onChange={(next) =>
								form.setValue("knowledge", next, {
									shouldDirty: true,
								})
							}
							className="h-112"
							workspaceId={workspaceId}
							enableKnowledgeMCP={
								root.theme.featureFlags?.enableKnowledgeMCP
							}
							getPlatformUrl={
								root.theme.featureFlags?.showPlatformLinks
									? mcpToPlatformUrl
									: undefined
							}
						/>
					</section>

					{/* Toolboxes */}
					<section className="flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4 sm:p-6">
						<h2 className="flex items-center gap-2 font-semibold text-foreground text-lg">
							<HammerIcon className="size-5" />
							{t("workspace:detail.tabs.toolbox")}
						</h2>
						<MCPSelector
							presentation="list"
							type="TOOLBOX"
							values={toolboxes}
							disabled={isSaving}
							onChange={(next) =>
								form.setValue("toolboxes", next, {
									shouldDirty: true,
								})
							}
							className="h-112"
							workspaceId={workspaceId}
							enableKnowledgeMCP={
								root.theme.featureFlags?.enableKnowledgeMCP
							}
							showSystemTools={
								root.theme.featureFlags?.showSystemTools
							}
							getPlatformUrl={
								root.theme.featureFlags?.showPlatformLinks
									? mcpToPlatformUrl
									: undefined
							}
						/>
					</section>

					{/* Skills */}
					<section className="flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4 sm:p-6">
						<h2 className="flex items-center gap-2 font-semibold text-foreground text-lg">
							<BlocksIcon className="size-5" />
							{t("workspace:detail.tabs.skills")}
						</h2>
						<SkillSelector
							values={skills}
							disabled={isSaving}
							onChange={(next) =>
								form.setValue("skills", next, {
									shouldDirty: true,
								})
							}
							className="h-112"
							showSystemSkills={
								root.theme.featureFlags?.showSystemSkills
							}
						/>
					</section>

					{/* Prompts */}
					<section className="flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4 sm:p-6">
						<h2 className="flex items-center gap-2 font-semibold text-foreground text-lg">
							<SparklesIcon className="size-5" />
							{t("workspace:detail.tabs.prompts")}
						</h2>
						<PromptSelector
							values={prompts}
							disabled={isSaving}
							onChange={(next) =>
								form.setValue("prompts", next, {
									shouldDirty: true,
								})
							}
							className="h-112"
							getPlatformUrl={
								root.theme.featureFlags?.showPlatformLinks
									? promptToPlatformUrl
									: undefined
							}
						/>
					</section>
					<WorkspaceAgentFields
						control={form.control}
						workspace={getWorkspace.data}
						workspaceId={workspaceId}
						disabled={isSaving}
					/>
				</Form>

				{/* Members (outside the form — saved per-action) */}
				<section className="flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4 sm:p-6">
					<h2 className="flex items-center gap-2 font-semibold text-foreground text-lg">
						<UsersRound className="size-5" />
						{t("workspace:detail.tabs.members")}
					</h2>
					<p className="text-muted-foreground text-xs">
						{t("workspace:members.autoSaveHint")}
					</p>
					<div className="min-h-32">
						<MembersTable id={workspaceId} type="WORKSPACE" />
					</div>
				</section>
			</div>

			{/* Instructions modal (editable, live-bound to local state) */}
			<InstructionsModal
				open={instructionsModal}
				onOpenChange={setInstructionsModal}
				value={instructions}
				onChange={(value) =>
					form.setValue("instructions", value, { shouldDirty: true })
				}
				disabled={isSaving}
			/>
		</div>
	);
});
