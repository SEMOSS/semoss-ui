import { Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import { Alert, AlertDescription, Button, Spinner } from "@semoss/ui/next";
import { ROOM_HISTORY_CHANGED } from "@/features/rooms/api/list-rooms";
import { roomPath } from "@/lib/workspace-paths";
import { openRoutineRoom } from "./api/open-routine-room";
import type { RoutineId } from "./routine-schema";

interface RoutineChatButtonProps {
	/** Routine whose saved output starts the conversation. */
	routineId: RoutineId;
	/** Identifies the displayed run so a newer result cannot silently replace it. */
	startedAt?: string;
	/** A past run whose output starts the conversation, instead of the latest. */
	runId?: string;
	/** The button text; "Ask Assistant" by default. */
	label?: string;
}

/** Opens a persisted conversation without rerunning the routine. */
export function RoutineChatButton({
	routineId,
	startedAt,
	runId,
	label = "Ask Assistant",
}: RoutineChatButtonProps) {
	const { actions } = useInsight();
	const navigate = useNavigate();
	const isMounted = useRef(false);
	const isPending = useRef(false);
	const [isOpening, setIsOpening] = useState(false);
	const [error, setError] = useState("");
	useEffect(() => {
		isMounted.current = true;
		return () => {
			isMounted.current = false;
		};
	}, []);

	const handleOpen = async (): Promise<void> => {
		if (isPending.current) return;
		isPending.current = true;
		setIsOpening(true);
		setError("");
		try {
			const roomId = await openRoutineRoom(
				actions,
				routineId,
				startedAt,
				runId,
			);
			window.dispatchEvent(
				new CustomEvent(ROOM_HISTORY_CHANGED, { detail: { roomId } }),
			);
			if (isMounted.current) void navigate(roomPath(roomId));
		} catch (cause) {
			if (isMounted.current)
				setError(
					cause instanceof Error
						? cause.message
						: "Could not open the chat. Try again.",
				);
		} finally {
			isPending.current = false;
			if (isMounted.current) setIsOpening(false);
		}
	};

	return (
		<div className="flex min-w-0 flex-col items-start gap-2">
			<Button
				type="button"
				variant="assistant"
				size="sm"
				disabled={isOpening}
				onClick={() => void handleOpen()}
			>
				{isOpening ? (
					<Spinner aria-hidden="true" data-icon="inline-start" />
				) : (
					<Sparkles aria-hidden="true" data-icon="inline-start" />
				)}
				{isOpening ? "Opening chat…" : label}
			</Button>
			<output className="sr-only">
				{isOpening ? "Opening chat…" : ""}
			</output>
			{error && (
				<Alert variant="destructive" className="max-w-sm">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
		</div>
	);
}
