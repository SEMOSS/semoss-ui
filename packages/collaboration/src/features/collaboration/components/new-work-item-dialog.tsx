import { Plus } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Input,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
} from "@semoss/ui/next";
import { createWorkItem } from "../api/work-items";
import { useCollaborationSession } from "../state/collaboration-session.context";

const NO_TOPIC = "none";

/** "New work item": asks for a name (and a topic, when there are any), makes the item, then tells the list. */
export function NewWorkItemDialog({ onCreated }: { onCreated: () => void }) {
	const { actions } = useInsight();
	const { state } = useCollaborationSession();
	const [isOpen, setIsOpen] = useState(false);
	const [title, setTitle] = useState("");
	const [topicId, setTopicId] = useState(NO_TOPIC);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState("");
	const topics = state.topics;
	const handleOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (open) {
			setTitle("");
			setTopicId(NO_TOPIC);
			setError("");
		}
	};
	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();
		const name = title.trim();
		if (!name) return;
		setIsSaving(true);
		setError("");
		try {
			await createWorkItem(actions, {
				title: name,
				topicId: topicId === NO_TOPIC ? undefined : topicId,
			});
			setIsOpen(false);
			onCreated();
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : String(cause));
		} finally {
			setIsSaving(false);
		}
	};
	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="pointer-coarse:min-h-11 text-foreground"
				>
					<Plus aria-hidden="true" />
					New work item
				</Button>
			</DialogTrigger>
			<DialogContent>
				<form className="space-y-4" onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>New work item</DialogTitle>
						<DialogDescription>
							Name the outcome you are working toward. Add steps
							once it is made.
						</DialogDescription>
					</DialogHeader>
					<Input
						autoFocus
						aria-label="Work item name"
						placeholder="Ship the 6.0.0 release"
						value={title}
						onChange={(event) => setTitle(event.target.value)}
					/>
					{topics.length ? (
						<Select value={topicId} onValueChange={setTopicId}>
							<SelectTrigger
								aria-label="Topic"
								className="w-full"
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={NO_TOPIC}>
									No topic
								</SelectItem>
								{topics.map((topic) => (
									<SelectItem key={topic.id} value={topic.id}>
										{topic.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					) : null}
					{error ? (
						<P role="alert" className="text-destructive text-sm">
							The work item was not made: {error}
						</P>
					) : null}
					<DialogFooter className="flex-col sm:flex-row">
						<Button
							type="button"
							variant="outline"
							disabled={isSaving}
							onClick={() => setIsOpen(false)}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isSaving || !title.trim()}
						>
							{isSaving && <Spinner className="size-4" />}
							Make work item
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
