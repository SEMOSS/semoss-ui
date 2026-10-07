import { Circle, Plus } from "lucide-react";
import { useId } from "react";
import {
	Button,
	Form,
	FormField,
	Input,
	Label,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { useCollaborationSession } from "../state/collaboration-session.context";

const entrySchema = z.object({
	text: z.string().trim().max(2000, "Use 2,000 characters or fewer."),
});

/** An always-empty reminder row supports rapid keyboard entry without opening an editor. */
export function ActionItemEntry({ threadId }: { threadId: string }) {
	const { dispatch } = useCollaborationSession();
	const id = useId();
	const form = useForm<z.infer<typeof entrySchema>>({
		resolver: zodResolver(entrySchema),
		defaultValues: { text: "" },
	});
	const hasText = Boolean(form.watch("text").trim());
	return (
		<Form
			form={form}
			noValidate
			className="flex items-center gap-2"
			onSubmit={({ text }) => {
				if (!text) return;
				dispatch({ type: "item.create", threadId, text });
				form.reset({ text: "" });
				form.setFocus("text");
			}}
		>
			<Circle
				className="size-4 shrink-0 text-muted-foreground"
				aria-hidden="true"
			/>
			<FormField
				name="text"
				render={({ field, fieldState }) => (
					<div className="min-w-0 flex-1">
						<Label htmlFor={id} className="sr-only">
							Add an action item
						</Label>
						<Input
							{...field}
							id={id}
							placeholder="Add an action item"
							autoComplete="off"
							className="border-transparent bg-transparent px-0 shadow-none focus-visible:px-2"
							aria-invalid={Boolean(fieldState.error)}
							aria-describedby={
								fieldState.error ? `${id}-error` : undefined
							}
							onKeyDown={(event) => {
								if (
									event.key === "Enter" &&
									event.nativeEvent.isComposing
								)
									event.preventDefault();
							}}
						/>
						{fieldState.error && (
							<span
								id={`${id}-error`}
								role="alert"
								className="text-destructive text-sm"
							>
								{fieldState.error.message}
							</span>
						)}
					</div>
				)}
			/>
			{hasText && (
				<Button
					type="submit"
					variant="ghost"
					size="icon-sm"
					className="pointer-coarse:size-11"
					aria-label="Add action item"
				>
					<Plus aria-hidden="true" />
				</Button>
			)}
		</Form>
	);
}
