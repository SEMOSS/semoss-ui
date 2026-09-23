import {
	type CSSProperties,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
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
import { roomsKey } from "@/features/agents/api/refresh-keys";
import { useSaveAgent } from "@/features/agents/api/use-save-agent";
import { useWorkspaceData } from "@/features/agents/api/use-workspace-data";
import { pinRoom as persistRoomPin } from "@/features/rooms/api/pin-room";
import { waitForGeneratedRoomName } from "@/features/rooms/api/wait-for-generated-room-name";
import { toError } from "@/lib/pixel";
import { newRoomPath, roomPath } from "@/lib/workspace-paths";
import type { Agent } from "@/types/agent";
import type { Session } from "@/types/session";

function WorkspaceSidebarNavigation({
	agents,
	sessions,
	agentId,
	roomId,
	isLoading,
	onNewSession,
	onRouteVisited,
	onRoomVisited,
}: {
	agents: Agent[];
	sessions: Session[];
	agentId?: string;
	roomId?: string;
	isLoading: boolean;
	onNewSession: (agentId?: string) => void;
	onRouteVisited: (path: string) => void;
	onRoomVisited: (roomId: string) => void;
}) {
	const { isMobile, state } = useSidebar();
	const condensed = !isMobile && state === "collapsed";

	return (
		<>
			<SidebarHeader condensed={condensed} />
			<SidebarContent className="px-3">
				<SidebarAgentsList
					agents={agents}
					sessions={sessions}
					activeAgentId={agentId}
					activeRoomId={roomId}
					isLoading={isLoading}
					onNewSession={onNewSession}
					onRouteVisited={onRouteVisited}
					onRoomVisited={onRoomVisited}
				/>
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
	const { agentId, roomId } = useParams();
	const { actions } = useInsight();
	const [keys, setKeys] = useState<MainContext["keys"]>({});
	const workspaceData = useWorkspaceData(keys);
	const { agents, sessions, setSessions, addPendingRoom, isLoading, error } =
		workspaceData;
	const roomNameWatchers = useRef(new Map<string, AbortController>());

	const openNewSession = useCallback(
		(newSessionAgentId?: string) => {
			navigate(newRoomPath(newSessionAgentId));
		},
		[navigate],
	);
	const openRoute = useCallback(
		(path: string) => {
			navigate(path);
		},
		[navigate],
	);

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

	useEffect(
		() => () => {
			for (const controller of roomNameWatchers.current.values()) {
				controller.abort();
			}
			roomNameWatchers.current.clear();
		},
		[],
	);

	const trackGeneratedRoomName = useCallback(
		(roomAgentId: string, roomId: string) => {
			if (roomNameWatchers.current.has(roomId)) return;
			const controller = new AbortController();
			roomNameWatchers.current.set(roomId, controller);
			void waitForGeneratedRoomName(actions, roomId, {
				signal: controller.signal,
			})
				.then((name) => {
					if (!name || controller.signal.aborted) return;
					updateRoom(roomId, { title: name });
					setKeys((current) =>
						refreshKey(current, roomsKey(roomAgentId)),
					);
				})
				.catch(() => {
					// Naming is best-effort and the settled-run refresh remains a fallback.
				})
				.finally(() => {
					if (roomNameWatchers.current.get(roomId) === controller) {
						roomNameWatchers.current.delete(roomId);
					}
				});
		},
		[actions, updateRoom],
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
			navigate(roomPath(id, itemId));
		},
		[navigate, sessions, updateRoom],
	);

	const saveAgent = useSaveAgent({
		actions,
		agents,
		onSaved: refreshAgents,
	});

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
		addPendingRoom,
		updateRoom,
		trackGeneratedRoomName,
		pinRoom: pinCurrentRoom,
		saveAgent,
		openRoom,
		newRoom: openNewSession,
	};

	return (
		<MainProvider value={context}>
			<SidebarProvider
				open={sidebarOpen}
				onOpenChange={setSidebarOpen}
				data-slot="workspace-layout"
				className="-m-4 h-dvh w-auto overflow-hidden bg-background text-foreground"
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
						roomId={roomId}
						isLoading={isLoading}
						onNewSession={openNewSession}
						onRouteVisited={openRoute}
						onRoomVisited={openRoom}
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
					</div>
				</SidebarInset>
			</SidebarProvider>
		</MainProvider>
	);
}
