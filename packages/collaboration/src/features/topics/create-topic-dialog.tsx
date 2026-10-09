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
	FormInput,
	FormTextarea,
	Spinner,
	toast,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { ROOM_TREE_CHANGED } from "@/features/room-tree/room-tree-events";
import { createTopic } from "./api/topic-api";

const schema = z.object({
	name: z.string().trim().min(1, "Name is required."),
	description: z.string(),
});
type CreateTopicValues = z.infer<typeof schema>;

interface CreateTopicDialogProps {
	/** Receives the saved topic ID, or no argument when cancelled. */
	onSubmit: (id?: string) => void;
	/** Programmatically opened dialogs restore their originating control. */
	returnFocusRef: RefObject<HTMLButtonElement | null>;
}

/** Create a topic with durable success, retained errors, and protected pending dismissal. */
export function CreateTopicDialog({
	onSubmit,
	returnFocusRef,
}: CreateTopicDialogProps) {
	const { actions } = useInsight();
	const { dispatch } = useCollaborationSession();
	const form = useForm<CreateTopicValues>({
		resolver: zodResolver(schema),
		defaultValues: { name: "", description: "" },
	});
	const { errors, isSubmitting } = form.formState;
	const handleSubmit = async (values: CreateTopicValues): Promise<void> => {
		let id: string;
		try {
			const topic = await createTopic(actions, values);
			dispatch({ type: "topic.received", topic });
			id = topic.id;
		} catch (error: unknown) {
			form.setError("root.server", {
				type: "server",
				message:
					error instanceof Error
						? error.message
						: "Could not create this topic.",
			});
			return;
		}
		window.dispatchEvent(new Event(ROOM_TREE_CHANGED));
		toast.success("Topic created");
		onSubmit(id);
	};
	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open && !isSubmitting) onSubmit();
			}}
		>
			<DialogContent
				showCloseButton={!isSubmitting}
				className="max-h-dvh min-w-0 overflow-y-auto motion-reduce:data-[state=closed]:animate-none motion-reduce:data-[state=open]:animate-none"
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
					<DialogTitle>Create topic</DialogTitle>
					<DialogDescription>
						Give related work a place of its own.
					</DialogDescription>
				</DialogHeader>
				<Form
					form={form}
					onSubmit={handleSubmit}
					noValidate
					aria-busy={isSubmitting}
					className="flex min-w-0 flex-col gap-4"
				>
					<FormInput
						name="name"
						className="[&_input]:min-h-11 sm:[&_input]:min-h-9"
						label="Name (required)"
						required
						autoComplete="off"
						disabled={isSubmitting}
					/>
					<FormTextarea
						name="description"
						label="Description (optional)"
						disabled={isSubmitting}
					/>
					{errors.root?.server?.message && (
						<Alert variant="destructive">
							<AlertDescription>
								{errors.root.server.message}
							</AlertDescription>
						</Alert>
					)}
					<DialogFooter className="flex-col sm:flex-row">
						<Button
							type="button"
							className="min-h-11 sm:min-h-9"
							variant="outline"
							disabled={isSubmitting}
							onClick={() => onSubmit()}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							className="min-h-11 sm:min-h-9"
							disabled={isSubmitting}
						>
							{isSubmitting && <Spinner className="size-4" />}
							{isSubmitting ? "Creating…" : "Create topic"}
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
