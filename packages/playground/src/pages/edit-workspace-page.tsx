import {
	BlocksIcon,
	BookOpenIcon,
	HammerIcon,
	Maximize2Icon,
	SparklesIcon,
	UsersRound,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useId, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "@semoss/i18n";
import { usePixel } from "@semoss/sdk/react";
import {
	MCPSelector,
	MembersTable,
	PromptSelector,
	SkillSelector,
} from "@semoss/shared";
import {
	Button,
	Field,
	FieldLabel,
	Input,
	Spinner,
	Textarea,
	toast,
} from "@semoss/ui/next";
import { InstructionsModal } from "@/components";
import { useChat, useGlobalBreadcrumbs, useRoot } from "@/hooks";
import type { MCPConfig, SkillConfig, Workspace } from "@/types";
import {
	mcpToPlatformUrl,
	promptToPlatformUrl,
	splitMcpByType,
} from "@/utility/mcp-utils";

const FORM_ID = "workspace-edit-form";

/**
 * Renders the EditWorkspacePage for editing existing agents.
 *
 * Mirrors the detail page layout (About → Knowledge → Toolboxes →
 * Prompts → Members) with editable controls and an editable
 * MembersTable in place of the read-only view.
 */
export const EditWorkspacePage = observer(() => {
	const { t } = useTranslation(["workspace", "common", "notifications"]);
	const { workspaceId } = useParams<{ workspaceId: string }>();
	const navigate = useNavigate();
	const { chat } = useChat();
	const { root } = useRoot();

	const nameId = useId();
	const descriptionId = useId();
	const instructionId = useId();

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [instructions, setInstructions] = useState("");
	const [knowledge, setKnowledge] = useState<MCPConfig[]>([]);
	const [toolbox, setToolbox] = useState<MCPConfig[]>([]);
	const [skills, setSkills] = useState<SkillConfig[]>([]);
	const [prompts, setPrompts] = useState<string[]>([]);
	const [isSaving, setIsSaving] = useState(false);
	const [instructionsModal, setInstructionsModal] = useState(false);

	const getWorkspace = usePixel<Workspace>(
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

	useGlobalBreadcrumbs({
		breadcrumbs: [
			{ name: t("workspace:breadcrumbs.home"), path: "/" },
			{ name: t("workspace:breadcrumbs.agent"), path: "/agent" },
			{
				name:
					getWorkspace.status === "SUCCESS"
						? getWorkspace.data.name
						: t("workspace:breadcrumbs.loading"),
				path: `/agent/${workspaceId}`,
			},
			{
				name: t("workspace:breadcrumbs.edit"),
				path: `/agent/${workspaceId}/edit`,
			},
		],
	});

	// Hydrate from workspace data
	useEffect(() => {
		if (getWorkspace.status !== "SUCCESS" || !getWorkspace.data) return;
		const w = getWorkspace.data;
		setName(w.name || "");
		setDescription(w.description || "");
		setInstructions((w.system_prompt || "").replace(/\\n/g, "\n"));
		setPrompts(w.prompts ?? []);
		const { knowledge: nextKnowledge, toolbox: nextToolbox } =
			splitMcpByType(w.mcp ?? []);
		setKnowledge(nextKnowledge);
		setToolbox(nextToolbox);
		setSkills(w.skills ?? []);
	}, [getWorkspace.status, getWorkspace.data]);

	// Track whether form differs from the loaded workspace
	const isDirty = useMemo(() => {
		if (!getWorkspace.data) return false;
		const w = getWorkspace.data;
		const initialInstructions = (w.system_prompt || "").replace(
			/\\n/g,
			"\n",
		);
		const { knowledge: initKnowledge, toolbox: initToolbox } =
			splitMcpByType(w.mcp ?? []);
		const idsKey = (arr: { id: string }[]) =>
			arr
				.map((a) => a.id)
				.sort()
				.join("|");
		const stringIdsKey = (arr: string[]) => [...arr].sort().join("|");
		return (
			name !== (w.name || "") ||
			description !== (w.description || "") ||
			instructions !== initialInstructions ||
			stringIdsKey(prompts) !== stringIdsKey(w.prompts ?? []) ||
			idsKey(knowledge) !== idsKey(initKnowledge) ||
			idsKey(toolbox) !== idsKey(initToolbox) ||
			idsKey(skills) !== idsKey(w.skills ?? [])
		);
	}, [
		name,
		description,
		instructions,
		prompts,
		knowledge,
		toolbox,
		skills,
		getWorkspace.data,
	]);

	if (getWorkspace.status === "LOADING") {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	if (getWorkspace.status === "ERROR" || !workspaceId) {
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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (isSaving) return;

		setIsSaving(true);
		try {
			await chat.editWorkspace(workspaceId, {
				name,
				description,
				system_prompt: instructions,
				prompts,
				mcp: [...knowledge, ...toolbox],
				skills,
			});
			navigate(`/agent/${workspaceId}`);
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: t("notifications:workspace.saveError"),
			);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="@container h-full w-full overflow-y-auto">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 @3xl:px-12 @md:px-6 px-4 pt-8 pb-4">
				{/* Sticky header so Save/Cancel stay reachable while scrolling */}
				<div className="-mx-4 -mt-8 @md:-mx-6 @3xl:-mx-12 sticky top-0 z-20 flex flex-row items-center gap-3 border-border border-b bg-background/95 @3xl:px-12 @md:px-6 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
					<div className="min-w-0 flex-1">
						<div className="truncate font-semibold text-2xl text-foreground leading-tight">
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
				<form
					id={FORM_ID}
					onSubmit={handleSubmit}
					className="flex flex-col gap-8"
				>
					{/* About */}
					<section className="flex flex-col gap-4">
						<h2 className="font-semibold text-foreground text-lg">
							{t("workspace:detail.about.title")}
						</h2>
						<Field>
							<FieldLabel htmlFor={nameId}>
								{t("workspace:form.nameLabel")}
							</FieldLabel>
							<Input
								id={nameId}
								placeholder={t("common:placeholders.enterName")}
								value={name}
								disabled={isSaving}
								onChange={(e) => setName(e.target.value)}
								data-testid="workspace-edit-page--name"
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor={descriptionId}>
								{t("workspace:form.descriptionLabel")}
							</FieldLabel>
							<Input
								id={descriptionId}
								placeholder={t(
									"common:placeholders.enterDescription",
								)}
								value={description}
								disabled={isSaving}
								onChange={(e) => setDescription(e.target.value)}
								data-testid="workspace-edit-page--description"
							/>
						</Field>
						<Field>
							<div className="flex items-center justify-between">
								<FieldLabel htmlFor={instructionId}>
									{t("workspace:form.instructionsLabel")}
								</FieldLabel>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => setInstructionsModal(true)}
									disabled={isSaving}
									data-testid="workspace-edit-page--expand-instructions-btn"
								>
									<Maximize2Icon />
									{t("workspace:instructions.expand")}
								</Button>
							</div>
							<Textarea
								id={instructionId}
								placeholder={t(
									"common:placeholders.enterInstructions",
								)}
								value={instructions}
								disabled={isSaving}
								onChange={(e) =>
									setInstructions(e.target.value)
								}
								rows={6}
								className="max-h-96 overflow-y-auto"
								data-testid="workspace-edit-page--instructions"
							/>
							<div className="text-muted-foreground text-xs">
								{t("workspace:instructions.charCount", {
									count: instructions.length.toLocaleString(),
								})}
							</div>
						</Field>
					</section>

					{/* Knowledge */}
					<section className="flex flex-col gap-3">
						<h2 className="flex items-center gap-2 font-semibold text-foreground text-lg">
							<BookOpenIcon className="size-5" />
							{t("workspace:detail.tabs.knowledge")}
						</h2>
						<MCPSelector
							type="KNOWLEDGE"
							values={knowledge}
							disabled={isSaving}
							onChange={(next) => setKnowledge(next)}
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
					<section className="flex flex-col gap-3">
						<h2 className="flex items-center gap-2 font-semibold text-foreground text-lg">
							<HammerIcon className="size-5" />
							{t("workspace:detail.tabs.toolbox")}
						</h2>
						<MCPSelector
							type="TOOLBOX"
							values={toolbox}
							disabled={isSaving}
							onChange={(next) => setToolbox(next)}
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

					{/* Skills */}
					<section className="flex flex-col gap-3">
						<h2 className="flex items-center gap-2 font-semibold text-foreground text-lg">
							<BlocksIcon className="size-5" />
							{t("workspace:detail.tabs.skills", {
								defaultValue: "Skills",
							})}
						</h2>
						<SkillSelector
							values={skills}
							disabled={isSaving}
							onChange={(next) => setSkills(next)}
							className="h-112"
						/>
					</section>

					{/* Prompts */}
					<section className="flex flex-col gap-3">
						<h2 className="flex items-center gap-2 font-semibold text-foreground text-lg">
							<SparklesIcon className="size-5" />
							{t("workspace:detail.tabs.prompts")}
						</h2>
						<PromptSelector
							values={prompts}
							disabled={isSaving}
							onChange={(next) => setPrompts(next)}
							className="h-112"
							getPlatformUrl={
								root.theme.featureFlags?.showPlatformLinks
									? promptToPlatformUrl
									: undefined
							}
						/>
					</section>
				</form>

				{/* Members (outside the form — saved per-action) */}
				<section className="flex flex-col gap-3">
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
				onChange={setInstructions}
				disabled={isSaving}
			/>
		</div>
	);
});
