import { BotIcon, PlusIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { SkillSelector } from "@semoss/shared";
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
	FormField,
	H3,
	P,
	ScrollArea,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { useAssistant } from "@/hooks/use-assistant";
import { AssistantAgentResourcesToggle } from "./assistant-agent-resources-toggle";

const schema = z.object({
	items: z.array(z.object({ id: z.string(), name: z.string() })),
});

interface AssistantSettingSkillsProps {
	/** Display name of the agent that owns the inherited resources. */
	agentName: string;
	/** Read-only skills supplied by the selected agent. */
	agentSkills: { id: string; name: string }[];
}

interface RemovalFailure {
	message: string;
	draft: z.infer<typeof schema>["items"];
}

/** Room skills and their picker. Key by room ID to discard drafts on navigation. */
export const AssistantSettingSkills = ({
	agentName,
	agentSkills,
}: AssistantSettingSkillsProps) => {
	const skills = useAssistant((state) => state.customSkills);
	const saveSkills = useAssistant((state) => state.saveCustomSkills);
	const isRoomBusy = useAssistant(
		(state) =>
			!state.roomId ||
			state.isInitializing ||
			Boolean(state.initError) ||
			state.isSavingResources ||
			state.isSending ||
			Boolean(state.activeRunId),
	);
	const [isOpen, setIsOpen] = useState(false);
	const [shouldShowAgentSkills, setShouldShowAgentSkills] = useState(true);
	const [failure, setFailure] = useState<RemovalFailure | null>(null);
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: { items: [] },
	});
	const { isSubmitting, errors } = form.formState;
	const isDisabled = isRoomBusy || isSubmitting;
	const values = skills.map((skill) => ({
		id: skill.skill_id,
		name: skill.name ?? skill.skill_id,
	}));
	const saveSkillsSelection = (
		items: z.infer<typeof schema>["items"],
	): Promise<void> =>
		saveSkills(
			items.map((item) => ({
				...skills.find((skill) => skill.skill_id === item.id),
				skill_id: item.id,
				name: item.name,
			})),
		);
	const items = [
		...values.map((item) => ({ ...item, isCustom: true })),
		...(shouldShowAgentSkills ? agentSkills : []).map((item) => ({
			...item,
			isCustom: false,
		})),
	];
	const handleSubmit = async ({
		items,
	}: z.infer<typeof schema>): Promise<void> => {
		if (isDisabled || !isOpen) return;
		try {
			await saveSkillsSelection(items);
		} catch (error) {
			form.setError("root.server", { message: getErrorMessage(error) });
			return;
		}
		setIsOpen(false);
	};
	const handleRemove = async (
		draft: z.infer<typeof schema>["items"],
	): Promise<void> => {
		setFailure(null);
		try {
			await saveSkillsSelection(draft);
		} catch (error) {
			setFailure({ message: getErrorMessage(error), draft });
		}
	};
	return (
		<section className="flex min-w-0 flex-col gap-2" aria-label="Skills">
			<Dialog
				open={isOpen}
				onOpenChange={(open) => {
					if (isDisabled) return;
					if (open) form.reset({ items: values });
					setIsOpen(open);
				}}
			>
				<div className="flex items-center justify-between gap-2">
					<H3 className="font-medium text-sm">Skills</H3>
					<div className="flex items-center gap-1">
						{agentSkills.length > 0 && (
							<AssistantAgentResourcesToggle
								resource="skills"
								isVisible={shouldShowAgentSkills}
								onVisibleChange={setShouldShowAgentSkills}
							/>
						)}
						<Tooltip disableHoverableContent={false}>
							<TooltipTrigger asChild>
								<DialogTrigger asChild>
									<Button
										type="button"
										size="icon-sm"
										variant="ghost"
										aria-label="Add skills"
										disabled={isDisabled}
									>
										<PlusIcon
											className="size-4"
											aria-hidden="true"
										/>
									</Button>
								</DialogTrigger>
							</TooltipTrigger>
							<TooltipContent>Add skills</TooltipContent>
						</Tooltip>
					</div>
				</div>
				{isOpen && (
					<DialogContent
						className="flex max-h-dvh flex-col overflow-y-auto sm:max-w-2xl"
						showCloseButton={!isSubmitting}
						onEscapeKeyDown={(event) => {
							if (isSubmitting) event.preventDefault();
						}}
						onInteractOutside={(event) => {
							if (isSubmitting) event.preventDefault();
						}}
					>
						<DialogHeader>
							<DialogTitle>Add skills</DialogTitle>
							<DialogDescription>
								Select additions for this conversation and new
								conversations you create from it.
							</DialogDescription>
						</DialogHeader>
						<Form
							form={form}
							onSubmit={handleSubmit}
							className="flex min-h-0 flex-col gap-4"
							aria-busy={isSubmitting}
						>
							<FormField
								control={form.control}
								name="items"
								render={({ field }) => (
									<SkillSelector
										values={field.value}
										disabled={isDisabled}
										onChange={field.onChange}
										className="h-80"
									/>
								)}
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
									variant="outline"
									disabled={isSubmitting}
									onClick={() => setIsOpen(false)}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={isDisabled}>
									{isSubmitting && (
										<Spinner className="size-4" />
									)}
									{isSubmitting ? "Saving…" : "Save"}
								</Button>
							</DialogFooter>
						</Form>
					</DialogContent>
				)}
			</Dialog>
			{items.length ? (
				<ScrollArea className="[&_[data-slot=scroll-area-viewport]>div]:block! min-w-0 rounded-md border border-border [&_[data-slot=scroll-area-viewport]]:max-h-60">
					<ul aria-label="Skills">
						{items.map((value) => (
							<li
								key={`${value.isCustom ? "custom" : "agent"}:${value.id}`}
								className="flex h-12 min-w-0 items-center justify-between gap-2 border-border border-b px-2 last:border-b-0"
							>
								<span
									className="min-w-0 truncate text-sm"
									title={value.name || value.id}
								>
									{value.name || value.id}
								</span>
								{!value.isCustom && (
									<Tooltip disableHoverableContent={false}>
										<TooltipTrigger asChild>
											<Button
												type="button"
												variant="ghost"
												size="icon-sm"
												className="shrink-0 text-muted-foreground"
												aria-label={`${value.name || value.id}: provided by ${agentName}`}
											>
												<BotIcon
													className="size-3.5"
													aria-hidden="true"
												/>
											</Button>
										</TooltipTrigger>
										<TooltipContent
											side="top"
											sideOffset={4}
											className="wrap-break-word max-w-64"
										>
											Provided by {agentName}
										</TooltipContent>
									</Tooltip>
								)}
								{value.isCustom && (
									<Button
										type="button"
										size="icon-sm"
										variant="ghost"
										className="shrink-0"
										aria-label={`Remove ${value.name || value.id}`}
										disabled={isDisabled}
										onClick={() =>
											void handleRemove(
												values.filter(
													(item) =>
														item.id !== value.id,
												),
											)
										}
									>
										<XIcon
											className="size-4"
											aria-hidden="true"
										/>
									</Button>
								)}
							</li>
						))}
					</ul>
				</ScrollArea>
			) : (
				<P className="text-muted-foreground text-xs">
					No custom skills added.
				</P>
			)}
			{failure && (
				<Alert variant="destructive">
					<AlertDescription>
						{failure.message}
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={isDisabled}
							onClick={() => void handleRemove(failure.draft)}
						>
							Retry removal
						</Button>
					</AlertDescription>
				</Alert>
			)}
		</section>
	);
};
