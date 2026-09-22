import { type CSSProperties, useCallback, useState } from "react";
import { Link, Outlet, useNavigate, useParams } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import {
	Button,
	Sidebar,
	SidebarContent,
	SidebarInset,
	SidebarProvider,
	SidebarRail,
	SidebarTrigger,
	Spinner,
	toast,
	useSidebar,
} from "@semoss/ui/next";
import type { MainContext } from "@/app/main.context";
import { MainProvider } from "@/app/main.context";
import { refreshKey } from "@/app/refresh-keys";
import { EmptyView } from "@/components/common/empty-view";
import { SidebarAgentsList } from "@/components/sidebar/sidebar-agents-list";
import { SidebarFooter } from "@/components/sidebar/sidebar-footer";
import { SidebarHeader } from "@/components/sidebar/sidebar-header";
import {
	type AgentDraft,
	createAgent,
	updateAgent,
} from "@/features/agents/api/save-agent";
import { useWorkspaceData } from "@/features/agents/api/use-workspace-data";
import { NewSessionDialog } from "@/features/agents/components/new-session-dialog";
import { createRoom } from "@/features/rooms/api/create-room";
import { pinRoom as persistRoomPin } from "@/features/rooms/api/pin-room";
import { pendingSession } from "@/features/rooms/utils/session-from-room";
import { toError } from "@/lib/pixel";
import { roomPath } from "@/lib/workspace-paths";
import type { Agent } from "@/types/agent";
import type { Session } from "@/types/session";

/** Map the UI's agent shape onto the fields the workspace reactors accept. */
function toAgentDraft(agent: Agent): AgentDraft {
	return {
		name: agent.name,
		description: agent.role,
		systemPrompt: agent.instructions,
		maxSubagentDepth: agent.depth,
		maxSubagentsPerRun: agent.concurrency,
	};
}

function WorkspaceSidebarNavigation({
	agents,
	sessions,
	agentId,
}: {
	agents: Agent[];
	sessions: Session[];
	agentId?: string;
}) {
	const { state } = useSidebar();
	const condensed = state === "collapsed";

	return (
		<>
			<SidebarHeader condensed={condensed} />
			<SidebarContent className="px-3">
				<div className="group-data-[collapsible=icon]:hidden">
					<SidebarAgentsList
						agents={agents}
						sessions={sessions}
						agentId={agentId}
					/>
				</div>
			</SidebarContent>
			<SidebarFooter condensed={condensed} />
			<SidebarRail />
		</>
	);
}

/**
 * Composes the agents and rooms features into the workspace shell, owns the
 * shared main context, and frames the left-rail navigation.
 */
