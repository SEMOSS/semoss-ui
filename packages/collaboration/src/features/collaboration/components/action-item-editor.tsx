import {
	Button,
	Form,
	FormInput,
	FormSelect,
	SelectItem,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import type { Thread, WorkspaceStep } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";

const editSchema = z.object({
	text: z.string().trim().min(1, "Enter an action item.").max(2000),
	due: z.string(),
	ownerId: z.string().min(1),
});

/** Inline editing preserves identity, completion and suggestion state. */
export function ActionItemEditor({
	thread,
	step,
	onClose,
}: {
	thread: Thread;
	step: WorkspaceStep;
	onClose: () => void;
}) {
	const { state, dispatch } = useCollaborationSession();
	const form = useForm<z.infer<typeof editSchema>>({
		resolver: zodResolver(editSchema),
		defaultValues: {
			text: step.text,
			due: step.due?.slice(0, 10) ?? "",
			ownerId: step.ownerId,
		},
	});
	const owners = new Map([
		[
			step.ownerId,
			state.people.find((person) => person.id === step.ownerId)?.name ||
				"You",
		],
		[state.liveProfile?.id ?? "me", "You"],
		...thread.participants.map(
			(person) =>
				[
					person.personId,
					person.personId === "me" ||
					person.personId === state.liveProfile?.id
						? "You"
						: state.people.find(
								(candidate) => candidate.id === person.personId,
							)?.name ||
							person.name ||
							person.email ||
							"Participant",
				] as const,
		),
	]);
	return (
		<Form
			form={form}
			noValidate
			className="space-y-3 py-2"
			onKeyDown={(event) => {
				if (event.key === "Escape") {
					event.preventDefault();
					event.stopPropagation();
					onClose();
				}
			}}
			onSubmit={(values) => {
				dispatch({
					type: "workspace.step",
					threadId: thread.id,
					operation: "save",
					step: {
						id: step.id,
						...values,
						due: values.due || null,
						...(step.status === "open" || step.status === "waiting"
							? {
									status:
										values.ownerId === "me" ||
										values.ownerId === "live-me" ||
										values.ownerId === state.liveProfile?.id
											? "open"
											: "waiting",
								}
							: {}),
						isUserEdited: true,
					},
				});
				onClose();
			}}
		>
			<FormInput name="text" label="Action item" required autoFocus />
			<FormInput name="due" label="Due date" type="date" />
			<FormSelect name="ownerId" label="Owner">
				{[...owners].map(([id, name]) => (
					<SelectItem key={id} value={id}>
						{name}
					</SelectItem>
				))}
			</FormSelect>
			<div className="flex flex-wrap gap-2">
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={onClose}
				>
					Cancel
				</Button>
				<Button type="submit" size="sm">
					Save
				</Button>
			</div>
		</Form>
	);
}
