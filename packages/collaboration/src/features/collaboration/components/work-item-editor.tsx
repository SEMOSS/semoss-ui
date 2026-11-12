import { useId, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Button,
	Checkbox,
	FieldLegend,
	FieldSet,
	Form,
	FormField,
	FormInput,
	FormTextarea,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { saveWorkItem, type WorkItemRecord } from "../live/work-item-api";
import { useRecordIds } from "../live/work-updates.context";
import { useCollaborationSession } from "../state/collaboration-session.context";

const schema = z.object({
	title: z.string().trim().min(1, "Enter a title").max(255),
	description: z.string(),
	nextStep: z.string(),
	status: z.enum(["active", "waiting", "blocked", "done", "dropped"]),
	waitingOnPersonId: z.string(),
	due: z.string(),
	priority: z.string(),
	topicIds: z.array(z.string()),
	threadIds: z.array(z.string()),
});
type Values = z.infer<typeof schema>;

/** Edits one loaded record; failed saves preserve the owner's entered values. */
export function WorkItemEditor({
	item,
	onSaved,
	onCancel,
}: {
	/** Server record used as the edit baseline. */
	item: WorkItemRecord;
	/** Receives the confirmed record after persistence. */
	onSaved: (saved: WorkItemRecord) => void;
	/** Closes the editor without writing. */
	onCancel: () => void;
}) {
	const { actions } = useInsight();
	const { state } = useCollaborationSession();
	const { serverId, localId } = useRecordIds();
	const id = useId();
	const [threadSearch, setThreadSearch] = useState("");
	const form = useForm<Values>({
		resolver: zodResolver(schema),
		defaultValues: {
			title: item.title,
			description: item.description,
			nextStep: item.nextStep,
			status: item.status,
			waitingOnPersonId: localId(item.waitingOnPersonId),
			due: item.due.slice(0, 10),
			priority: item.priority,
			topicIds: item.topics.map((topic) => localId(topic.id)),
			threadIds: item.threads.map((thread) => localId(thread.threadId)),
		},
	});
	const { isSubmitting, errors } = form.formState;
	const topics = new Map(
		item.topics.map((topic) => [localId(topic.id), topic.name]),
	);
	for (const topic of state.topics) {
		if (
			!topic.isSample &&
			(topic.status === "active" ||
				topic.status === "hibernated" ||
				topic.status === "dormant" ||
				topics.has(topic.id))
		)
			topics.set(topic.id, topic.name);
	}
	const threads = new Map(
		item.threads.map((thread) => [
			localId(thread.threadId),
			thread.subject || "(no subject)",
		]),
	);
	for (const thread of state.threads)
		if (!thread.isSample)
			threads.set(thread.id, thread.subject || "(no subject)");
	const people = new Map(
		state.people
			.filter((person) => !person.isSample)
			.map((person) => [person.id, person.name]),
	);
	if (item.waitingOnPersonId && !people.has(localId(item.waitingOnPersonId)))
		people.set(localId(item.waitingOnPersonId), "Current person");

	const handleSubmit = async (values: Values): Promise<void> => {
		let saved: WorkItemRecord;
		try {
			const topicIds = await Promise.all(values.topicIds.map(serverId));
			const threadIds = await Promise.all(values.threadIds.map(serverId));
			saved = await saveWorkItem(actions, item.id, {
				...values,
				topicIds,
				threadIds,
				waitingOnPersonId: values.waitingOnPersonId
					? await serverId(values.waitingOnPersonId)
					: "",
				removeTopicIds: item.topics
					.map((topic) => topic.id)
					.filter((key) => !topicIds.includes(key)),
				removeThreadIds: item.threads
					.map((thread) => thread.threadId)
					.filter((key) => !threadIds.includes(key)),
			});
		} catch (cause: unknown) {
			form.setError("root.server", {
				message:
					cause instanceof Error
						? cause.message
						: "Unable to save work item",
			});
			return;
		}
		onSaved(saved);
	};

	return (
		<Form
			form={form}
			onSubmit={handleSubmit}
			aria-busy={isSubmitting}
			className="space-y-4"
			noValidate
		>
			<FormInput
				name="title"
				label="Title (required)"
				autoFocus
				required
				disabled={isSubmitting}
			/>
			<FormTextarea
				name="description"
				label="Description"
				disabled={isSubmitting}
			/>
			<FormInput
				name="nextStep"
				label="Next step"
				disabled={isSubmitting}
			/>
			<div className="grid gap-4 sm:grid-cols-2">
				<FormField
					control={form.control}
					name="status"
					render={({ field }) => (
						<div className="space-y-2">
							<Label htmlFor={`${id}-status`}>Status</Label>
							<Select
								value={field.value}
								onValueChange={field.onChange}
								disabled={isSubmitting}
							>
								<SelectTrigger
									id={`${id}-status`}
									ref={field.ref}
									onBlur={field.onBlur}
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{[
										"active",
										"waiting",
										"blocked",
										"done",
										"dropped",
									].map((status) => (
										<SelectItem key={status} value={status}>
											{status}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}
				/>
				<FormField
					control={form.control}
					name="waitingOnPersonId"
					render={({ field }) => (
						<div className="space-y-2">
							<Label htmlFor={`${id}-waiting`}>Waiting on</Label>
							<Select
								value={field.value || "none"}
								onValueChange={(value) =>
									field.onChange(
										value === "none" ? "" : value,
									)
								}
								disabled={isSubmitting}
							>
								<SelectTrigger
									id={`${id}-waiting`}
									ref={field.ref}
									onBlur={field.onBlur}
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">Nobody</SelectItem>
									{[...people].map(([key, name]) => (
										<SelectItem key={key} value={key}>
											{name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}
				/>
				<FormInput
					name="due"
					label="Due date"
					type="date"
					disabled={isSubmitting}
				/>
				<FormField
					control={form.control}
					name="priority"
					render={({ field }) => (
						<div className="space-y-2">
							<Label htmlFor={`${id}-priority`}>Priority</Label>
							<Select
								value={field.value || "none"}
								onValueChange={(value) =>
									field.onChange(
										value === "none" ? "" : value,
									)
								}
								disabled={isSubmitting}
							>
								<SelectTrigger
									id={`${id}-priority`}
									ref={field.ref}
									onBlur={field.onBlur}
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{["none", "low", "medium", "high"].map(
										(priority) => (
											<SelectItem
												key={priority}
												value={priority}
											>
												{priority === "none"
													? "No priority"
													: priority}
											</SelectItem>
										),
									)}
								</SelectContent>
							</Select>
						</div>
					)}
				/>
			</div>
			<FormField
				control={form.control}
				name="topicIds"
				render={({ field }) => (
					<FieldSet disabled={isSubmitting}>
						<FieldLegend>Topics</FieldLegend>
						<div className="max-h-48 space-y-2 overflow-y-auto">
							{[...topics].map(([key, name]) => (
								<label
									key={key}
									htmlFor={`${id}-topic-${key}`}
									className="flex min-h-8 items-center gap-2 text-sm"
								>
									<Checkbox
										id={`${id}-topic-${key}`}
										checked={field.value.includes(key)}
										onCheckedChange={(checked) =>
											field.onChange(
												checked === true
													? [...field.value, key]
													: field.value.filter(
															(value) =>
																value !== key,
														),
											)
										}
										disabled={isSubmitting}
									/>
									{name}
								</label>
							))}
							{topics.size === 0 && (
								<p className="text-muted-foreground text-sm">
									Create a topic from Work → Topics first.
								</p>
							)}
						</div>
					</FieldSet>
				)}
			/>
			<FormField
				control={form.control}
				name="threadIds"
				render={({ field }) => (
					<FieldSet disabled={isSubmitting}>
						<FieldLegend>Linked conversations</FieldLegend>
						<Label htmlFor={`${id}-search`}>
							Find a conversation
						</Label>
						<Input
							id={`${id}-search`}
							value={threadSearch}
							onChange={(event) =>
								setThreadSearch(event.target.value)
							}
							disabled={isSubmitting}
						/>
						<div className="max-h-48 space-y-2 overflow-y-auto">
							{[...threads]
								.filter(
									([key, subject]) =>
										field.value.includes(key) ||
										subject
											.toLocaleLowerCase()
											.includes(
												threadSearch.toLocaleLowerCase(),
											),
								)
								.map(([key, subject]) => (
									<label
										key={key}
										htmlFor={`${id}-thread-${key}`}
										className="flex min-h-8 items-center gap-2 text-sm"
									>
										<Checkbox
											id={`${id}-thread-${key}`}
											checked={field.value.includes(key)}
											onCheckedChange={(checked) =>
												field.onChange(
													checked === true
														? [...field.value, key]
														: field.value.filter(
																(value) =>
																	value !==
																	key,
															),
												)
											}
											disabled={isSubmitting}
										/>
										{subject}
									</label>
								))}
							{threads.size === 0 && (
								<p className="text-muted-foreground text-sm">
									No conversations are loaded.
								</p>
							)}
						</div>
					</FieldSet>
				)}
			/>
			{errors.root?.server?.message && (
				<Alert variant="destructive">
					<AlertDescription>
						{errors.root.server.message}
					</AlertDescription>
				</Alert>
			)}
			<div className="flex flex-wrap gap-2">
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? "Saving..." : "Save changes"}
				</Button>
				<Button
					type="button"
					variant="outline"
					disabled={isSubmitting}
					onClick={onCancel}
				>
					Cancel
				</Button>
			</div>
		</Form>
	);
}
