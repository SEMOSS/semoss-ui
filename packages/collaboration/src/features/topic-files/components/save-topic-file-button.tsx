import { useState } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
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
	DialogTrigger,
	Form,
	FormSelect,
	SelectItem,
	Spinner,
	toast,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { pixel } from "@/lib/pixel";
import { saveTopicFile } from "../api/topic-files";

const schema = z.object({ topicId: z.string().min(1, "Choose a topic.") });
const topicsSchema = z.object({
	items: z.array(z.object({ id: z.string(), name: z.string() })),
	total: z.number(),
});
type Values = z.infer<typeof schema>;
interface SaveTopicFileButtonProps {
	/** Owned room containing the attachment. */
	roomId: string;
	/** Saved relative attachment path and visible name. */
	filePath: string;
	fileName: string;
	/** Prevent changing context during a running turn. */
	isDisabled?: boolean;
}
/** Saves an existing chat attachment or context item to a chosen topic. */
export function SaveTopicFileButton({
	roomId,
	filePath,
	fileName,
	isDisabled = false,
}: SaveTopicFileButtonProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [offset, setOffset] = useState(0);
	const { actions } = useInsight();
	const form = useForm<Values>({
		resolver: zodResolver(schema),
		defaultValues: { topicId: "" },
	});
	const { isSubmitting, errors } = form.formState;
	const query = usePixel<unknown>(
		isOpen
			? pixel("BrainListTopics", {
					status: ["active", "dormant"],
					limit: 50,
					offset,
				})
			: "",
	);
	const parsed =
		query.status === "SUCCESS" ? topicsSchema.safeParse(query.data) : null;
	const topics = parsed?.success ? parsed.data.items : [];
	const handleClose = (next: boolean): void => {
		if (isSubmitting) return;
		setIsOpen(next);
		if (!next) {
			form.reset();
			setOffset(0);
		}
	};
	const handleSubmit = async ({ topicId }: Values): Promise<void> => {
		try {
			await saveTopicFile(actions, topicId, filePath, roomId);
		} catch (error: unknown) {
			form.setError("root.server", {
				message:
					error instanceof Error
						? error.message
						: "Could not save the file.",
			});
			return;
		}
		toast.success("File saved to topic");
		form.reset();
		setIsOpen(false);
		setOffset(0);
	};
	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogTrigger asChild>
				<Button
					type="button"
					size="sm"
					variant="ghost"
					disabled={isDisabled}
					aria-label={`Save ${fileName} to topic`}
				>
					Save to topic
				</Button>
			</DialogTrigger>
			<DialogContent
				showCloseButton={!isSubmitting}
				onEscapeKeyDown={(event) => {
					if (isSubmitting) event.preventDefault();
				}}
				onInteractOutside={(event) => {
					if (isSubmitting) event.preventDefault();
				}}
			>
				<DialogHeader>
					<DialogTitle>Save file to topic</DialogTitle>
					<DialogDescription className="break-all">
						Save a copy of {fileName} as a reference document.
					</DialogDescription>
				</DialogHeader>
				<Form
					form={form}
					onSubmit={handleSubmit}
					noValidate
					aria-busy={isSubmitting}
					className="space-y-4"
				>
					{query.status === "LOADING" && (
						<output>
							<Spinner />
							Loading topics…
						</output>
					)}
					{(query.status === "ERROR" ||
						(parsed && !parsed.success)) && (
						<Alert variant="destructive">
							<AlertDescription>
								Could not load topics.{" "}
								<Button
									type="button"
									variant="outline"
									onClick={query.refresh}
								>
									Retry
								</Button>
							</AlertDescription>
						</Alert>
					)}
					{parsed?.success && topics.length === 0 && (
						<Alert>
							<AlertDescription>
								No active or dormant topics. Create or restore a
								topic first.
							</AlertDescription>
						</Alert>
					)}
					<FormSelect
						name="topicId"
						label="Topic (required)"
						placeholder="Choose a topic"
						disabled={isSubmitting || topics.length === 0}
					>
						{topics.map((topic) => (
							<SelectItem key={topic.id} value={topic.id}>
								{topic.name}
							</SelectItem>
						))}
					</FormSelect>
					{parsed?.success && parsed.data.total > 50 && (
						<div className="flex flex-wrap gap-2">
							<Button
								type="button"
								variant="outline"
								disabled={isSubmitting || offset === 0}
								onClick={() => {
									form.setValue("topicId", "");
									setOffset((value) =>
										Math.max(0, value - 50),
									);
								}}
							>
								Previous topics
							</Button>
							<Button
								type="button"
								variant="outline"
								disabled={
									isSubmitting ||
									offset + 50 >= parsed.data.total
								}
								onClick={() => {
									form.setValue("topicId", "");
									setOffset((value) => value + 50);
								}}
							>
								Next topics
							</Button>
						</div>
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
							onClick={() => handleClose(false)}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting || topics.length === 0}
						>
							{isSubmitting && <Spinner />}
							{isSubmitting ? "Saving…" : "Save file"}
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
