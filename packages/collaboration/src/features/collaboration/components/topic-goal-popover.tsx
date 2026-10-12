import { Plus } from "lucide-react";
import { useId, useState } from "react";
import {
	Button,
	Form,
	FormTextarea,
	H3,
	P,
	Popover,
	PopoverContent,
	PopoverTrigger,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { useCollaborationSession } from "../state/collaboration-session.context";

const schema = z.object({ text: z.string().trim().min(1, "Enter a goal.") });

/** Adds a goal using the topic's existing session command. */
export function TopicGoalPopover({ topicId }: { topicId: string }) {
	const { dispatch } = useCollaborationSession();
	const [isOpen, setIsOpen] = useState(false);
	const fieldId = useId();
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: { text: "" },
	});
	const handleOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (!open) form.reset();
	};

	return (
		<Popover open={isOpen} onOpenChange={handleOpenChange}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="pointer-coarse:min-h-11 shrink-0 shadow-none"
				>
					<Plus aria-hidden="true" />
					Add goal
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="end"
				sideOffset={8}
				collisionPadding={16}
				aria-label="Add goal"
				aria-describedby={`${fieldId}-description`}
				className="max-h-(--radix-popover-content-available-height) w-96 max-w-(--radix-popover-content-available-width) overflow-y-auto rounded-xl p-0"
			>
				<Form
					form={form}
					noValidate
					onSubmit={({ text }) => {
						dispatch({
							type: "topic.note",
							topicId,
							kind: "goal",
							operation: "save",
							text,
							status: "open",
						});
						handleOpenChange(false);
					}}
				>
					<div className="space-y-4 p-5">
						<div className="space-y-1">
							<H3
								id={`${fieldId}-title`}
								className="font-bold text-lg"
							>
								New goal
							</H3>
							<P
								id={`${fieldId}-description`}
								className="text-muted-foreground text-sm leading-relaxed"
							>
								Describe the outcome you want to achieve.
							</P>
						</div>
						<FormTextarea
							name="text"
							aria-labelledby={`${fieldId}-title`}
							aria-describedby={`${fieldId}-description`}
							placeholder="e.g. Confirm travel details for the team"
							required
							disabled={form.formState.isSubmitting}
							className="[&_textarea]:max-h-60 [&_textarea]:min-h-28 [&_textarea]:resize-y [&_textarea]:rounded-lg [&_textarea]:bg-muted/40 [&_textarea]:leading-relaxed [&_textarea]:shadow-none [&_textarea]:focus-visible:border-primary [&_textarea]:focus-visible:ring-2 [&_textarea]:focus-visible:ring-primary/20"
						/>
					</div>
					<div className="flex flex-wrap items-center justify-end gap-2 border-t bg-muted/40 px-5 py-3">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="pointer-coarse:min-h-11"
							disabled={form.formState.isSubmitting}
							onClick={() => handleOpenChange(false)}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							size="sm"
							className="pointer-coarse:min-h-11"
							disabled={form.formState.isSubmitting}
						>
							<Plus aria-hidden="true" />
							Add goal
						</Button>
					</div>
				</Form>
			</PopoverContent>
		</Popover>
	);
}
