import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useParams } from "react-router";
import { InsightContext, useInsight } from "@semoss/sdk/react";
import { Alert, AlertDescription, Button } from "@semoss/ui/next";
import { RoomLoading } from "@/features/rooms/components/room-loading";
import { RoomSessionView } from "@/features/rooms/components/room-session-view";
import { getRoomSession } from "@/features/rooms/room-session";
import { NotFoundPage } from "./not-found.page";

/** All saved conversations observe their actual room through one retained session. */
export function RoomPage({ roomId: suppliedRoomId }: { roomId?: string } = {}) {
	const { insightId: scope } = useInsight();
	const { roomId: routeRoomId } = useParams();
	const roomId = suppliedRoomId ?? routeRoomId ?? "";
	const session = useMemo(
		() => getRoomSession(scope, roomId),
		[scope, roomId],
	);
	const snapshot = useSyncExternalStore(
		session.subscribe,
		session.getSnapshot,
		session.getSnapshot,
	);
	useEffect(() => {
		if (!roomId) return;
		const release = session.retain();
		void session.initialize();
		return release;
	}, [roomId, session]);
	if (!roomId) return <NotFoundPage />;
	if (!snapshot.isReady)
		return snapshot.isLoading ? (
			<RoomLoading />
		) : (
			<div className="p-6">
				<Alert variant="destructive">
					<AlertDescription>
						{snapshot.error?.message ?? "The room is unavailable."}
					</AlertDescription>
					<Button
						className="mt-3"
						variant="outline"
						onClick={() => void session.initialize()}
					>
						Retry connection
					</Button>
				</Alert>
			</div>
		);
	const insight = session.insight;
	return (
		<InsightContext.Provider
			value={{
				isInitialized: insight.isInitialized,
				isReady: insight.isReady,
				isAuthorized: insight.isAuthorized,
				error: insight.error,
				system: insight.system,
				insightId: insight.insightId,
				actions: insight.actions,
			}}
		>
			<RoomSessionView session={session} snapshot={snapshot} />
		</InsightContext.Provider>
	);
}