export function MainLayout() {
	const navigate = useNavigate();
	const { agentId } = useParams();
	const { actions, insightId } = useInsight();
	const [keys, setKeys] = useState<MainContext["keys"]>({});
	const workspaceData = useWorkspaceData(keys);
	const { agents, sessions, setSessions, addPendingRoom, isLoading, error } =
		workspaceData;

	const [setup, setSetup] = useState<{ agentId?: string }>();

	const [sidebarOpen, setSidebarOpen] = useState(true);

	const refreshAgents = useCallback(() => {
		setKeys((current) => refreshKey(current, "agents"));
	}, []);

	const updateRoom = useCallback(
		(id: string, changes: Partial<Session>) => {
			setSessions((items) =>
				items.map((item) =>
					item.id === id ? { ...item, ...changes } : item,
				),
			);
		},
		[setSessions],
	);

	const pinCurrentRoom = useCallback(
		async (id: string, pinned: boolean) => {
			setSessions((items) =>
				items.map((item) =>
					item.id === id ? { ...item, pinned } : item,
				),
			);

			try {
				const persisted = await persistRoomPin(actions, id, pinned);
				if (persisted) return;
				throw new Error("SEMOSS did not confirm the room pin change.");
			} catch (cause) {
				setSessions((items) =>
					items.map((item) =>
						item.id === id ? { ...item, pinned: !pinned } : item,
					),
				);
				toast.error(
					`Could not update the room pin. ${toError(cause).message}`,
				);
			}
		},
		[actions, setSessions],
	);

	const openRoom = useCallback(
		(id: string, itemId?: string) => {
			const room = sessions.find((item) => item.id === id);
			if (!room) return;
			updateRoom(id, { unread: false });
			navigate(roomPath(room.agentId, id, itemId));
		},
		[navigate, sessions, updateRoom],
	);

	const saveAgent = useCallback(
		async (agent: Agent, skillIds?: string[]) => {
			const draft = { ...toAgentDraft(agent), skillIds };
			const isExisting = agents.some(
				(candidate) => candidate.id === agent.id,
			);

			// A new agent carries a client-generated draft id, which the server
			// replaces with the id it assigns.
			if (isExisting) {
				await updateAgent(actions, agent.id, draft);
				refreshAgents();
				return agent.id;
			}

			const id = await createAgent(actions, draft);
			refreshAgents();
			return id;
		},
		[actions, agents, refreshAgents],
	);

	const startSession = useCallback(
		async (draft: { agentId: string; title: string }) => {
			const agent = agents.find(
				(candidate) => candidate.id === draft.agentId,
			);

			const roomId = await createRoom(actions, insightId, {
				workspaceId: draft.agentId,
				workspaceName: agent?.name ?? draft.agentId,
				instructions: agent?.instructions,
				name: draft.title,
			});

			addPendingRoom(pendingSession(roomId, draft.agentId, draft.title));
			setSetup(undefined);
			navigate(roomPath(draft.agentId, roomId));
		},
		[actions, addPendingRoom, agents, insightId, navigate],
	);

	const refresh = useCallback((key: string) => {
		setKeys((current) => refreshKey(current, key));
	}, []);

	const isEmptyLoad = isLoading && agents.length === 0;

	const context: MainContext = {
		keys,
		refresh,
		agents,
		sessions,
		setSessions,
		updateRoom,
		pinRoom: pinCurrentRoom,
		saveAgent,
		openRoom,
		newRoom: (id) => setSetup({ agentId: id }),
	};

	return (
		<MainProvider value={context}>
			<SidebarProvider
				open={sidebarOpen}
				onOpenChange={setSidebarOpen}
				data-slot="workspace-layout"
				className="-m-4 h-dvh overflow-hidden bg-background text-foreground"
				style={
					{
						"--sidebar-width": "16rem",
						"--sidebar-width-icon": "4rem",
					} as CSSProperties
				}
			>
				<Sidebar
					data-slot="workspace-sidebar"
					aria-label="Workspace navigation"
					collapsible="icon"
					className="motion-safe:transition-[left,right,width] motion-safe:duration-300 motion-safe:ease-in-out"
				>
					<WorkspaceSidebarNavigation
						agents={agents}
						sessions={sessions}
						agentId={agentId}
					/>
				</Sidebar>
				<SidebarInset className="h-dvh min-h-0 min-w-0 overflow-hidden rounded-none shadow-none">
					<header className="flex h-13 shrink-0 items-center gap-2 border-b px-3 md:hidden">
						<SidebarTrigger aria-label="Open workspace navigation" />
						<Link to="/" className="font-semibold text-lg">
							collaboration<span className="text-link">.</span>
						</Link>
					</header>
					<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
						{error ? (
							<EmptyView
								title="Could not load your agents"
								action={
									<Button
										onClick={() => refresh("agents")}
										type="button"
									>
										Try again
									</Button>
								}
							>
								{error.message}
							</EmptyView>
						) : isEmptyLoad ? (
							<div className="flex h-full w-full items-center justify-center py-4">
								<Spinner aria-label="Loading agents" />
							</div>
						) : (
							<Outlet />
						)}
						{setup && (
							<NewSessionDialog
								agents={agents}
								agentId={setup.agentId}
								onClose={() => setSetup(undefined)}
								onStart={startSession}
							/>
						)}
					</div>
				</SidebarInset>
			</SidebarProvider>
		</MainProvider>
	);
}
