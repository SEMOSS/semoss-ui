import {
	BlocksIcon,
	BookOpenIcon,
	HammerIcon,
	Maximize2Icon,
	SparklesIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "@semoss/i18n";
import { MCPSelector, PromptSelector, SkillSelector } from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	Button,
	Form,
	FormInput,
	FormTextarea,
	useForm,
	zodResolver,
} from "@semoss/ui/next";
import { InstructionsModal } from "@/components/workspace/instructions-modal";
import {
	createWorkspaceFormSchema,
	emptyWorkspaceForm,
	type WorkspaceFormValues,
} from "@/features/agents/workspace-form.schema";
import { useChat } from "@/hooks/use-chat";
import { useRoot } from "@/hooks/use-root";
import { mcpToPlatformUrl, promptToPlatformUrl } from "@/utility/mcp-utils";

const FORM_ID = "workspace-new-form";

/**
 * Renders the NewWorkspacePage for creating new agents.
 *
 * Mirrors the EditWorkspacePage layout (sectioned About → Knowledge →
 * Toolboxes → Prompts with a sticky Cancel/Create header). Skips the
 * Members section because the agent doesn't exist yet.
 */
export const NewWorkspacePage = observer(() => {
	const { t } = useTranslation(["workspace", "common", "notifications"]);
	const navigate = useNavigate();
	const { chat } = useChat();
	const { root } = useRoot();

	const form = useForm<WorkspaceFormValues>({
		resolver: zodResolver(
			createWorkspaceFormSchema(t("common:placeholders.enterName")),
		),
		defaultValues: emptyWorkspaceForm,
	});
	const { name, instructions, knowledge, toolbox, skills, prompts } =
		form.watch();
	const isSaving = form.formState.isSubmitting;
	const [instructionsModal, setInstructionsModal] = useState(false);

	const handleCancel = () => {
		navigate("/agent");
	};

	const handleSubmit = async ({
		name,
		description,
		instructions,
		knowledge,
		toolbox,
		skills,
		prompts,
	}: WorkspaceFormValues) => {
		form.clearErrors("root.server");
		let newWorkspaceId: string;
		try {
			newWorkspaceId = await chat.addWorkspace({
				name,
				description,
				system_prompt: instructions,
				prompts,
				mcp: [...knowledge, ...toolbox],
				skills,
			});
		} catch (err) {
			form.setError("root.server", {
				message:
					err instanceof Error
						? err.message
						: t("notifications:workspace.saveError"),
			});
			return;
		}
		navigate(`/agent/${newWorkspaceId}`);
	};

	return (
		<div className="@container h-full w-full overflow-y-auto">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
				{/* Sticky header so Cancel/Create stay reachable while scrolling */}
				<div className="-mx-4 -mt-6 sm:-mx-6 sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b bg-background px-4 py-4 sm:px-6">
					<div className="min-w-0 flex-1">
						<div className="font-semibold text-2xl text-foreground leading-tight">
							{t("workspace:new.title")}
						</div>
						<div className="text-muted-foreground text-sm">
							{t("workspace:new.subtitle")}
						</div>
					</div>
					<div className="flex shrink-0 items-center gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={handleCancel}
							disabled={isSaving}
							data-testid="workspace-new-page--cancel-btn"
						>
							{t("common:buttons.cancel")}
						</Button>
						<Button
							type="submit"
							form={FORM_ID}
							disabled={isSaving || !name.trim()}
							data-testid="workspace-new-page--create-btn"
						>
							{t("workspace:actions.create")}
						</Button>
					</div>
				</div>

				{/* Body — flows naturally; outer container scrolls */}
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
							data-testid="workspace-new-page--name"
						/>
						<FormInput
							name="description"
							label={t("workspace:form.descriptionLabel")}
							placeholder={t(
								"common:placeholders.enterDescription",
							)}
							disabled={isSaving}
							data-testid="workspace-new-page--description"
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
								data-testid="workspace-new-page--instructions"
							/>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="self-end"
								onClick={() => setInstructionsModal(true)}
								disabled={isSaving}
								data-testid="workspace-new-page--expand-instructions-btn"
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
							values={toolbox}
							disabled={isSaving}
							onChange={(next) =>
								form.setValue("toolbox", next, {
									shouldDirty: true,
								})
							}
							className="h-112"
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
				</Form>
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
