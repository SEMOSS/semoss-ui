import {
	type ReactNode,
	useEffect,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";
import { isRecord } from "@semoss/utility/object";
import { ROOM_HISTORY_CHANGED } from "@/features/rooms/api/list-rooms";
import { listRoomTopics } from "@/features/rooms/api/room-topics";
import type { InsightActions } from "@/lib/pixel";
import { RoomReadContext } from "./room-read.context";
import { RoomTreeContext } from "./room-tree.context";
import { createRoomTreeStore } from "./room-tree.store";
import {
	readRoomTreeActivity,
	recordRoomTreeActivity,
} from "./room-tree-activity";
import { ROOM_TREE_CHANGED } from "./room-tree-events";
import { createRoomReadState } from "./room-tree-read-state";

interface RoomTreeProviderProps {
	/** Transport for the current account and insight; key this provider by that scope. */
	actions: InsightActions;
	/** Parent insight scope; late saves from previous account sessions are ignored. */
	activityScope: string;
	/** Account/deployment-scoped recency storage; recreate this provider when scope changes. */
	activityStorageKey: string;
	/** Navigation and routes that share loaded room pages. */
	children: ReactNode;
}

/** One owner and two change signals keep desktop and mobile navigation synchronized. */
export function RoomTreeProvider({
	actions,
	activityScope,
	activityStorageKey,
	children,
}: RoomTreeProviderProps) {
	const actionsRef = useRef(actions);
	actionsRef.current = actions;
	const [activity] = useState(() => readRoomTreeActivity(activityStorageKey));
	const readStorageKey = `${activityStorageKey}:read`;
	const [readState] = useState(() => createRoomReadState(readStorageKey));
	const [store] = useState(() =>
		createRoomTreeStore(() => actionsRef.current, activity, readState),
	);
	const snapshot = useSyncExternalStore(
		store.subscribe,
		store.getSnapshot,
		store.getSnapshot,
	);
	useEffect(() => {
		const release = store.retain();
		const handleHistoryChanged = (event: Event): void => {
			if (event instanceof CustomEvent) {
				const detail: unknown = event.detail;
				if (
					!isRecord(detail) ||
					(detail.scope !== undefined &&
						detail.scope !== activityScope) ||
					(detail.actions !== undefined &&
						detail.actions !== actionsRef.current)
				)
					return;
				if (typeof detail.roomId === "string") {
					store.recordRoom({
						roomId: detail.roomId,
						...(typeof detail.roomName === "string"
							? { roomName: detail.roomName }
							: {}),
						...(typeof detail.dateUpdated === "string"
							? { dateUpdated: detail.dateUpdated }
							: {}),
						...(typeof detail.deleted === "boolean"
							? { deleted: detail.deleted }
							: {}),
						...(typeof detail.pinned === "boolean"
							? { pinned: detail.pinned }
							: {}),
					});
					if (detail.pinned === true)
						void listRoomTopics(actionsRef.current, detail.roomId)
							.then((topics) => {
								if (typeof detail.roomId === "string")
									store.recordTopics(detail.roomId, topics);
							})
							.catch(() => undefined);
				}
				if (
					isRecord(detail) &&
					detail.scope === activityScope &&
					typeof detail.roomId === "string" &&
					typeof detail.pinned === "boolean"
				)
					store.recordPin(detail.roomId, detail.pinned);
				if (
					isRecord(detail) &&
					detail.scope === activityScope &&
					recordRoomTreeActivity(activityStorageKey, activity, detail)
				) {
					const roomId = detail.roomId;
					const savedAt =
						typeof roomId === "string"
							? activity.get(roomId)
							: undefined;
					if (typeof roomId === "string" && savedAt)
						store.recordActivity(roomId, savedAt);
				}
			}
		};
		const handleStorage = (event: StorageEvent): void => {
			if (event.key === readStorageKey) store.syncReadState();
		};
		window.addEventListener(ROOM_HISTORY_CHANGED, handleHistoryChanged);
		const onTopics = (event: Event) => {
			if (
				event instanceof CustomEvent &&
				event.detail?.roomId &&
				(!event.detail.actions ||
					event.detail.actions === actionsRef.current) &&
				Array.isArray(event.detail.topics)
			)
				store.recordTopics(event.detail.roomId, event.detail.topics);
		};
		window.addEventListener(ROOM_TREE_CHANGED, onTopics);
		window.addEventListener("storage", handleStorage);
		return () => {
			window.removeEventListener(
				ROOM_HISTORY_CHANGED,
				handleHistoryChanged,
			);
			window.removeEventListener(ROOM_TREE_CHANGED, onTopics);
			window.removeEventListener("storage", handleStorage);
			release();
		};
	}, [store, activity, activityScope, activityStorageKey, readStorageKey]);
	return (
		<RoomTreeContext.Provider
			value={{
				...snapshot,
				refresh: store.refresh,
				loadMore: store.loadMore,
				retry: store.retry,
				scrollTop: store.scrollTop,
			}}
		>
			<RoomReadContext.Provider value={store}>
				{children}
			</RoomReadContext.Provider>
		</RoomTreeContext.Provider>
	);
}
