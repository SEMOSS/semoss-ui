import { BookOpenIcon, Bot, CheckIcon, HammerIcon } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	type MCPConfig,
	MCPSelector,
	splitMcpByType,
	useAgentWorkspace,
} from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	Badge,
	Button,
	cn,
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
import { useChatConfig } from "../../chat/config/chat-config.context";
import { NewKnowledgeForm } from "../../knowledge/new-knowledge-form";
import type { AgentChoice, AgentOverlaySave, AgentRef } from "./agent-choice";
import { AgentSelector } from "./agent-selector";
import { listRoomTools } from "./mcp-utils";

/** A tab of the agent picker. */
export type MCPOverlayTab = "AGENT" | "TOOLBOX" | "KNOWLEDGE";

/** Props for {@link MCPOverlayPicker}. */
interface MCPOverlayPickerProps {
	/** The tab it opens on. */
	defaultTab: MCPOverlayTab;
	/** The room's own MCPs when it opened, which the drafts start from. */
	values: MCPConfig[];
	/** The agent the room runs, if any. */
	workspace: AgentRef | null;
	/** The tools and knowledge `workspace` brings. */
	agentTools: readonly MCPConfig[];
	/** How the chat offers its agent; a `fixed` agent has no Agent tab. */
	agent: AgentChoice;
	/** Keeps selections visible but read-only while the conversation is busy. */
	disabled: boolean;
	/** Whether a knowledge source is being created, which locks the dialog. */
	isCreating: boolean;
	/** Told when a knowledge source starts or stops being created. */
	onCreatingChange: (isCreating: boolean) => void;
	/** Closes the dialog, with the drafts on save. */
	onClose: (next?: AgentOverlaySave) => void;
}

/**
 * The agent picker's contents for one open: drafts of the room's own
 * knowledge and toolboxes and of its agent, started from the props it mounts
 * with, and the create-knowledge view. `MCPOverlay` mounts one per open.
 */
