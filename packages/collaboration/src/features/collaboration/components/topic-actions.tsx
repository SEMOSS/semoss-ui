import { MoreHorizontal } from "lucide-react";
import { useId, useState } from "react";
import { useNavigate } from "react-router";
import {
	Button,
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
	Label,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	toast,
} from "@semoss/ui/next";
import type { Topic } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";

/** Merge this topic into another one, or delete it; both can be undone. */
export function TopicActions({
	topic,
	threadCount,
}: {
	topic: Topic;
	threadCount: number;
}) {
	const { state, dispatch, undo } = useCollaborationSession();
	const navigate = useNavigate();
	const fieldId = useId();
	const [dialog, setDialog] = useState<"merge" | "delete" | null>(null);
	const [targetId, setTargetId] = useState("");
	// the reducer only merges records of the same kind (sample or live)
	const targets = state.topics.filter(
		(other) => other.id !== topic.id && other.isSample === topic.isSample,
	);
	const target = targets.find((other) => other.id === targetId);
	const undoAction = { label: "Undo", onClick: undo };
	const close = () => {
		setDialog(null);
		setTargetId("");
	};

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="outline"
						size="icon-sm"
						aria-label="More topic actions"
					>
						<MoreHorizontal aria-hidden="true" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem
						disabled={!targets.length}
						onSelect={() => setDialog("merge")}
					>
						Merge into another topic...
					</DropdownMenuItem>
					<DropdownMenuItem
						variant="destructive"
						onSelect={() => setDialog("delete")}
					>
						Delete topic
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<Dialog
				open={dialog === "merge"}
				onOpenChange={(open) => {
					if (!open) close();
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Merge {topic.name}</DialogTitle>
						<DialogDescription>
							Its {threadCount} threads, people, goals, notes,
							keywords, and rules move to the topic you pick, and{" "}
							{topic.name} is removed.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-2">
						<Label htmlFor={`${fieldId}-target`}>Merge into</Label>
						<Select value={targetId} onValueChange={setTargetId}>
							<SelectTrigger id={`${fieldId}-target`}>
								<SelectValue placeholder="Choose a topic" />
							</SelectTrigger>
							<SelectContent>
								{targets.map((other) => (
									<SelectItem key={other.id} value={other.id}>
										{other.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<P className="text-muted-foreground text-sm">
						You can undo this with Undo.
					</P>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={close}>
							Cancel
						</Button>
						<Button
							type="button"
							disabled={!target}
							onClick={() => {
								if (!target) return;
								dispatch({
									type: "topic.merge",
									sourceId: topic.id,
									targetId: target.id,
								});
								close();
								toast.success(
									`Merged ${topic.name} into ${target.name}.`,
									{ action: undoAction },
								);
								navigate(
									`/brain/topics/${encodeURIComponent(target.id)}`,
								);
							}}
						>
							Merge
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			<Dialog
				open={dialog === "delete"}
				onOpenChange={(open) => {
					if (!open) close();
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete {topic.name}?</DialogTitle>
						<DialogDescription>
							Its goals, notes, people, and rules are removed, and{" "}
							{threadCount} threads lose this topic. The threads
							themselves stay.
						</DialogDescription>
					</DialogHeader>
					<P className="text-muted-foreground text-sm">
						You can undo this with Undo.
					</P>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={close}>
							Cancel
						</Button>
						<Button
							type="button"
							variant="destructive"
							onClick={() => {
								dispatch({
									type: "topic.delete",
									topicId: topic.id,
								});
								close();
								toast.success(`Deleted ${topic.name}.`, {
									action: undoAction,
								});
								navigate("/brain");
							}}
						>
							Delete topic
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
