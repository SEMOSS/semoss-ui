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
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { toError } from "@semoss/utility";
import type { MainContext } from "@/app/main.context";
import { MainProvider } from "@/app/main.context";
import { refreshKey } from "@/app/refresh-keys";
import { EmptyView } from "@/components/common/empty-view";
import { WorkspaceSidebarNavigation } from "@/components/sidebar/workspace-sidebar-navigation";
import { roomsKey } from "@/features/agents/api/refresh-keys";
import { useSaveAgent } from "@/features/agents/api/use-save-agent";
import { useWorkspaceData } from "@/features/agents/api/use-workspace-data";
import { deleteRoom as persistRoomDelete } from "@/features/rooms/api/delete-room";
import { pinRoom as persistRoomPin } from "@/features/rooms/api/pin-room";
import { renameRoom as persistRoomRename } from "@/features/rooms/api/rename-room";
import { waitForGeneratedRoomName } from "@/features/rooms/api/wait-for-generated-room-name";
import { newRoomPath, roomPath } from "@/lib/workspace-paths";

/**
 * Composes the agents and rooms features into the workspace shell, owns the
 * shared main context, and frames the left-rail navigation.
 */
export function MainLayout() {
	const navigate = useNavigate();
	const { roomId } = useParams();
	const { actions } = useInsight();
	const [keys, setKeys] = useState<MainContext["keys"]>({});
	const workspaceData = useWorkspaceData(keys);
	const {
		agents,
		sessions,
		setSessions,
		addPendingRoom,
		updateRoom,
		removeRoom,
		refreshRooms,
		agentsIsLoading,
		roomsIsLoading,
		error,
	} = workspaceData;
	const roomNameWatchers = useRef(new Map<string, AbortController>());

	const openNewSession = useCallback(
		(newSessionAgentId?: string) => {
			navigate(newRoomPath(newSessionAgentId));
		},
		[navigate],
	);
	const [sidebarOpen, setSidebarOpen] = useState(true);

	const refreshAgents = useCallback(() => {
		setKeys((current) => refreshKey(current, "agents"));
	}, []);

	const stopRoomNameWatcher = useCallback((id: string): void => {
		roomNameWatchers.current.get(id)?.abort();
		roomNameWatchers.current.delete(id);
	}, []);

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

	const renameSidebarRoom = useCallback(
		async (id: string, name: string): Promise<void> => {
			await persistRoomRename(actions, id, name);
			stopRoomNameWatcher(id);
			updateRoom(id, { title: name });
		},
		[actions, stopRoomNameWatcher, updateRoom],
	);

	const deleteSidebarRoom = useCallback(
		async (id: string): Promise<void> => {
			await persistRoomDelete(actions, id);
			stopRoomNameWatcher(id);
			removeRoom(id);
			if (roomId === id) openNewSession();
		},
		[actions, openNewSession, removeRoom, roomId, stopRoomNameWatcher],
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

	const isEmptyLoad = agentsIsLoading && agents.length === 0;

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
						sessions={sessions}
						roomId={roomId}
						isLoading={roomsIsLoading}
						onRoomPin={pinCurrentRoom}
						onRoomRename={renameSidebarRoom}
						onRoomDelete={deleteSidebarRoom}
						onRoomVisited={openRoom}
					/>
				</Sidebar>
				<SidebarInset className="h-dvh min-h-0 min-w-0 overflow-hidden rounded-none shadow-none">
					<header className="flex h-13 shrink-0 items-center gap-2 border-b px-3 md:hidden">
						<SidebarTrigger aria-label="Open workspace navigation" />
						<Link to="/" className="font-semibold text-lg">
							collaboration<span className="text-primary">.</span>
						</Link>
					</header>
					<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
						{error ? (
							<EmptyView
								title="Could not load workspace data"
								action={
									<Button
										onClick={() => {
											refresh("agents");
											refreshRooms();
										}}
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
