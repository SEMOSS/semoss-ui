import {
	BlocksIcon,
	BookOpenIcon,
	HammerIcon,
	Maximize2Icon,
	SparklesIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@semoss/i18n";
import {
	MCPSelector,
	PromptSelector,
	type SkillConfig,
	SkillSelector,
} from "@semoss/shared";
import {
	Button,
	Field,
	FieldLabel,
	Input,
	Textarea,
	toast,
} from "@semoss/ui/next";
import { InstructionsModal } from "@/components";
import { useChat, useGlobalBreadcrumbs, useRoot } from "@/hooks";
import type { MCPConfig } from "@/types";
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

	useGlobalBreadcrumbs({
		breadcrumbs: [
			{ name: t("workspace:breadcrumbs.home"), path: "/" },
			{ name: t("workspace:breadcrumbs.agent"), path: "/agent" },
			{
				name: t("workspace:breadcrumbs.new"),
				path: "/agent/new",
			},
		],
	});

	const handleCancel = () => {
		navigate("/agent");
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (isSaving || !name.trim()) return;

		setIsSaving(true);
		try {
			const newWorkspaceId = await chat.addWorkspace({
				name,
				description,
				system_prompt: instructions,
				prompts,
				mcp: [...knowledge, ...toolbox],
				skills,
			});
			navigate(`/agent/${newWorkspaceId}`);
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
				{/* Sticky header so Cancel/Create stay reachable while scrolling */}
				<div className="-mx-4 -mt-8 @md:-mx-6 @3xl:-mx-12 sticky top-0 z-20 flex flex-row items-center gap-3 border-border border-b bg-background/95 @3xl:px-12 @md:px-6 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
					<div className="min-w-0 flex-1">
						<div className="truncate font-semibold text-2xl text-foreground leading-tight">
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
								data-testid="workspace-new-page--name"
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
								data-testid="workspace-new-page--description"
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
									data-testid="workspace-new-page--expand-instructions-btn"
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
								data-testid="workspace-new-page--instructions"
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
