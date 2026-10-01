import { BookOpenIcon, Bot, CheckIcon, HammerIcon } from "lucide-react";
import type React from "react";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { usePixel } from "@semoss/sdk/react";
import { type MCPConfig, MCPSelector } from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	Badge,
	Button,
	cn,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Spinner,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import { useRoot } from "@/hooks/use-root";
import type { Workspace } from "@/types";
import { mcpToPlatformUrl, splitMcpByType } from "@/utility/mcp-utils";
import { NewKnowledgeFormBody } from "../knowledge/new-knowledge-form-body";
import { AgentSelector } from "./agent-selector";

type Tab = "AGENT" | "TOOLBOX" | "KNOWLEDGE";
type WorkspaceRef = Pick<Workspace, "workspace_id"> &
	Partial<Pick<Workspace, "name">>;

interface MCPOverlaySave {
	/** Explicit selection remains meaningful when Default agent has no workspace id. */
	agentModeSelected?: boolean;
	mcp: MCPConfig[];
	/** Only present when the overlay was opened with an `workspace` prop. */
	workspace?: WorkspaceRef | null;
}

interface MCPOverlayProps {
	/** Open */
	open: boolean;

	/** Which tab is active when the overlay opens */
	defaultTab: Tab;

	/** Full MCP list (any types). The overlay splits these into the two tabs. */
	values: MCPConfig[];

	/**
	 * Currently-selected agent (workspace), if any. When `agentEditable` is
	 * true this hydrates the Agent tab; either way it's used to merge the
	 * agent's MCPs into the drafts as `fromWorkspace` entries.
	 */
	workspace?: WorkspaceRef | null;

	/**
	 * Whether the user can change the agent inside the overlay. Defaults to
	 * `false` — callers must explicitly opt in. When false the Agent tab is
	 * omitted entirely (existing rooms have their workspace baked in).
	 */
	agentEditable?: boolean;
	allowDefaultAgent?: boolean;
	/** Keep selections visible when the conversation becomes busy. */
	disabled?: boolean;

	/**
	 * Fired when the overlay closes. Receives the next draft state when the
	 * user saves, or `undefined` when they cancel.
	 */
	onClose: (next?: MCPOverlaySave) => void;
}

