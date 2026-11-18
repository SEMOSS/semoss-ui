import { useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Card,
	Form,
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
import { CustomRoutineHeader } from "./custom-routine-header";
import {
	type CatalogSkill,
	type CustomRoutine,
	type CustomRoutineSettings,
	customRoutineSettingsSchema,
} from "./custom-routine-schema";
import { RoutineAvailability } from "./routine-availability";
import { RoutineDocuments } from "./routine-documents";
import { RoutineHistory } from "./routine-history";
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
		tools: routine.tools,
		agentId: routine.agentId,
	};
}

interface CustomRoutineCardProps {
	routine: CustomRoutine;
	/** The owner's skill catalog, for the routine's skill picker. */
	skills: CatalogSkill[];
	/** Replaces the routine after a save, or drops it after a delete. */
	onChange: (routine: CustomRoutine | null) => void;
	/** Rereads the list after a run starts, without a loading state. */
	onRefresh: () => void;
}

/** One of the owner's routines: its result first, its setup and past runs a tab away; edits save automatically. */
export function CustomRoutineCard({
	routine,
	skills,
	onChange,
	onRefresh,
}: CustomRoutineCardProps) {
	const { actions } = useInsight();
	const [tab, setTab] = useState("result");
	const [runError, setRunError] = useState("");
	const [isStarting, setIsStarting] = useState(false);
	const form = useForm<CustomRoutineSettings>({
		resolver: zodResolver(customRoutineSettingsSchema),
		defaultValues: formValues(routine),
		shouldFocusError: false,
	});
	const isAvailable =
		routine.schedulerAvailable &&
		routine.assistantAvailable &&
		routine.mailboxAvailable;
	const { status, handleSubmit, retry, flush } = useRoutineAutosave({
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

	const handleRunNow = async (): Promise<void> => {
		setIsStarting(true);
		setRunError("");
		try {
			// the run reads the saved routine, so an edit still waiting to save goes first
			await flush();
			// the run shows on the result, live
			setTab("result");
			await manageCustomRoutine(actions, routine.id, "run");
			onRefresh();
		} catch (cause) {
			setRunError(
				cause instanceof Error
					? cause.message
					: "The run could not be started. Try again.",
			);
		} finally {
			setIsStarting(false);
		}
	};

	const handleDelete = async (): Promise<void> => {
		await manageCustomRoutine(actions, routine.id, "delete");
		onChange(null);
	};

	return (
		<Card className="gap-0 overflow-hidden py-0 shadow-none">
			<Form form={form} onSubmit={handleSubmit} noValidate>
				<CustomRoutineHeader
					routine={routine}
					name={form.watch("name")}
					saveStatus={
						<RoutineSaveStatus
							status={status}
							error={form.formState.errors.root?.server?.message}
							onRetry={retry}
						/>
					}
					isStarting={isStarting}
					onRunNow={() => void handleRunNow()}
					onDelete={handleDelete}
				/>
				<Tabs value={tab} onValueChange={setTab} className="gap-0">
					<div className="flex flex-col gap-4 px-6 pt-6">
						<RoutineAvailability
							routine={routine}
							isAvailable={isAvailable}
							className="p-0"
						/>
						{runError && (
							<Alert variant="destructive">
								<AlertDescription>{runError}</AlertDescription>
							</Alert>
						)}
						<TabsList className={collaborationTabsStyles.list}>
							<TabsTrigger
								value="result"
								className={collaborationTabsStyles.trigger}
							>
								Latest result
							</TabsTrigger>
							<TabsTrigger
								value="setup"
								className={collaborationTabsStyles.trigger}
							>
								Setup
							</TabsTrigger>
							<TabsTrigger
								value="history"
								className={collaborationTabsStyles.trigger}
							>
								History
							</TabsTrigger>
						</TabsList>
					</div>
					<TabsContent
						value="result"
						className="mt-0 flex min-h-0 flex-col p-6"
					>
						<RoutineResult
							routine={routine}
							copy={RESULT_COPY}
							canOpenRun
							showTitle={false}
						/>
					</TabsContent>
					{/* mounted while hidden, so a pending autosave survives a tab switch */}
					<TabsContent
						value="setup"
						forceMount
						className="mt-0 p-6 data-[state=inactive]:hidden"
					>
						<CustomRoutineFields
							skills={skills}
							files={
								// the file explorer opens the folder, so it waits until Setup is shown
								tab === "setup" ? (
									<RoutineDocuments routineId={routine.id} />
								) : null
							}
						/>
					</TabsContent>
					<TabsContent value="history" className="mt-0 p-6">
						<RoutineHistory
							routineId={routine.id}
							routineName={routine.name}
							timezone={routine.timezone}
						/>
					</TabsContent>
				</Tabs>
			</Form>
		</Card>
	);
}
