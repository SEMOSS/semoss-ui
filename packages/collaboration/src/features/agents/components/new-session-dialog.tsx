import { Plus } from "lucide-react";
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
	FormSelect,
	FormSelectItem,
	Spinner,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { AgentAvatar } from "@/components/common/agent-avatar";
import { toError } from "@/lib/pixel";
import type { Agent } from "@/types/agent";

const newSessionSchema = z.object({
	agentId: z.string().min(1, "Choose an agent."),
	title: z.string().trim().min(1, "Enter a topic.").max(160),
});

type NewSessionValues = z.infer<typeof newSessionSchema>;

/**
 * Collects the agent and topic for a new room.
 *
 * The room itself is created by the caller, because only the server can assign
 * a room id.
 */
export function NewSessionDialog({
	agents,
	agentId,
	onClose,
	onStart,
}: {
	/** Agents that can be chosen. */
	agents: Agent[];
	/** Pre-selected agent, when started from an agent's own screen. */
	agentId?: string;
	onClose: () => void;
	/** Create the room. Resolves once it exists and navigation has happened. */
	onStart: (draft: { agentId: string; title: string }) => Promise<void>;
}) {
	const form = useForm<NewSessionValues>({
		resolver: zodResolver(newSessionSchema),
		defaultValues: { agentId: agentId ?? "", title: "" },
	});
	const { errors, isSubmitting } = form.formState;
	const selectedId = form.watch("agentId");
	const agent = agents.find((person) => person.id === selectedId);

	async function handleSubmit(values: NewSessionValues): Promise<void> {
		try {
			await onStart(values);
		} catch (cause) {
			form.setError("root.server", {
				type: "server",
				message: `Could not start the room. ${toError(cause).message}`,
			});
		}
	}

	function handleOpenChange(isOpen: boolean): void {
		if (!isOpen && !isSubmitting) onClose();
	}

	return (
		<Dialog open onOpenChange={handleOpenChange}>
			<DialogContent
				showCloseButton={!isSubmitting}
				onEscapeKeyDown={(event) => {
					if (isSubmitting) event.preventDefault();
				}}
				onInteractOutside={(event) => {
					if (isSubmitting) event.preventDefault();
				}}
				className="max-h-dvh overflow-y-auto sm:max-w-lg"
			>
				<DialogHeader>
					<DialogTitle className="font-semibold text-lg">
						A fresh conversation
					</DialogTitle>
					<DialogDescription>
						Choose an agent and a topic for this session.
					</DialogDescription>
				</DialogHeader>
				<Form
					form={form}
					onSubmit={handleSubmit}
					noValidate
					aria-busy={isSubmitting}
					className="space-y-5"
				>
					<FormSelect
						name="agentId"
						label="Work with (required)"
						placeholder="Choose an agent"
						triggerClassName="w-full"
						required
						disabled={isSubmitting}
					>
						{agents.map((person) => (
							<FormSelectItem key={person.id} value={person.id}>
								{person.name} · {person.role}
								{person.type === "Team" ? " (Team)" : ""}
							</FormSelectItem>
						))}
					</FormSelect>
					{agent && (
						<div className="flex items-center gap-3 rounded-md bg-muted p-3">
							<AgentAvatar agent={agent} size="sm" />
							<span className="min-w-0">
								<strong className="block font-medium text-sm">
									{agent.name}
								</strong>
								<span className="text-muted-foreground text-xs">
									{agent.role} ·{" "}
									{agent.type === "Team"
										? "Team agent"
										: "Individual agent"}
								</span>
							</span>
						</div>
					)}
					<FormInput
						name="title"
						label="What are we working on? (required)"
						maxLength={160}
						placeholder="e.g. My Portugal trip"
						required
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
							onClick={onClose}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? (
								<Spinner className="size-4" />
							) : (
								<Plus aria-hidden="true" />
							)}
							{isSubmitting ? "Starting…" : "Start session"}
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
