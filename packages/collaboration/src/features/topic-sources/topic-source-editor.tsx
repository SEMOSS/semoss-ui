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
	P,
	Spinner,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import {
	saveTopicSource,
	type TopicSource,
	type TopicSourceDetail,
} from "./topic-sources.api";

const schema = z.object({
	title: z.string().trim().min(1, "Enter a title.").max(250),
	content: z.string().max(120000, "Keep the text under 120,000 characters."),
	url: z.string().refine((value) => {
		if (!value) return true;
		try {
			return ["https:", "http:"].includes(new URL(value).protocol);
		} catch {
			return false;
		}
	}, "Enter an http or https URL."),
});

interface TopicSourceEditorProps {
	topicId: string;
	kind: TopicSource["kind"];
	source?: TopicSourceDetail;
	/** Receives the saved id, or no argument on cancellation. */
	onSubmit: (id?: string) => void;
}

/** Edit a reference without overwriting unsaved text on background refresh. */
export function TopicSourceEditor({
	topicId,
	kind,
	source,
	onSubmit,
}: TopicSourceEditorProps) {
	const { actions } = useInsight();
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: {
			title: source?.title ?? "",
			content: source?.content ?? "",
			url: source?.url ?? "",
		},
	});
	const { isSubmitting, errors } = form.formState;
	const handleSubmit = async (
		values: z.infer<typeof schema>,
	): Promise<void> => {
		if (kind === "note" && !values.content.trim()) {
			form.setError("content", { message: "Enter a note." });
			return;
		}
		if (kind === "link" && !values.url) {
			form.setError("url", { message: "Enter a URL." });
			return;
		}
		let id: string;
		try {
			id = await saveTopicSource(actions, {
				topicId,
				sourceId: source?.sourceId,
				expectedVersion: source?.version,
				kind,
				title: values.title,
				...(kind !== "document" ? { content: values.content } : {}),
				...(kind === "link" ? { url: values.url } : {}),
			});
		} catch (cause) {
			form.setError("root.server", {
				message:
					cause instanceof Error
						? cause.message
						: "Could not save this source.",
			});
			return;
		}
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
				className="max-h-dvh overflow-y-auto"
				showCloseButton={!isSubmitting}
				onEscapeKeyDown={(event) => {
					if (isSubmitting) event.preventDefault();
				}}
				onInteractOutside={(event) => {
					if (isSubmitting) event.preventDefault();
				}}
			>
				<DialogHeader>
					<DialogTitle>
						{source
							? "Edit source"
							: kind === "link"
								? "Add a link"
								: "Add a note"}
					</DialogTitle>
					<DialogDescription>
						{source && (source.topicIds?.length ?? 0) > 1
							? "Changes apply to every topic using this source. Earlier answers keep their source version."
							: "Available to the assistant in chats linked to this topic."}
					</DialogDescription>
				</DialogHeader>
				<Form
					form={form}
					onSubmit={handleSubmit}
					noValidate
					aria-busy={isSubmitting}
					className="space-y-4"
				>
					<FormInput
						name="title"
						label="Title (required)"
						required
						disabled={isSubmitting}
					/>
					{kind === "link" && (
						<FormInput
							name="url"
							label="URL (required)"
							required
							type="url"
							disabled={isSubmitting}
						/>
					)}
					{kind !== "document" && (
						<FormTextarea
							name="content"
							label={
								kind === "note"
									? "Note (required)"
									: "Reference text"
							}
							required={kind === "note"}
							rows={8}
							disabled={isSubmitting}
							description={
								kind === "link"
									? "Paste the relevant text for the assistant. Adding a URL does not import the page or grant access to it."
									: undefined
							}
						/>
					)}
					{kind === "document" && (
						<P className="text-muted-foreground text-sm">
							The uploaded document is saved with this source.
							Upload a replacement from its source details.
						</P>
					)}
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
							onClick={() => onSubmit()}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting && <Spinner />}
							{isSubmitting ? "Saving…" : "Save source"}
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