export const MCPOverlay: React.FC<MCPOverlayProps> = ({
	open,
	defaultTab,
	values,
	workspace,
	agentEditable = false,
	allowDefaultAgent = false,
	disabled = false,
	onClose,
}) => {
	const { t } = useTranslation(["mcp", "knowledge", "common", "room"]);
	const { root } = useRoot();

	const [knowledge, setKnowledge] = useState<MCPConfig[]>(
		() => splitMcpByType(values).knowledge,
	);
	const [toolbox, setToolbox] = useState<MCPConfig[]>(
		() => splitMcpByType(values).toolbox,
	);
	const [workspaceDraft, setWorkspaceDraft] = useState<WorkspaceRef | null>(
		workspace ?? null,
	);
	const [activeTab, setActiveTab] = useState<Tab>(defaultTab);
	const [hasSelectedAgent, setHasSelectedAgent] = useState(false);

	// Routed view inside the overlay. "list" shows tabs + selectors; "create"
	// swaps the body for the create-knowledge form so we don't stack Dialogs.
	const [view, setView] = useState<"list" | "create">("list");
	const [isCreating, setIsCreating] = useState(false);
	const createFormId = useId();

	// Tracks which workspace's MCPs are currently merged into the drafts.
	// Used to detect when the user picks a different agent (or clears it)
	// inside the modal so we can swap workspace MCPs in/out of the drafts
	// live, rather than waiting for the room to refetch after save.
	const mergedWorkspaceId = useRef<string | null>(
		workspace?.workspace_id ?? null,
	);

	// Reset drafts on the closed → open transition only. Mutations to props
	// while the dialog is already open would otherwise discard the user's
	// in-progress edits.
	const wasOpen = useRef(open);
	useEffect(() => {
		if (open && !wasOpen.current) {
			const next = splitMcpByType(values);
			setKnowledge(next.knowledge);
			setToolbox(next.toolbox);
			setWorkspaceDraft(workspace ?? null);
			setActiveTab(defaultTab);
			setHasSelectedAgent(false);
			setView("list");
			mergedWorkspaceId.current = workspace?.workspace_id ?? null;
		}
		wasOpen.current = open;
	}, [open, values, defaultTab, workspace]);

	// Fetch the selected agent's MCPs whenever the user picks one in the
	// modal. Empty string disables the call (per the usePixel convention).
	const getWorkspace = usePixel<Workspace | null>(
		open && workspaceDraft?.workspace_id
			? `GetWorkspace(${JSON.stringify(workspaceDraft.workspace_id)});`
			: "",
		{ data: null },
	);

	// When the selected agent changes (including to null), strip any
	// fromWorkspace MCPs from the drafts. The follow-up effect below will
	// then merge in the new agent's MCPs once the pixel resolves.
	useEffect(() => {
		const draftId = workspaceDraft?.workspace_id ?? null;
		if (draftId === mergedWorkspaceId.current) return;
		setKnowledge((prev) => prev.filter((m) => !m.fromWorkspace));
		setToolbox((prev) => prev.filter((m) => !m.fromWorkspace));
		mergedWorkspaceId.current = null;
	}, [workspaceDraft?.workspace_id]);

	// Merge the loaded workspace's MCPs into the drafts as fromWorkspace
	// entries. Guards against stale pixel responses for a previously
	// selected agent.
	useEffect(() => {
		const draftId = workspaceDraft?.workspace_id ?? null;
		if (!draftId) return;
		if (mergedWorkspaceId.current === draftId) return;
		if (getWorkspace.status !== "SUCCESS" || !getWorkspace.data) return;
		if (getWorkspace.data.workspace_id !== draftId) return;

		const workspaceMcps: MCPConfig[] = (getWorkspace.data.mcp || []).map(
			(m) => ({ ...m, fromWorkspace: true }),
		);
		const { knowledge: wsK, toolbox: wsT } = splitMcpByType(workspaceMcps);
		const wsKnowledgeIds = new Set(wsK.map((m) => m.id));
		const wsToolboxIds = new Set(wsT.map((m) => m.id));
		setKnowledge((prev) => [
			...wsK,
			...prev.filter(
				(m) => !m.fromWorkspace && !wsKnowledgeIds.has(m.id),
			),
		]);
		setToolbox((prev) => [
			...wsT,
			...prev.filter((m) => !m.fromWorkspace && !wsToolboxIds.has(m.id)),
		]);
		mergedWorkspaceId.current = draftId;
	}, [workspaceDraft?.workspace_id, getWorkspace.status, getWorkspace.data]);

	const returnFocus = useRef<HTMLElement | null>(null);
	const needsAgentLoad =
		!!workspaceDraft &&
		mergedWorkspaceId.current !== workspaceDraft.workspace_id;
	const agentLoadFailed =
		needsAgentLoad &&
		(getWorkspace.status === "ERROR" ||
			(getWorkspace.status === "SUCCESS" && !getWorkspace.data));

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				// Don't let the user dismiss while a create is in-flight; the
				// pixel calls can't be cancelled and the draft state would
				// be lost.
				if (!next && !isCreating) {
					onClose();
				}
			}}
		>
			<DialogContent
				className="flex h-160 max-h-dvh w-full flex-col gap-4 sm:max-w-4xl"
				showCloseButton={!isCreating}
				onEscapeKeyDown={(event) => {
					if (isCreating) event.preventDefault();
				}}
				onInteractOutside={(event) => {
					if (isCreating) event.preventDefault();
				}}
				onOpenAutoFocus={(e) => {
					returnFocus.current =
						document.activeElement instanceof HTMLElement
							? document.activeElement
							: null;
					e.preventDefault();
					(e.currentTarget as HTMLElement)
						.querySelector<HTMLElement>("input")
						?.focus();
				}}
				onCloseAutoFocus={(event) => {
					if (returnFocus.current?.isConnected) {
						event.preventDefault();
						returnFocus.current.focus();
					}
				}}
			>
				{view === "create" ? (
					<>
						<DialogHeader>
							<DialogTitle>
								{t("knowledge:newSource.title")}
							</DialogTitle>
							<DialogDescription>
								{t("knowledge:newSource.description")}
							</DialogDescription>
						</DialogHeader>

						{/* px-1 py-1: overflow-y-auto implicitly clips overflow-x,
						    which trims the focus ring on the inputs at the edges.
						    A tiny inset gives the rings room. */}
						<div className="min-h-0 flex-1 overflow-y-auto px-1 py-1">
							<NewKnowledgeFormBody
								formId={createFormId}
								onLoadingChange={setIsCreating}
								onSuccess={(next) => {
									setKnowledge((prev) =>
										prev.some((m) => m.id === next.id)
											? prev
											: [...prev, next],
									);
									setView("list");
									setActiveTab("KNOWLEDGE");
								}}
							/>
						</div>

						<DialogFooter>
							<Button
								variant="ghost"
								disabled={isCreating}
								onClick={() => setView("list")}
							>
								{t("common:buttons.back")}
							</Button>
							<Button
								type="submit"
								form={createFormId}
								variant="default"
								disabled={isCreating}
							>
								{isCreating ? (
									<Spinner />
								) : (
									t("common:buttons.create")
								)}
							</Button>
						</DialogFooter>
					</>
				) : (
					<>
						<DialogHeader>
							<DialogTitle>{t("overlay.title")}</DialogTitle>
							<DialogDescription>
								{t("overlay.description")}
							</DialogDescription>
						</DialogHeader>

						<Tabs
							value={activeTab}
							onValueChange={(value) => {
								if (
									value === "AGENT" ||
									value === "TOOLBOX" ||
									value === "KNOWLEDGE"
								)
									setActiveTab(value);
							}}
							className="flex min-h-0 flex-1 flex-col gap-3"
						>
							<TabsList
								className={cn(
									"grid h-auto w-full p-1",
									agentEditable
										? "grid-cols-3"
										: "grid-cols-2",
								)}
							>
								{agentEditable && (
									<TabsTrigger
										value="AGENT"
										className="relative h-full min-w-0 flex-wrap gap-1 whitespace-normal py-2 sm:gap-2"
									>
										<Bot
											aria-hidden="true"
											className="hidden size-4 sm:block"
										/>
										<span className="min-w-0 break-words">
											{t("overlay.tabAgent")}
										</span>
										{/* Absolutely positioned so the centered label
										    doesn't shift when the indicator appears. */}
										{workspaceDraft ? (
											<CheckIcon className="absolute end-2.5 size-3.5 text-primary" />
										) : null}
									</TabsTrigger>
								)}
								<TabsTrigger
									value="KNOWLEDGE"
									className="h-full min-w-0 flex-wrap gap-1 whitespace-normal py-2 sm:gap-2"
								>
									<BookOpenIcon
										aria-hidden="true"
										className="hidden size-4 sm:block"
									/>
									<span className="min-w-0 break-words">
										{t("overlay.tabKnowledge")}
									</span>
									<Badge variant="outline" className="ms-1">
										{knowledge.length}
									</Badge>
								</TabsTrigger>
								<TabsTrigger
									value="TOOLBOX"
									className="h-full min-w-0 flex-wrap gap-1 whitespace-normal py-2 sm:gap-2"
								>
									<HammerIcon
										aria-hidden="true"
										className="hidden size-4 sm:block"
									/>
									<span className="min-w-0 break-words">
										{t("overlay.tabToolbox")}
									</span>
									<Badge variant="outline" className="ms-1">
										{toolbox.length}
									</Badge>
								</TabsTrigger>
							</TabsList>

							{agentEditable && (
								<TabsContent
									value="AGENT"
									className="flex min-h-0 flex-1 flex-col"
								>
									{activeTab === "AGENT" && (
										<AgentSelector
											allowDefaultAgent={
												allowDefaultAgent
											}
											disabled={disabled}
											value={workspaceDraft}
											onChange={(next) => {
												setHasSelectedAgent(true);
												setWorkspaceDraft(next);
											}}
										/>
									)}
								</TabsContent>
							)}
							<TabsContent
								value="KNOWLEDGE"
								className="flex min-h-0 flex-1 flex-col"
							>
								{activeTab === "KNOWLEDGE" && (
									<MCPSelector
										disabled={disabled}
										type="KNOWLEDGE"
										values={knowledge}
										onChange={setKnowledge}
										onRequestCreateKnowledge={() => {
											if (!disabled) setView("create");
										}}
										autoFocus
										enableKnowledgeMCP={
											root.theme.featureFlags
												?.enableKnowledgeMCP
										}
										getPlatformUrl={
											root.theme.featureFlags
												?.showPlatformLinks
												? mcpToPlatformUrl
												: undefined
										}
									/>
								)}
							</TabsContent>
							<TabsContent
								value="TOOLBOX"
								className="flex min-h-0 flex-1 flex-col"
							>
								{activeTab === "TOOLBOX" && (
									<MCPSelector
										disabled={disabled}
										type="TOOLBOX"
										values={toolbox}
										onChange={setToolbox}
										autoFocus
										enableKnowledgeMCP={
											root.theme.featureFlags
												?.enableKnowledgeMCP
										}
										showSystemTools={
											root.theme.featureFlags
												?.showSystemTools
										}
										getPlatformUrl={
											root.theme.featureFlags
												?.showPlatformLinks
												? mcpToPlatformUrl
												: undefined
										}
									/>
								)}
							</TabsContent>
						</Tabs>

						{agentLoadFailed && (
							<Alert variant="destructive">
								<AlertDescription>
									{t("room:settings.agentLoadError")}
								</AlertDescription>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={getWorkspace.refresh}
								>
									{t("room:studio.retry")}
								</Button>
							</Alert>
						)}
						<DialogFooter>
							<Button
								type="button"
								variant="ghost"
								onClick={() => onClose()}
							>
								{t("buttons.cancel")}
							</Button>
							<Button
								variant="default"
								disabled={disabled || needsAgentLoad}
								onClick={() =>
									!disabled &&
									!needsAgentLoad &&
									onClose({
										mcp: [...knowledge, ...toolbox],
										...(agentEditable &&
										(activeTab === "AGENT" ||
											hasSelectedAgent)
											? { agentModeSelected: true }
											: {}),
										workspace: workspaceDraft,
									})
								}
							>
								{t("buttons.save")}
							</Button>
						</DialogFooter>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
};
