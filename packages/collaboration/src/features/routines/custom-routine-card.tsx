import { Play, Repeat, Trash2 } from "lucide-react";
import { useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Button,
	Card,
	CardContent,
	Form,
	FormSwitch,
	Separator,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	useForm,
	zodResolver,
} from "@semoss/ui/next";
import { collaborationTabsStyles } from "@/features/collaboration/components/collaboration-tabs.styles";
import { manageCustomRoutine, saveCustomRoutine } from "./custom-routine-api";
import { CustomRoutineFields } from "./custom-routine-fields";
import {
	type CustomRoutine,
	type CustomRoutineSettings,
	customRoutineSettingsSchema,
	DELIVERY_LABELS,
	type MySkill,
} from "./custom-routine-schema";
import { RoutineAvailability } from "./routine-availability";
import { RoutineCardHeader } from "./routine-card-header";
import { RoutineDocuments } from "./routine-documents";
import { RoutineNextRun } from "./routine-next-run";
import { RoutineResult, type RoutineResultCopy } from "./routine-result";
import { RoutineSaveStatus } from "./routine-save-status";
import { useRoutineAutosave } from "./use-routine-autosave";

const RESULT_COPY: RoutineResultCopy = {
	title: "Latest result",
	emptyTitle: "The first result will appear here",
	scheduledHint: "Your routine is scheduled. Run it now to see a result.",
	disabledHint: "Turn the routine on, then run it now to see a result.",
	running: "Your routine is running. This updates when it finishes.",
	failed: "The last run could not be completed",
};

function formValues(routine: CustomRoutine): CustomRoutineSettings {
	return {
		enabled: routine.enabled,
		name: routine.name,
		prompt: routine.prompt,
		time: routine.time,
		days: routine.days,
		timezone: routine.timezone,
		delivery: routine.delivery,
		skills: routine.skills,
		agentId: routine.agentId,
	};
}

interface CustomRoutineCardProps {
	routine: CustomRoutine;
	skills: MySkill[];
	/** Replaces the routine after a save, or drops it after a delete. */
	onChange: (routine: CustomRoutine | null) => void;
	/** Reloads the list after a run starts. */
	onRefresh: () => void;
}

/** One of the owner's routines; edits save automatically. */
export function CustomRoutineCard({
	routine,
	skills,
	onChange,
	onRefresh,
}: CustomRoutineCardProps) {
	const { actions } = useInsight();
	const [actionError, setActionError] = useState("");
	const [isBusy, setIsBusy] = useState(false);
	const form = useForm<CustomRoutineSettings>({
		resolver: zodResolver(customRoutineSettingsSchema),
		defaultValues: formValues(routine),
		shouldFocusError: false,
	});
	const isAvailable =
		routine.schedulerAvailable &&
		routine.assistantAvailable &&
		routine.mailboxAvailable;
	const { status, handleSubmit, retry } = useRoutineAutosave({
		form,
		onSave: async (values) => {
			if (values.enabled && !isAvailable) {
				throw new Error(
					routine.availabilityMessage?.replace(
						/\bBrain\b/g,
						"Settings",
					) ||
						"Connect your inbox and check service availability before turning this routine on.",
				);
			}
			const saved = await saveCustomRoutine(actions, values, routine.id);
			onChange(saved);
			return formValues(saved);
		},
	});

	const run = async (action: "run" | "delete") => {
		if (
			action === "delete" &&
			!window.confirm(`Delete the routine "${routine.name}"?`)
		)
			return;
		setIsBusy(true);
		setActionError("");
		try {
			await manageCustomRoutine(actions, routine.id, action);
			if (action === "delete") onChange(null);
			else onRefresh();
		} catch (cause) {
			setActionError(
				cause instanceof Error ? cause.message : "That did not work.",
			);
		} finally {
			setIsBusy(false);
		}
	};

	return (
		<Card className="gap-0 overflow-hidden py-0 shadow-none">
			<Form form={form} onSubmit={handleSubmit} noValidate>
				<RoutineCardHeader
					icon={Repeat}
					title={routine.name}
					description={`${DELIVERY_LABELS[routine.delivery]}. It can read your mail, chats, and calendar, and never sends to anyone else.`}
					routine={routine}
					saveStatus={
						<RoutineSaveStatus
							status={status}
							error={form.formState.errors.root?.server?.message}
							onRetry={retry}
						/>
					}
				/>
				<CardContent className="grid min-w-0 gap-8 py-6 lg:grid-cols-2">
					<div className="flex min-w-0 flex-col gap-6">
						<FormSwitch
							name="enabled"
							label="Routine on"
							description={<RoutineNextRun routine={routine} />}
						/>
						<div className="flex flex-wrap gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={
									isBusy ||
									!routine.enabled ||
									routine.lastRun?.status === "running"
								}
								onClick={() => void run("run")}
							>
								<Play
									aria-hidden="true"
									data-icon="inline-start"
								/>
								Run now
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								disabled={isBusy}
								onClick={() => void run("delete")}
							>
								<Trash2
									aria-hidden="true"
									data-icon="inline-start"
								/>
								Delete
							</Button>
						</div>
						{actionError && (
							<Alert variant="destructive">
								<AlertDescription>
									{actionError}
								</AlertDescription>
							</Alert>
						)}
						<Separator />
						<CustomRoutineFields skills={skills} />
					</div>
					{/* a grid item, so as tall as the settings column; the open panel fills what the tab list leaves */}
					<Tabs
						defaultValue="result"
						className="min-h-0 min-w-0 gap-3"
					>
						<TabsList className={collaborationTabsStyles.list}>
							<TabsTrigger
								value="result"
								className={collaborationTabsStyles.trigger}
							>
								Latest result
							</TabsTrigger>
							<TabsTrigger
								value="documents"
								className={collaborationTabsStyles.trigger}
							>
								Reference documents
							</TabsTrigger>
						</TabsList>
						<TabsContent
							value="result"
							className="mt-0 flex min-h-0 flex-1 flex-col"
						>
							<RoutineResult
								routine={routine}
								copy={RESULT_COPY}
								canOpenRun
								showTitle={false}
							/>
						</TabsContent>
						<TabsContent
							value="documents"
							className="mt-0 flex min-h-0 flex-1 flex-col"
						>
							<RoutineDocuments routineId={routine.id} />
						</TabsContent>
					</Tabs>
				</CardContent>
				<RoutineAvailability
					routine={routine}
					isAvailable={isAvailable}
				/>
			</Form>
		</Card>
	);
}
