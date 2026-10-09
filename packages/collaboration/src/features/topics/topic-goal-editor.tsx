import type { RefObject } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Form,
	FormCheckbox,
	FormTextarea,
	Spinner,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { useWorkUpdates } from "@/features/collaboration/live/work-updates.context";
import type {
	Topic,
	TopicGoal,
} from "@/features/collaboration/state/collaboration.types";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { saveTopicGoal } from "./api/save-topic-goal";

const goalSchema = z.object({
	text: z.string().trim().min(1, "Enter a goal for this topic."),
	isDone: z.boolean(),
});

interface TopicGoalEditorProps {
	topic: Topic;
	goal?: TopicGoal;
	onClose: () => void;
	returnFocusRef: RefObject<HTMLButtonElement | null>;
}

/** Save a goal without discarding the draft when its write fails. */
export function TopicGoalEditor({
	topic,
	goal,
	onClose,
	returnFocusRef,
}: TopicGoalEditorProps) {
	const { actions } = useInsight();
	const { dispatch } = useCollaborationSession();
	const updates = useWorkUpdates();
	const form = useForm<z.infer<typeof goalSchema>>({
		resolver: zodResolver(goalSchema),
		defaultValues: {
			text: goal?.text ?? "",
			isDone: goal?.status === "done",
		},
	});
	const { isSubmitting, errors } = form.formState;
	const handleSubmit = async (
		values: z.infer<typeof goalSchema>,
	): Promise<void> => {
		const next = {
			noteId: goal?.noteId,
			text: values.text,
			status: values.isDone ? ("done" as const) : ("open" as const),
		};
		try {
			if (topic.isSample) {
				dispatch({
					type: "topic.note",
					topicId: topic.id,
					kind: "goal",
					operation: "save",
					...next,
				});
			} else {
				await updates?.settled?.();
				const saved = await saveTopicGoal(
					actions,
					updates?.serverId?.(topic.id) ?? topic.id,
					{
						...next,
						noteId: next.noteId
							? (updates?.serverId?.(next.noteId) ?? next.noteId)
							: undefined,
					},
				);
				dispatch({
					type: "topic.goal.received",
					topicId: topic.id,
					goal: {
						...saved,
						noteId:
							updates?.localId?.(saved.noteId) ?? saved.noteId,
					},
				});
			}
		} catch (cause: unknown) {
			form.setError("root.server", {
				message:
					cause instanceof Error
						? cause.message
						: "Could not save this goal. Try again.",
			});
			return;
		}
		onClose();
	};
	return (
		<Dialog
			open
			onOpenChange={(isOpen) => {
				if (!isOpen && !isSubmitting) onClose();
			}}
		>
			<DialogContent
				className="max-h-dvh overflow-y-auto"
				showCloseButton={!isSubmitting}
				onEscapeKeyDown={(event) => {
					if (isSubmitting) event.preventDefault();
				}}
				onInteractOutside={(event) => {
					if (isSubmitting) event.preventDefault();
				}}
				onCloseAutoFocus={(event) => {
					event.preventDefault();
					returnFocusRef.current?.focus();
				}}
			>
				<DialogHeader>
					<DialogTitle>
						{goal ? "Edit goal" : "Add a goal"}
					</DialogTitle>
					<DialogDescription>
						What would you like to accomplish in {topic.name}?
					</DialogDescription>
				</DialogHeader>
				<Form
					form={form}
					onSubmit={handleSubmit}
					className="space-y-4"
					noValidate
					aria-busy={isSubmitting}
				>
					<FormTextarea
						name="text"
						label="Goal (required)"
						required
						disabled={isSubmitting}
					/>
					<FormCheckbox
						name="isDone"
						label="Goal completed"
						disabled={isSubmitting}
					/>
					{errors.root?.server?.message && (
						<Alert variant="destructive">
							<AlertDescription>
								{errors.root.server.message}
							</AlertDescription>
						</Alert>
					)}
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							disabled={isSubmitting}
							onClick={onClose}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting && <Spinner aria-hidden="true" />}
							{isSubmitting ? "Saving…" : "Save goal"}
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
