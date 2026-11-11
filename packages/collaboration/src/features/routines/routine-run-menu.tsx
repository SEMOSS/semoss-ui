import { MoreHorizontal, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Button,
	cn,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	P,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { ROOM_HISTORY_CHANGED } from "@/features/rooms/api/list-rooms";
import { roomPath } from "@/lib/workspace-paths";
import {
	deleteRoutineRun,
	ROUTINE_RUN_DELETED,
} from "./api/delete-routine-run";
import { ROUTINE_RUNS_CHANGED } from "./api/list-recent-routine-runs";

interface RoutineRunMenuProps {
	/** The routine the run belongs to. */
	routineId: string;
	/** The finished run the menu acts on. */
	runId: string;
	/** The routine's name and the run's start, as its row shows them. */
	routineName: string;
	when: string;
	/** Moves focus to a control that outlives the run's row, once the run is gone. */
	onDeleted: () => void;
	className?: string;
}

/** A finished run's "..." menu, in the sidebar and History, with Delete behind a confirmation. */
export function RoutineRunMenu({
	routineId,
	runId,
	routineName,
	when,
	onDeleted,
	className,
}: RoutineRunMenuProps) {
	const { actions } = useInsight();
	const { pathname } = useLocation();
	const navigate = useNavigate();
	const [isConfirming, setIsConfirming] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState("");
	const wasDeleted = useRef(false);

	const handleDelete = async (): Promise<void> => {
		setIsDeleting(true);
		setError("");
		let roomIds: string[] = [];
		try {
			roomIds = await deleteRoutineRun(actions, routineId, runId);
		} catch (cause) {
			setError(
				cause instanceof Error
					? cause.message
					: "The run could not be deleted. Try again.",
			);
			return;
		} finally {
			setIsDeleting(false);
		}
		wasDeleted.current = true;
		setIsConfirming(false);
		toast.success("Run deleted.");
		// its chats leave the chat list, and one that is open closes, as a closed chat does
		window.dispatchEvent(
			new CustomEvent(ROOM_HISTORY_CHANGED, {
				detail: { deletedRoomIds: roomIds },
			}),
		);
		if (roomIds.some((roomId) => pathname === roomPath(roomId)))
			void navigate("/");
	};

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						aria-label={`More actions for the ${routineName} run from ${when}`}
						className={cn(
							"pointer-coarse:size-11 size-6 text-muted-foreground",
							className,
						)}
					>
						<MoreHorizontal aria-hidden="true" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem
						variant="destructive"
						onSelect={() => setIsConfirming(true)}
					>
						<Trash2 aria-hidden="true" />
						Delete run
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<Dialog
				open={isConfirming}
				onOpenChange={(open) => {
					if (isDeleting) return;
					setIsConfirming(open);
					setError("");
				}}
			>
				<DialogContent
					showCloseButton={!isDeleting}
					onCloseAutoFocus={(event) => {
						if (!wasDeleted.current) return;
						// the row and this menu go when the list re-reads, so focus moves first
						event.preventDefault();
						wasDeleted.current = false;
						onDeleted();
						window.dispatchEvent(new Event(ROUTINE_RUNS_CHANGED));
						window.dispatchEvent(new Event(ROUTINE_RUN_DELETED));
					}}
				>
					<DialogHeader>
						<DialogTitle>Delete this run?</DialogTitle>
						<DialogDescription>
							The {routineName} run from {when} is removed from
							the routine's history, with the chats opened from
							it.
						</DialogDescription>
					</DialogHeader>
					{error && (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}
					<P className="text-muted-foreground text-sm">
						This cannot be undone.
					</P>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							disabled={isDeleting}
							onClick={() => setIsConfirming(false)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant="destructive"
							disabled={isDeleting}
							onClick={() => void handleDelete()}
						>
							{isDeleting && (
								<Spinner
									aria-hidden="true"
									data-icon="inline-start"
								/>
							)}
							{isDeleting ? "Deleting…" : "Delete run"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
