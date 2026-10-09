import type { RefObject } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Form,
	FormInput,
	FormSelect,
	FormTextarea,
	SelectItem,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import type { Topic } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";

const schema = z.object({
	name: z.string().trim().min(1, "Name is required."),
	short: z.string().trim().min(1, "Short name is required."),
	description: z.string(),
	kind: z.enum(["client", "internal", "event", "personal"]),
	accountId: z.string(),
});

/** Edits an existing topic in the current session. */
export function TopicEditor({
	topic,
	onClose,
	returnFocusRef,
}: {
	topic: Topic;
	onClose: () => void;
	returnFocusRef: RefObject<HTMLButtonElement | null>;
}) {
	const { state, dispatch } = useCollaborationSession();
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: {
			name: topic.name,
			short: topic.short,
			description: topic.description,
			kind: topic.kind,
			accountId: topic.accountId ?? "none",
		},
	});
	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent
				className="max-h-dvh overflow-y-auto"
				onCloseAutoFocus={(event) => {
					event.preventDefault();
					returnFocusRef.current?.focus();
				}}
			>
				<DialogHeader>
					<DialogTitle>Edit topic</DialogTitle>
					<DialogDescription>
						Topics and edits are saved for this session.
					</DialogDescription>
				</DialogHeader>
				<Form
					form={form}
					className="space-y-4"
					onSubmit={(values) => {
						dispatch({
							type: "topic.save",
							topic: {
								...values,
								id: topic.id,
								accountId:
									values.accountId === "none"
										? null
										: values.accountId,
								isSample: topic.isSample,
							},
						});
						onClose();
					}}
				>
					<FormInput name="name" label="Name (required)" required />
					<FormInput
						name="short"
						label="Short name (required)"
						required
					/>
					<FormTextarea name="description" label="Description" />
					<FormSelect name="kind" label="Kind">
						<SelectItem value="internal">Internal</SelectItem>
						<SelectItem value="client">Client</SelectItem>
						<SelectItem value="event">Event</SelectItem>
						<SelectItem value="personal">Personal</SelectItem>
					</FormSelect>
					<FormSelect name="accountId" label="Account">
						<SelectItem value="none">No account</SelectItem>
						{state.accounts.map((account) => (
							<SelectItem key={account.id} value={account.id}>
								{account.name}
							</SelectItem>
						))}
					</FormSelect>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
						>
							Cancel
						</Button>
						<Button type="submit">Save topic</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
