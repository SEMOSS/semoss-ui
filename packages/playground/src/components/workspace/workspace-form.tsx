import {
	Bookmark,
	BookOpenIcon,
	FileTextIcon,
	HammerIcon,
	PlusIcon,
	SearchIcon,
	UsersRound,
	X,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { Env, post, useInsight } from "@semoss/sdk/react";
import {
	Badge,
	Button,
	Field,
	FieldGroup,
	FieldLabel,
	Input,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Spinner,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
	toast,
	useDebouncedValue,
} from "@semoss/ui/next";
import { MCPSelector } from "@/components";
import { PaginationButtons } from "@/components/common/pagination-buttons";
import { KnowledgeSelector } from "@/components/workspace/knowledge-selector";
import { WorkspaceMembersList } from "@/components/workspace/members/workspace-members-list";
import { useChat, usePagination } from "@/hooks";
import type { MCPConfig, Workspace } from "@/types";
import { formatDateTime } from "@/utility";

interface WorkspaceFormProps {
	/**
	 * is it creating a new workspace or editing an existing one
	 */
	isNew: boolean;

	/** Workspace data for editing (optional) */
	values?: Partial<Workspace>;

	/** Callback that is fired when the form is closed or submitted. If it is successful, it will return an id */
	onClose: (workspaceId?: string) => void;
}

export const WorkspaceForm: React.FC<WorkspaceFormProps> = ({
	isNew,
	values,
	onClose,
}) => {
	const { t } = useTranslation(["workspace", "common", "notifications"]);
	const { actions } = useInsight();

	/**
	 * IDs
	 */
	const nameId = useId();
	const descriptionId = useId();
	const instructionId = useId();
	const tagInputId = useId();

	/**
	 * State
	 */
	const [name, setName] = useState<string>("");
	const [description, setDescription] = useState<string>("");
	const [instructions, setInstructions] = useState<string>("");
	const [toolbox, setToolbox] = useState<MCPConfig[]>([]);
	const [knowledge, setKnowledge] = useState<MCPConfig[]>([]);
	const [tags, setTags] = useState<string[]>([]);
	const [tagInput, setTagInput] = useState<string>("");
	const [isFavorite, setIsFavorite] = useState<boolean>(false);
	const [isTogglingFavorite, setIsTogglingFavorite] =
		useState<boolean>(false);

	const [isLoading, setIsLoading] = useState<boolean>(false);

	// Tab state
	const [tab, setTab] = useState<string>("knowledge");

	// Membership tab state (edit mode only)
	const [isSharingModalOpen, setIsSharingModalOpen] = useState(false);
	const [memberSearch, setMemberSearch] = useState("");
	const debouncedMemberSearch = useDebouncedValue(memberSearch);
	const pagination = usePagination();

	/**
	 * Library Hooks
	 */
	const { chat } = useChat();

	// Initialize form data from workspace prop
	useEffect(() => {
		setName(values?.name || "");
		setDescription(values?.description || "");
		setInstructions(values?.system_prompt || "");
		setKnowledge(values?.mcp?.filter((mcp) => mcp.type === "VECTOR") || []);
		setToolbox(values?.mcp?.filter((mcp) => mcp.type !== "VECTOR") || []);
		setTags(values?.tag || []);
	}, [values]);

	const addTag = () => {
		const trimmed = tagInput.trim();
		if (trimmed && !tags.includes(trimmed)) {
			setTags((prev) => [...prev, trimmed]);
		}
		setTagInput("");
	};

	const removeTag = (tag: string) => {
		setTags((prev) => prev.filter((t) => t !== tag));
	};

	const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			addTag();
		}
	};

	const toggleFavorite = async () => {
		if (isNew || !values?.workspace_id) return;
		const next = !isFavorite;
		setIsTogglingFavorite(true);
		try {
			await post<{ success: boolean }>(
				`${Env.MODULE}/api/auth/project/setProjectFavorite`,
				{ projectId: values.workspace_id, isFavorite: next },
				{},
			);
			setIsFavorite(next);
		} catch {
			toast.error("Failed to update favorite status.");
		} finally {
			setIsTogglingFavorite(false);
		}
	};

	/**
	 * Method that is called to create or update the workspace
	 */
	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			setIsLoading(true);

			const updated: Omit<Workspace, "workspace_id" | "date_created"> = {
				name: name,
				system_prompt: instructions,
				description: description,
				mcp: [...toolbox, ...knowledge],
			};

			let output = "";
			if (isNew) {
				output = await chat.addWorkspace(updated);
			} else {
				output = await chat.editWorkspace(values.workspace_id, updated);
			}

			// Save tags via SetProjectMetadata
			const projectId = isNew ? output : values.workspace_id;
			if (projectId && tags.length > 0) {
				try {
					await actions.run(
						`SetProjectMetadata(project=["${projectId}"], meta=[{"tag":${JSON.stringify(tags)}}], jsonCleanup=[true]);`,
					);
				} catch {
					// non-fatal: workspace saved, tags may not have saved
					toast.error(
						"Agent saved but tags could not be updated. Try editing again.",
					);
				}
			}

			onClose(output);
		} catch (e) {
			console.error(e);
			toast.error(
				e instanceof Error
					? e.message
					: t("notifications:workspace.saveError"),
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<TooltipProvider>
			<form onSubmit={onSubmit} className="flex w-full flex-col gap-6">
				{/* Basic info: Name, Description, Tags, Favorite — always above tabs */}
				<FieldGroup>
					<div className="flex items-start gap-3">
						<div className="flex-1">
							<Field>
								<FieldLabel htmlFor={nameId}>
									{t("workspace:form.nameLabel")}
								</FieldLabel>
								<Input
									id={nameId}
									placeholder={t(
										"common:placeholders.enterName",
									)}
									value={name}
									disabled={isLoading}
									onChange={(e) => setName(e.target.value)}
									data-testid="workspaceForm-textField-name"
								/>
							</Field>
						</div>
						{/* Favorite toggle — only shown when editing */}
						{!isNew && values?.workspace_id && (
							<div className="mt-6 flex items-center gap-2">
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											type="button"
											variant="outline"
											size="icon"
											onClick={toggleFavorite}
											disabled={
												isLoading || isTogglingFavorite
											}
										>
											{isTogglingFavorite ? (
												<Spinner className="size-4" />
											) : (
												<Bookmark
													className={`h-5 w-5 ${isFavorite ? "fill-current text-primary" : "text-muted-foreground"}`}
												/>
											)}
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										{isFavorite
											? "Remove from favorites"
											: "Add to favorites"}
									</TooltipContent>
								</Tooltip>
								{values?.date_created && (
									<span className="whitespace-nowrap text-muted-foreground text-xs">
										Created{" "}
										{formatDateTime(values.date_created)}
									</span>
								)}
							</div>
						)}
					</div>

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
							disabled={isLoading}
							onChange={(e) => setDescription(e.target.value)}
							data-testid="workspaceForm-description-txt"
						/>
					</Field>

					{/* Tags */}
					<Field>
						<FieldLabel htmlFor={tagInputId}>Tags</FieldLabel>
						<div className="flex flex-col gap-2">
							<div className="flex gap-2">
								<Input
									id={tagInputId}
									placeholder="Type a tag and press Enter"
									value={tagInput}
									disabled={isLoading}
									onChange={(e) =>
										setTagInput(e.target.value)
									}
									onKeyDown={handleTagKeyDown}
									onBlur={addTag}
								/>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={addTag}
									disabled={isLoading || !tagInput.trim()}
								>
									Add
								</Button>
							</div>
							{tags.length > 0 && (
								<div className="flex flex-wrap gap-1">
									{tags.map((tag) => (
										<Badge
											key={tag}
											variant="secondary"
											className="gap-1 text-sm"
										>
											{tag}
											<button
												type="button"
												onClick={() => removeTag(tag)}
												className="ml-1 rounded-full hover:text-destructive"
												aria-label={`Remove tag ${tag}`}
											>
												<X className="h-3 w-3" />
											</button>
										</Badge>
									))}
								</div>
							)}
						</div>
					</Field>
				</FieldGroup>

				{/* Tabs: Knowledge, Toolbox, Prompt, Membership */}
				<Tabs
					value={tab}
					onValueChange={setTab}
					className="flex flex-col gap-4"
				>
					<div className="flex items-center justify-between gap-4">
						<TabsList>
							<TabsTrigger value="knowledge">
								<BookOpenIcon />
								{t("workspace:form.knowledgeLabel")}
							</TabsTrigger>
							<TabsTrigger value="toolbox">
								<HammerIcon />
								{t("workspace:form.toolboxLabel")}
							</TabsTrigger>
							<TabsTrigger value="prompt">
								<FileTextIcon />
								Instructions
							</TabsTrigger>
							{!isNew && (
								<TabsTrigger value="membership">
									<UsersRound />
									Membership
								</TabsTrigger>
							)}
						</TabsList>
						{tab === "membership" && !isNew && (
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setIsSharingModalOpen(true)}
							>
								<PlusIcon />
								{t("workspace:sharing.title")}
							</Button>
						)}
					</div>

					{/* Bordered card wrapping all tab content */}
					<div className="overflow-hidden rounded-xl border border-border bg-card">
						{/* Search bar — membership tab only */}
						{tab === "membership" && !isNew && (
							<div className="border-border border-b bg-primary-foreground p-4">
								<InputGroup className="bg-background">
									<InputGroupInput
										placeholder={t("common:buttons.search")}
										value={memberSearch}
										onChange={(e) =>
											setMemberSearch(e.target.value)
										}
									/>
									<InputGroupAddon>
										<SearchIcon />
									</InputGroupAddon>
								</InputGroup>
							</div>
						)}

						<TabsContent value="knowledge" className="p-4">
							<KnowledgeSelector
								values={knowledge}
								disabled={isLoading}
								onChange={(vals) => setKnowledge(vals)}
							/>
						</TabsContent>

						<TabsContent value="toolbox" className="p-4">
							<MCPSelector
								type="TOOLBOX"
								values={toolbox}
								disabled={isLoading}
								onChange={(mcps) => setToolbox(mcps)}
							/>
						</TabsContent>

						<TabsContent value="prompt" className="p-4">
							<div className="flex flex-col gap-2">
								<label
									htmlFor={instructionId}
									className="text-muted-foreground text-xs"
								>
									Defines the agent&apos;s behavior and
									persona
								</label>
								<Textarea
									id={instructionId}
									placeholder={t(
										"common:placeholders.enterInstructions",
									)}
									value={instructions.replace(/\\n/g, "\n")}
									onChange={(e) =>
										setInstructions(e.target.value)
									}
									rows={10}
									className="resize-y"
									data-testid="workspaceForm-system_prompt-txt"
								/>
							</div>
						</TabsContent>

						{!isNew && values?.workspace_id && (
							<TabsContent
								value="membership"
								className="w-full overflow-hidden"
							>
								<WorkspaceMembersList
									workspaceId={values.workspace_id}
									search={debouncedMemberSearch}
									paginationControl={pagination}
									isSharingModalOpen={isSharingModalOpen}
									onSharingModalClose={() =>
										setIsSharingModalOpen(false)
									}
								/>
							</TabsContent>
						)}
					</div>

					{/* Pagination — membership tab only */}
					{tab === "membership" && !isNew && (
						<div className="flex w-full flex-row items-center justify-end gap-2 border-border border-t bg-primary-foreground px-4 py-3">
							<PaginationButtons {...pagination} />
						</div>
					)}
				</Tabs>

				<div className="flex items-center justify-between">
					<Button
						type="button"
						variant="ghost"
						onClick={() => onClose()}
					>
						{t("common:buttons.back")}
					</Button>
					<Button
						disabled={isLoading || !name}
						data-testid="workspaceForm-submit-btn"
						type="submit"
					>
						{isNew
							? t("workspace:actions.create")
							: t("workspace:actions.save")}
					</Button>
				</div>
			</form>
		</TooltipProvider>
	);
};