export const MCPOverlayPicker = ({
	defaultTab,
	values,
	workspace,
	agentTools,
	agent,
	disabled,
	isCreating,
	onCreatingChange,
	onClose,
}: MCPOverlayPickerProps) => {
	const { t } = useTranslation(["mcp", "knowledge", "common", "room"]);
	const { options } = useChatConfig();

	const [knowledge, setKnowledge] = useState<MCPConfig[]>(
		() => splitMcpByType(values).knowledge,
	);
	const [toolbox, setToolbox] = useState<MCPConfig[]>(
		() => splitMcpByType(values).toolbox,
	);
	const [workspaceDraft, setWorkspaceDraft] = useState<AgentRef | null>(
		workspace,
	);
	const [defaultAgentDraft, setDefaultAgentDraft] = useState(
		agent.kind === "savedOrDefault" && agent.isDefaultAgent,
	);
	const [activeTab, setActiveTab] = useState<MCPOverlayTab>(defaultTab);
	// "list" shows tabs + selectors; "create" swaps the body for the
	// create-knowledge form so we don't stack Dialogs.
	const [view, setView] = useState<"list" | "create">("list");
	const createFormId = useId();
	const isAgentEditable = agent.kind !== "fixed";

	// The picked agent's tools: the room's agent's are known; another agent
	// picked here is read
	const draftAgentId = workspaceDraft?.workspace_id ?? null;
	const isRoomAgent = draftAgentId === (workspace?.workspace_id ?? null);
	const pickedAgent = useAgentWorkspace(isRoomAgent ? null : draftAgentId);
	const draftAgentTools: readonly MCPConfig[] = isRoomAgent
		? agentTools
		: (pickedAgent.workspace?.mcp ?? []);
	// "IDLE" is no agent picked, which has nothing to read
	const needsAgentLoad =
		pickedAgent.status === "LOADING" || pickedAgent.status === "ERROR";
	const agentLoadFailed = pickedAgent.status === "ERROR";

	// The selectors show the agent's selections beside the room's, marked as
	// the agent's so they cannot be removed there (the selector's
	// `fromWorkspace`); a room selection of the same id is hidden behind it
	const agentToolIds = new Set(draftAgentTools.map((tool) => tool.id));
	const agentSelections = splitMcpByType(
		draftAgentTools.map((tool) => ({ ...tool, fromWorkspace: true })),
	);
	const shownKnowledge = listRoomTools(knowledge, agentSelections.knowledge);
	const shownToolbox = listRoomTools(toolbox, agentSelections.toolbox);
	/**
	 * Keep the room's own selections from what a selector hands back.
	 *
	 * @param next - The selector's selections, the agent's included.
	 * @returns The room's own.
	 */
	const toRoomSelections = (next: MCPConfig[]): MCPConfig[] =>
		next.filter((item) => !agentToolIds.has(item.id));
	const getPlatformUrl = options.catalogItemHref;

	if (view === "create") {
		return (
			<>
				<DialogHeader>
					<DialogTitle>{t("knowledge:newSource.title")}</DialogTitle>
					<DialogDescription>
						{t("knowledge:newSource.description")}
					</DialogDescription>
				</DialogHeader>

				{/* px-1 py-1: overflow-y-auto implicitly clips overflow-x,
				    which trims the focus ring on the inputs at the edges.
				    A tiny inset gives the rings room. */}
				<div className="min-h-0 flex-1 overflow-y-auto px-1 py-1">
					<NewKnowledgeForm
						formId={createFormId}
						onLoadingChange={onCreatingChange}
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
						{isCreating ? <Spinner /> : t("common:buttons.create")}
					</Button>
				</DialogFooter>
			</>
		);
	}

	return (
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
						isAgentEditable ? "grid-cols-3" : "grid-cols-2",
					)}
				>
					{isAgentEditable && (
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
							{workspaceDraft ||
							(agent.kind === "savedOrDefault" &&
								defaultAgentDraft) ? (
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
							{shownKnowledge.length}
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
							{shownToolbox.length}
						</Badge>
					</TabsTrigger>
				</TabsList>

				{agent.kind !== "fixed" && (
					<TabsContent
						value="AGENT"
						className="flex min-h-0 flex-1 flex-col"
					>
						{activeTab === "AGENT" && (
							<AgentSelector
								choice={
									agent.kind === "savedOrDefault"
										? {
												kind: "savedOrDefault",
												isDefaultAgent:
													defaultAgentDraft,
											}
										: agent
								}
								disabled={disabled}
								value={workspaceDraft}
								onChange={setWorkspaceDraft}
								onDefaultAgentChange={setDefaultAgentDraft}
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
							values={shownKnowledge}
							onChange={(next) =>
								setKnowledge(toRoomSelections(next))
							}
							onRequestCreateKnowledge={() => {
								if (!disabled) setView("create");
							}}
							autoFocus
							enableKnowledgeMCP={options.shouldMakeKnowledgeMcp}
							getPlatformUrl={getPlatformUrl}
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
							values={shownToolbox}
							onChange={(next) =>
								setToolbox(toRoomSelections(next))
							}
							autoFocus
							enableKnowledgeMCP={options.shouldMakeKnowledgeMcp}
							showSystemTools={options.hasSystemCatalogItems}
							getPlatformUrl={getPlatformUrl}
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
						onClick={pickedAgent.refresh}
					>
						{t("room:studio.retry")}
					</Button>
				</Alert>
			)}
			<DialogFooter>
				<Button type="button" variant="ghost" onClick={() => onClose()}>
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
							workspace: workspaceDraft,
							...(agent.kind === "savedOrDefault"
								? { isDefaultAgent: defaultAgentDraft }
								: {}),
						})
					}
				>
					{t("buttons.save")}
				</Button>
			</DialogFooter>
		</>
	);
};
