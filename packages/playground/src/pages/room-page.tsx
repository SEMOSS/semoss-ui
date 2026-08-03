import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useStore } from "zustand";
import { useTranslation } from "@semoss/i18n";
import { InsightProvider } from "@semoss/sdk/react";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
	Spinner,
	toast,
} from "@semoss/ui/next";
import {
	FileDragOverlay,
	RoomContent,
	RoomSidebar,
	SaveWorkspaceDialog,
} from "@/components";
import { FileDragProvider } from "@/contexts";
import { useChat, useChatState, useGlobalBreadcrumbs, useRoot } from "@/hooks";
import type { RoomStore } from "@/stores";
import type { Engine } from "@/types";
/**
 * The page for a room
 *
 * @component
 */
export const RoomPage = () => {
	const { t } = useTranslation("workspace");
	const { setNavbarActions } = useGlobalBreadcrumbs({});
	const { roomId } = useParams();
	const { chat } = useChat();
	const chatModels = useChatState((s) => s.models);
	const { root } = useRoot();
	const navigate = useNavigate();

	const platformLinksDisabled =
		!root.getState().theme.featureFlags?.showPlatformLinks;

	/**
	 * State
	 */
	const [room, setRoom] = useState<RoomStore | null>(null);
	const selectedModelRef = useRef<Engine>(chatModels.selected);

	/**
	 * Library hooks
	 */
	// set the breadcrumbs (reactive to room state so we don't race with loadRoom)
	const workspace = room?.options?.workspace;
	useGlobalBreadcrumbs({
		breadcrumbs: [
			{
				name: t("breadcrumbs.home"),
				path: "/",
			},
			...(workspace?.workspace_id
				? [
						{
							name: t("breadcrumbs.agent"),
							path: platformLinksDisabled ? "" : "/agent",
						},
						{
							name: workspace.name || workspace.workspace_id,
							path: platformLinksDisabled
								? ""
								: `/agent/${workspace.workspace_id}`,
						},
					]
				: []),
			{
				name: room?.metadata?.name || t("breadcrumbs.room"),
				path: `/room/${roomId}`,
			},
		],
	});

	/**
	 * Effects
	 */
	// keep ref updated
	useEffect(() => {
		selectedModelRef.current = chatModels.selected;
	}, [chatModels.selected]);

	// load the room
	useEffect(() => {
		const loadRoom = async () => {
			// if chat isn't initialized yet, wait for it to initialize
			if (!chat.getState().isInitialized) {
				return;
			}

			// Reset room state when roomId changes to prevent stale content flash
			setRoom(null);
			try {
				if (!roomId) {
					navigate("/");
					return;
				}

				const room = await chat.getState().loadRoom(roomId);

				// update the model based on the room
				if (!room.model) {
					room.setModel(selectedModelRef.current);
				} else {
					chat.getState().setSelectedModel(room.model);
				}

				// set the room (breadcrumbs are driven reactively via useGlobalBreadcrumbs above)
				setRoom(room);
			} catch (e) {
				// if it doesn't load successfully, go back to home
				toast.error((e as Error).message);
				navigate("/");
			}
		};

		loadRoom();
	}, [
		roomId,
		navigate,
		chat.getState().loadRoom,
		chat.getState().setSelectedModel,
		chat.getState().isInitialized,
	]);

	const navbarActions = useMemo<React.ReactNode>(() => {
		if (room?.options) {
			return (
				<SaveWorkspaceDialog
					systemPrompt={room?.options?.instructions}
					mcps={room?.options?.mcp}
				/>
			);
		}
	}, [room?.options]);

	useEffect(() => {
		setNavbarActions(navbarActions);

		return () => {
			setNavbarActions(null);
		};
	}, [navbarActions, setNavbarActions]);

	// if there is no room, return null
	if (!room) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	return (
		<InsightProvider
			key={room.roomId}
			options={{ insightId: room.insightId }}
			destroyOnUnmount={false}
		>
			<RoomPageContent room={room} />
		</InsightProvider>
	);
};

const RoomPageContent = ({ room }: { room: RoomStore }) => {
	const sidebarIsOpen = useStore(room, (s) => s.sidebar.isOpen);

	return (
		<div className="flex h-full w-full flex-col overflow-hidden">
			<ResizablePanelGroup
				direction="horizontal"
				className="w-full flex-1 overflow-hidden"
			>
				<ResizablePanel className="h-full w-full flex-1 overflow-hidden p-2">
					<FileDragProvider>
						<FileDragOverlay />
						<RoomContent room={room} />
					</FileDragProvider>
				</ResizablePanel>
				{sidebarIsOpen && (
					<>
						<ResizableHandle />
						<ResizablePanel
							className={"relative p-2"}
							defaultSize={50}
							minSize={20}
						>
							<RoomSidebar room={room} />
						</ResizablePanel>
					</>
				)}
			</ResizablePanelGroup>
		</div>
	);
};
