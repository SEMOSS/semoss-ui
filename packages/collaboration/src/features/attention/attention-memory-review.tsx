import { useEffect, useRef, useState } from "react";
import {
	Button,
	Form,
	FormTextarea,
	P,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import type { Memory } from "@/features/collaboration/state/collaboration.types";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { MEMORY_MAX_CHARS } from "@/features/collaboration/state/memory";

const schema = z.object({
	text: z
		.string()
		.trim()
		.min(1, "Enter a memory.")
		.max(MEMORY_MAX_CHARS, `Keep this to ${MEMORY_MAX_CHARS} characters.`),
});

/** Keep, edit, or dismiss a suggestion through Brain's existing memory commands. */
export function AttentionMemoryReview({
	memory,
}: {
	/** Suggested memory under review. */ memory: Memory;
}) {
	const { dispatch } = useCollaborationSession();
	const [isEditing, setIsEditing] = useState(false);
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: { text: memory.text },
	});
	const editTrigger = useRef<HTMLButtonElement>(null);
	const wasEditing = useRef(false);
	const { setFocus } = form;
	useEffect(() => {
		if (isEditing) setFocus("text");
		else if (wasEditing.current) editTrigger.current?.focus();
		wasEditing.current = isEditing;
	}, [isEditing, setFocus]);
	return (
		<div className="space-y-4">
			<P className="text-muted-foreground text-sm">
				This suggestion won’t be used until you keep it.
			</P>
			{isEditing ? (
				<Form
					form={form}
					noValidate
					className="space-y-4"
					onSubmit={({ text }) =>
						dispatch({
							type: "memory.save",
							memory: { id: memory.id, text, kind: memory.kind },
						})
					}
				>
					<FormTextarea
						name="text"
						label="Memory"
						required
						maxLength={MEMORY_MAX_CHARS}
					/>
					<div className="flex flex-wrap justify-end gap-2">
						<Button
							type="button"
							variant="ghost"
							onClick={() => {
								setIsEditing(false);
								form.reset({ text: memory.text });
							}}
						>
							Cancel
						</Button>
						<Button type="submit">Save and keep</Button>
					</div>
				</Form>
			) : (
				<>
					<P className="whitespace-pre-wrap break-words text-sm leading-relaxed">
						{memory.text}
					</P>
					<div className="flex flex-wrap justify-end gap-2 border-t pt-4">
						<Button
							variant="ghost"
							className="pointer-coarse:min-h-11"
							onClick={() =>
								dispatch({
									type: "memory.resolve",
									memoryId: memory.id,
									action: "dismiss",
								})
							}
						>
							Dismiss
						</Button>
						<Button
							ref={editTrigger}
							variant="outline"
							className="pointer-coarse:min-h-11"
							onClick={() => {
								form.reset({ text: memory.text });
								setIsEditing(true);
							}}
						>
							Edit
						</Button>
						<Button
							className="pointer-coarse:min-h-11"
							onClick={() =>
								dispatch({
									type: "memory.resolve",
									memoryId: memory.id,
									action: "accept",
								})
							}
						>
							Keep memory
						</Button>
					</div>
				</>
			)}
		</div>
	);
}
