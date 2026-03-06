import {
	BookOpenIcon,
	FileTextIcon,
	HammerIcon,
	MessagesSquareIcon,
	Pencil,
	PlusIcon,
	SearchIcon,
	Trash2,
	UsersRound,
	X,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "@semoss/i18n";
import { useInsight, usePixel } from "@semoss/sdk/react";
import {
	Badge,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
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
	toast,
	useDebouncedValue,
} from "@semoss/ui/next";
import logoImage from "@/assets/img/logo.svg";
import {
	MCPSelector,
	PaginationButtons,
	WorkspaceChatList,
	WorkspaceMCPList,
	WorkspaceMembersList,
} from "@/components";
import { useGlobalBreadcrumbs, useRoot } from "@/hooks";
import { useChat } from "@/hooks/use-chat";
import { usePagination } from "@/hooks/use-pagination";
import type { MCPConfig, Workspace } from "@/types";

/**
 * Renders the Workspace Detail Page, displaying information about a specific workspace
 *
 * @component
 */
export const WorkspaceDetailPage = observer(() => {
	const { t } = useTranslation(["workspace", "common"]);

	/**
	 * Library Hooks
	 */
	const { workspaceId } = useParams<{ workspaceId: string }>();
	const navigate = useNavigate();
	const { chat } = useChat();
	const { actions } = useInsight();
	const { root } = useRoot();
	const pagination = usePagination();

	/**
	 * State
	 */
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [tab, setTab] = useState<string>("chats");
	const [search, setSearch] = useState<string>("");
	const [deleteModal, setDeleteModal] = useState<boolean>(false);
	const [isSharingModalOpen, setIsSharingModalOpen] =
		useState<boolean>(false);

	// MCP add dialog state
	const [addMCPOpen, setAddMCPOpen] = useState(false);
	const [addMCPType, setAddMCPType] = useState<"KNOWLEDGE" | "TOOLBOX">(
		"KNOWLEDGE",
	);
	const [pendingMCPs, setPendingMCPs] = useState<MCPConfig[]>([]);
	const [isSavingMCPs, setIsSavingMCPs] = useState(false);
	// incrementing this key forces WorkspaceMCPList to remount and refetch
	const [mcpVersion, setMcpVersion] = useState(0);

	// System prompt inline edit state
	const [isEditingSystemPrompt, setIsEditingSystemPrompt] =
		useState<boolean>(false);
	const [systemPromptDraft, setSystemPromptDraft] = useState<string>("");
	const [isSavingSystemPrompt, setIsSavingSystemPrompt] =
		useState<boolean>(false);

	// Header inline edit state
	const [isEditingHeader, setIsEditingHeader] = useState<boolean>(false);
	const [headerDescription, setHeaderDescription] = useState<string>("");
	const [headerTags, setHeaderTags] = useState<string[]>([]);
	const [headerTagInput, setHeaderTagInput] = useState<string>("");
	const [isSavingHeader, setIsSavingHeader] = useState<boolean>(false);

	/**
	 * Library Hooks
	 */
	const debouncedSearch = useDebouncedValue(search);

	// Fetch workspace details
	const getWorkspace = usePixel<Workspace>(
		workspaceId ? `GetWorkspace(workspaceId=["${workspaceId}"]);` : "",
		{
			data: null,
			onError: (_d, e) => {
				toast.error(
					t("workspace:detail.failedToLoad", {
						error: e instanceof Error ? e.message : "Unknown error",
					}),
				);
			},
		},
	);

	// Fetch workspace tags separately (GetWorkspace does not support metaKeys)
	const getProjectMeta = usePixel<{ tag?: string | string[] }>(
		workspaceId
			? `GetProjectMetadata(project=["${workspaceId}"], metaKeys=["tag"]);`
			: "",
		{ data: null },
	);

	// set the breadcrumbs
	useGlobalBreadcrumbs({
		breadcrumbs: [
			{
				name: t("workspace:breadcrumbs.home"),
				path: "/",
			},
			{
				name: t("workspace:breadcrumbs.agent"),
				path: "/agent",
			},
			{
				name:
					getWorkspace.status === "SUCCESS"
						? getWorkspace.data.name
						: t("workspace:breadcrumbs.loading"),
				path: `/agent/${workspaceId}`,
			},
		],
	});

	const openAddMCP = (type: "KNOWLEDGE" | "TOOLBOX") => {
		if (!getWorkspace.data) return;
		const current = getWorkspace.data.mcp.filter((m) =>
			type === "KNOWLEDGE" ? m.type === "VECTOR" : m.type !== "VECTOR",
		);
		setAddMCPType(type);
		setPendingMCPs(current);
		setAddMCPOpen(true);
	};

	const handleSaveMCPs = async () => {
		if (!getWorkspace.data) return;
		setIsSavingMCPs(true);
		try {
			const other = getWorkspace.data.mcp.filter((m) =>
				addMCPType === "KNOWLEDGE"
					? m.type !== "VECTOR"
					: m.type === "VECTOR",
			);
			await chat.editWorkspace(workspaceId, {
				name: getWorkspace.data.name,
				description: getWorkspace.data.description,
				system_prompt: getWorkspace.data.system_prompt,
				mcp: [...pendingMCPs, ...other],
			});
			getWorkspace.refresh();
			setMcpVersion((v) => v + 1);
			setAddMCPOpen(false);
		} catch (e) {
			toast.error(
				e instanceof Error
					? e.message
					: t("workspace:detail.failedToSave"),
			);
		} finally {
			setIsSavingMCPs(false);
		}
	};

	const handleSaveSystemPrompt = async () => {
		if (!getWorkspace.data) return;
		setIsSavingSystemPrompt(true);
		try {
			await chat.editWorkspace(workspaceId, {
				name: getWorkspace.data.name,
				description: getWorkspace.data.description,
				system_prompt: systemPromptDraft,
				mcp: getWorkspace.data.mcp,
			});
			getWorkspace.refresh();
			setIsEditingSystemPrompt(false);
		} catch (e) {
			toast.error(
				e instanceof Error
					? e.message
					: t("workspace:detail.failedToSave"),
			);
		} finally {
			setIsSavingSystemPrompt(false);
		}
	};

	useEffect(() => {
		if (getWorkspace.data) {
			setHeaderDescription(getWorkspace.data.description || "");
		}
	}, [getWorkspace.data]);

	useEffect(() => {
		if (getProjectMeta.data) {
			const rawTag = getProjectMeta.data.tag;
			const normalized = Array.isArray(rawTag)
				? rawTag
				: rawTag
					? [rawTag]
					: [];
			setHeaderTags(normalized);
		}
	}, [getProjectMeta.data]);

	const handleSaveHeader = async () => {
		if (!getWorkspace.data) return;
		setIsSavingHeader(true);
		try {
			await chat.editWorkspace(workspaceId, {
				name: getWorkspace.data.name,
				description: headerDescription,
				system_prompt: getWorkspace.data.system_prompt,
				mcp: getWorkspace.data.mcp,
			});
			try {
				await actions.run(
					`SetProjectMetadata(project=["${workspaceId}"], meta=[{"tag":${JSON.stringify(headerTags)}}], jsonCleanup=[true]);`,
				);
			} catch {
				toast.error("Saved but tags could not be updated.");
			}
			getWorkspace.refresh();
			getProjectMeta.refresh();
			setIsEditingHeader(false);
		} catch (e) {
			toast.error(
				e instanceof Error
					? e.message
					: t("workspace:detail.failedToSave"),
			);
		} finally {
			setIsSavingHeader(false);
		}
	};

	if (getWorkspace.status === "LOADING" || isLoading) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	if (getWorkspace.status === "ERROR") {
		return <Navigate to="/agent" />;
	}

	return (
		<div className="relative h-full w-full overflow-hidden">
			<div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-6 px-12 pt-8 pb-4">
				<div className="flex flex-row gap-2">
					<div className="items-center text-2xl">
						<img
							className="flex h-6 select-none flex-row items-center"
							alt={t("common:images.logoAlt")}
							src={root.theme?.images.logo || logoImage}
						/>
					</div>
					<div className="min-w-0 flex-1 space-y-1.5">
						<div className="font-semibold text-2xl text-foreground leading-none">
							{getWorkspace.data?.name}
						</div>
						{isEditingHeader ? (
							<div className="flex flex-col gap-2">
								<Input
									value={headerDescription}
									onChange={(e) =>
										setHeaderDescription(e.target.value)
									}
									placeholder="Description"
									disabled={isSavingHeader}
									className="text-sm"
								/>
								<div className="flex min-h-[38px] flex-wrap items-center gap-1.5 rounded-md border border-input px-2 py-1.5">
									{headerTags
										.filter(
											(t) => t !== "Workspace_Project",
										)
										.map((tag) => (
											<Badge
												key={tag}
												variant="secondary"
												className="gap-1 text-xs"
											>
												{tag}
												<button
													type="button"
													onClick={() =>
														setHeaderTags((prev) =>
															prev.filter(
																(t) =>
																	t !== tag,
															),
														)
													}
													className="ml-0.5 rounded-full hover:text-destructive"
												>
													<X className="h-3 w-3" />
												</button>
											</Badge>
										))}
									<input
										className="min-w-[80px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
										placeholder={
											headerTags.filter(
												(t) =>
													t !== "Workspace_Project",
											).length === 0
												? "Add tags..."
												: ""
										}
										value={headerTagInput}
										disabled={isSavingHeader}
										onChange={(e) =>
											setHeaderTagInput(e.target.value)
										}
										onKeyDown={(e) => {
											if (
												e.key === "Enter" ||
												e.key === ","
											) {
												e.preventDefault();
												const trimmed =
													headerTagInput.trim();
												if (
													trimmed &&
													!headerTags.includes(
														trimmed,
													)
												) {
													setHeaderTags((prev) => [
														...prev,
														trimmed,
													]);
												}
												setHeaderTagInput("");
											}
										}}
										onBlur={() => {
											const trimmed =
												headerTagInput.trim();
											if (
												trimmed &&
												!headerTags.includes(trimmed)
											) {
												setHeaderTags((prev) => [
													...prev,
													trimmed,
												]);
											}
											setHeaderTagInput("");
										}}
									/>
								</div>
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											setIsEditingHeader(false)
										}
										disabled={isSavingHeader}
									>
										Cancel
									</Button>
									<Button
										size="sm"
										onClick={handleSaveHeader}
										disabled={isSavingHeader}
									>
										{isSavingHeader ? (
											<Spinner className="size-3" />
										) : (
											"Save"
										)}
									</Button>
								</div>
							</div>
						) : (
							<div className="flex flex-col gap-1">
								<div className="flex items-center gap-2">
									<span
										className={
											getWorkspace.data?.description
												? "text-muted-foreground text-sm"
												: "text-muted-foreground/50 text-sm italic"
										}
									>
										{getWorkspace.data?.description ||
											(headerTags.filter(
												(t) =>
													t !== "Workspace_Project",
											).length === 0
												? "Add description or tags..."
												: "")}
									</span>
									<Button
										variant="ghost"
										size="icon-sm"
										onClick={() => setIsEditingHeader(true)}
										className="h-4 w-4 shrink-0 opacity-60"
									>
										<Pencil className="h-2.5 w-2.5" />
									</Button>
								</div>
								{headerTags.filter(
									(t) => t !== "Workspace_Project",
								).length > 0 && (
									<div className="flex flex-wrap gap-1">
										{headerTags
											.filter(
												(t) =>
													t !== "Workspace_Project",
											)
											.map((tag) => (
												<Badge
													key={tag}
													variant="secondary"
													className="text-xs"
												>
													{tag}
												</Badge>
											))}
									</div>
								)}
							</div>
						)}
					</div>
					<Button
						variant="outline"
						onClick={() => setDeleteModal(true)}
						title={t("workspace:actions.delete")}
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>

				<Tabs
					value={tab}
					onValueChange={(value) => setTab(value)}
					className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden"
				>
					<div className="flex flex-row items-center justify-between gap-4">
						<TabsList>
							<TabsTrigger value="chats">
								<MessagesSquareIcon />
								{t("workspace:detail.tabs.myChats")}
							</TabsTrigger>
							<TabsTrigger value="knowledge">
								<BookOpenIcon />
								{t("workspace:detail.tabs.knowledge")}
							</TabsTrigger>
							<TabsTrigger value="toolbox">
								<HammerIcon />
								{t("workspace:detail.tabs.toolbox")}
							</TabsTrigger>
							<TabsTrigger value="systemPrompt">
								<FileTextIcon />
								Instructions
							</TabsTrigger>
							<TabsTrigger value="members">
								<UsersRound />
								{t("workspace:detail.tabs.members")}
							</TabsTrigger>
						</TabsList>
						<Button
							variant="default"
							onClick={() => {
								navigate(`/new?workspaceId=${workspaceId}`);
							}}
						>
							<PlusIcon />
							{t("workspace:actions.newChat")}
						</Button>
					</div>
					<div className="flex min-h-0 w-full flex-1 flex-col items-start overflow-hidden rounded-xl border border-border bg-card">
						<div className="flex w-full flex-row gap-2 border-border border-b bg-primary-foreground p-4">
							{tab !== "systemPrompt" && (
								<InputGroup className="bg-background">
									<InputGroupInput
										placeholder={t("common:buttons.search")}
										value={search}
										onChange={(e) =>
											setSearch(e.target.value)
										}
									/>
									<InputGroupAddon>
										<SearchIcon />
									</InputGroupAddon>
								</InputGroup>
							)}
							{/* Tab-specific actions */}
							{tab === "knowledge" && (
								<Button
									variant="outline"
									onClick={() => openAddMCP("KNOWLEDGE")}
								>
									<PlusIcon />
									Add Knowledge
								</Button>
							)}
							{tab === "toolbox" && (
								<Button
									variant="outline"
									onClick={() => openAddMCP("TOOLBOX")}
								>
									<PlusIcon />
									Add Toolbox
								</Button>
							)}
							{tab === "systemPrompt" &&
								!isEditingSystemPrompt && (
									<Button
										variant="outline"
										onClick={() => {
											setSystemPromptDraft(
												getWorkspace.data?.system_prompt?.replace(
													/\\+n/g,
													"\n",
												) || "",
											);
											setIsEditingSystemPrompt(true);
										}}
									>
										Edit Instructions
									</Button>
								)}
							{tab === "systemPrompt" &&
								isEditingSystemPrompt && (
									<>
										<Button
											variant="outline"
											onClick={() =>
												setIsEditingSystemPrompt(false)
											}
											disabled={isSavingSystemPrompt}
										>
											{t("common:buttons.cancel")}
										</Button>
										<Button
											onClick={handleSaveSystemPrompt}
											disabled={isSavingSystemPrompt}
										>
											{isSavingSystemPrompt ? (
												<Spinner className="size-4" />
											) : (
												t("common:buttons.save")
											)}
										</Button>
									</>
								)}
							{tab === "members" ? (
								<Button
									variant="outline"
									onClick={() => setIsSharingModalOpen(true)}
								>
									<PlusIcon />
									{t("workspace:sharing.title")}
								</Button>
							) : null}
						</div>

						<TabsContent
							value="chats"
							className="w-full overflow-hidden"
						>
							{tab === "chats" && (
								<WorkspaceChatList
									workspaceId={workspaceId}
									search={debouncedSearch}
								/>
							)}
						</TabsContent>
						<TabsContent
							value="knowledge"
							className="w-full overflow-hidden"
						>
							{tab === "knowledge" && (
								<WorkspaceMCPList
									key={`${workspaceId}-knowledge-${mcpVersion}`}
									type="KNOWLEDGE"
									workspaceId={workspaceId}
									search={debouncedSearch}
								/>
							)}
						</TabsContent>
						<TabsContent
							value="toolbox"
							className="w-full overflow-hidden"
						>
							{tab === "toolbox" && (
								<WorkspaceMCPList
									key={`${workspaceId}-toolbox-${mcpVersion}`}
									type="TOOLBOX"
									workspaceId={workspaceId}
									search={debouncedSearch}
								/>
							)}
						</TabsContent>
						<TabsContent
							value="systemPrompt"
							className="w-full overflow-hidden"
						>
							{tab === "systemPrompt" && (
								<div className="flex h-full w-full flex-col p-6">
									{isEditingSystemPrompt ? (
										<Textarea
											value={systemPromptDraft}
											onChange={(e) =>
												setSystemPromptDraft(
													e.target.value,
												)
											}
											rows={16}
											className="resize-y text-sm"
											placeholder="Describe the agent's role, behavior, and any constraints..."
											autoFocus
										/>
									) : getWorkspace.data?.system_prompt ? (
										<div className="rounded-lg border border-border bg-muted/30 p-4">
											<p className="whitespace-pre-wrap text-sm leading-relaxed">
												{getWorkspace.data.system_prompt.replace(
													/\\+n/g,
													"\n",
												)}
											</p>
										</div>
									) : (
										<p className="text-muted-foreground text-sm italic">
											No instructions configured. Click
											&ldquo;Edit Instructions&rdquo;
											above to add one.
										</p>
									)}
								</div>
							)}
						</TabsContent>
						<TabsContent
							value="members"
							className="w-full overflow-hidden"
						>
							{tab === "members" && (
								<WorkspaceMembersList
									workspaceId={workspaceId}
									search={debouncedSearch}
									paginationControl={pagination}
									isSharingModalOpen={isSharingModalOpen}
									onSharingModalClose={() =>
										setIsSharingModalOpen(false)
									}
								/>
							)}
						</TabsContent>

						{tab === "members" && (
							<div className="flex w-full flex-row items-center justify-end gap-2 border-border border-t bg-primary-foreground p-4">
								<PaginationButtons {...pagination} />
							</div>
						)}
					</div>
				</Tabs>
			</div>

			{/* Delete confirmation dialog */}
			<Dialog open={deleteModal} onOpenChange={setDeleteModal}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{t("workspace:card.deleteConfirmTitle")}
						</DialogTitle>
						<DialogDescription>
							{t("workspace:card.deleteConfirmDescription", {
								name: getWorkspace?.data?.name,
							})}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={(e) => {
								e.stopPropagation();
								setDeleteModal(false);
							}}
							data-testid={`workspace-detail-page--cancel-delete-btn`}
						>
							{t("common:buttons.cancel")}
						</Button>
						<Button
							variant="destructive"
							data-testid={`workspace-detail-page--confirm-delete-btn`}
							onClick={async (e) => {
								e.stopPropagation();
								setIsLoading(true);
								try {
									await chat.deleteWorkspace(workspaceId);
									navigate("/agent");
								} catch (e) {
									toast.error(
										e instanceof Error
											? e.message
											: t(
													"workspace:detail.failedToDelete",
												),
									);
								} finally {
									setIsLoading(false);
								}
							}}
						>
							{t("workspace:actions.delete")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Add Knowledge / Toolbox dialog */}
			<Dialog
				open={addMCPOpen}
				onOpenChange={(open) => {
					if (!open) setAddMCPOpen(false);
				}}
			>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>
							{addMCPType === "KNOWLEDGE"
								? "Add Knowledge"
								: "Add Toolbox"}
						</DialogTitle>
						<DialogDescription>
							{addMCPType === "KNOWLEDGE"
								? "Select knowledge sources to attach to this agent."
								: "Select toolbox items to attach to this agent."}
						</DialogDescription>
					</DialogHeader>
					<MCPSelector
						type={addMCPType}
						values={pendingMCPs}
						onChange={setPendingMCPs}
					/>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setAddMCPOpen(false)}
						>
							{t("common:buttons.cancel")}
						</Button>
						<Button
							onClick={handleSaveMCPs}
							disabled={isSavingMCPs}
						>
							{isSavingMCPs ? (
								<Spinner className="size-4" />
							) : (
								t("common:buttons.save")
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
});
