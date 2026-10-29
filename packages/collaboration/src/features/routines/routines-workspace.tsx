import { CalendarCheck, CalendarRange, Inbox, Receipt } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import { Tabs, TabsContent, TabsList, TabsTrigger, z } from "@semoss/ui/next";
import officeImage from "@/assets/img/routines-office.webp";
import { CollaborationPage } from "@/features/collaboration/components/collaboration-page";
import { CollaborationPageHeader } from "@/features/collaboration/components/collaboration-page-header";
import { saveAgendaRoutine } from "./agenda-routine-api";
import { AgendaRoutineForm } from "./agenda-routine-form";
import { agendaRoutineSchema } from "./agenda-routine-schema";
import { CustomRoutinesTab } from "./custom-routines-tab";
import {
	runEventPlanningNow,
	saveEventPlanningRoutine,
} from "./event-planning-api";
import { EventPlanningForm } from "./event-planning-form";
import { eventPlanningRoutineSchema } from "./event-planning-schema";
import { saveExpenseRoutine } from "./expense-routine-api";
import { ExpenseRoutineForm } from "./expense-routine-form";
import { expenseRoutineSchema } from "./expense-routine-schema";
import { saveInboxRoutine } from "./inbox-routine-api";
import { InboxRoutineForm } from "./inbox-routine-form";
import { inboxRoutineSchema } from "./inbox-routine-schema";
import { RoutineDetail } from "./routine-detail";
import { RoutineLoader } from "./routine-loader";
import { RoutineNav, type RoutineNavEntry } from "./routine-nav";

type RoutineSummary = Pick<RoutineNavEntry, "enabled" | "lastStatus">;

// just what the list shows; each routine's own schema validates it before anything is editable
const summarySchema = z.object({
	enabled: z.boolean(),
	lastRun: z
		.object({ status: z.enum(["running", "completed", "failed"]) })
		.nullish(),
});

/** Reports a routine's on/off and last run to the list. */
function ReportSummary({
	id,
	value,
	onReport,
}: {
	id: string;
	value: unknown;
	onReport: (id: string, summary: RoutineSummary) => void;
}) {
	const parsed = summarySchema.safeParse(value);
	const enabled = parsed.success ? parsed.data.enabled : undefined;
	const lastStatus = parsed.success
		? (parsed.data.lastRun?.status ?? null)
		: undefined;
	useEffect(() => {
		if (enabled !== undefined) onReport(id, { enabled, lastStatus });
	}, [id, enabled, lastStatus, onReport]);
	return null;
}

/** Reads one routine's summary for the list before its detail is opened. */
function SummaryProbe({
	id,
	pixel,
	onReport,
}: {
	id: string;
	pixel: string;
	onReport: (id: string, summary: RoutineSummary) => void;
}) {
	const { data } = usePixel<unknown>(pixel);
	return <ReportSummary id={id} value={data} onReport={onReport} />;
}

/** The prebuilt routines every owner can turn on, in list order. */
const SYSTEM_ROUTINES = [
	{
		id: "inbox-daily-brief",
		name: "Inbox daily brief",
		icon: Inbox,
		pixel: "WorkGetInboxRoutine();",
	},
	{
		id: "weekly-meeting-agendas",
		name: "Weekly meeting agendas",
		icon: CalendarRange,
		pixel: "WorkGetAgendaRoutine();",
	},
	{
		id: "event-planning",
		name: "Event planning",
		icon: CalendarCheck,
		pixel: "WorkGetEventPlanningRoutine();",
	},
	{
		id: "expense-review",
		name: "Expense review",
		icon: Receipt,
		pixel: "WorkGetExpenseRoutine();",
	},
] as const;

type SystemRoutineId = (typeof SYSTEM_ROUTINES)[number]["id"];

/** System routines and the owner's own, each as a list beside the chosen routine; a routine loads when opened. */
export function RoutinesWorkspace() {
	const { actions } = useInsight();
	const [selected, setSelected] =
		useState<SystemRoutineId>("inbox-daily-brief");
	const [opened, setOpened] = useState<Set<SystemRoutineId>>(
		() => new Set(["inbox-daily-brief"]),
	);
	const [summaries, setSummaries] = useState<Record<string, RoutineSummary>>(
		{},
	);
	const [hasOpenedMine, setHasOpenedMine] = useState(false);
	// stable, so the reporters' effects only rerun when a summary changes
	const [report] = useState(
		() => (id: string, summary: RoutineSummary) =>
			setSummaries((current) => ({ ...current, [id]: summary })),
	);
	const select = (id: string) => {
		const routine = SYSTEM_ROUTINES.find((item) => item.id === id);
		if (!routine) return;
		setSelected(routine.id);
		setOpened((current) => new Set(current).add(routine.id));
	};

	const detail = (id: SystemRoutineId): ReactNode => {
		switch (id) {
			case "inbox-daily-brief":
				return (
					<RoutineLoader
						pixel="WorkGetInboxRoutine();"
						schema={inboxRoutineSchema}
					>
						{(routine, update) => (
							<RoutineDetail
								routineId={id}
								timezone={routine.timezone}
							>
								<ReportSummary
									id={id}
									value={routine}
									onReport={report}
								/>
								<InboxRoutineForm
									routine={routine}
									onSave={async (values) => {
										const saved = await saveInboxRoutine(
											actions,
											values,
										);
										update(saved);
										return saved;
									}}
								/>
							</RoutineDetail>
						)}
					</RoutineLoader>
				);
			case "weekly-meeting-agendas":
				return (
					<RoutineLoader
						pixel="WorkGetAgendaRoutine();"
						schema={agendaRoutineSchema}
					>
						{(routine, update) => (
							<RoutineDetail
								routineId={id}
								timezone={routine.timezone}
							>
								<ReportSummary
									id={id}
									value={routine}
									onReport={report}
								/>
								<AgendaRoutineForm
									routine={routine}
									onSave={async (values) => {
										const saved = await saveAgendaRoutine(
											actions,
											values,
										);
										update(saved);
										return saved;
									}}
								/>
							</RoutineDetail>
						)}
					</RoutineLoader>
				);
			case "event-planning":
				return (
					<RoutineLoader
						pixel="WorkGetEventPlanningRoutine();"
						schema={eventPlanningRoutineSchema}
					>
						{(routine, update) => (
							<RoutineDetail
								routineId={id}
								timezone={routine.timezone}
							>
								<ReportSummary
									id={id}
									value={routine}
									onReport={report}
								/>
								<EventPlanningForm
									routine={routine}
									onSave={async (values) => {
										const saved =
											await saveEventPlanningRoutine(
												actions,
												values,
											);
										update(saved);
										return saved;
									}}
									onRunNow={async () => {
										const next =
											await runEventPlanningNow(actions);
										update(next);
										return next;
									}}
								/>
							</RoutineDetail>
						)}
					</RoutineLoader>
				);
			case "expense-review":
				return (
					<RoutineLoader
						pixel="WorkGetExpenseRoutine();"
						schema={expenseRoutineSchema}
					>
						{(routine, update) => (
							<RoutineDetail
								routineId={id}
								timezone={routine.timezone}
							>
								<ReportSummary
									id={id}
									value={routine}
									onReport={report}
								/>
								<ExpenseRoutineForm
									routine={routine}
									onSave={async (values) => {
										const saved = await saveExpenseRoutine(
											actions,
											values,
										);
										update(saved);
										return saved;
									}}
								/>
							</RoutineDetail>
						)}
					</RoutineLoader>
				);
		}
	};

	return (
		<CollaborationPage>
			<div className="flex min-w-0 flex-col gap-6">
				<Tabs
					defaultValue="system"
					className="gap-6"
					onValueChange={(value) => {
						if (value === "mine") setHasOpenedMine(true);
					}}
				>
					<div className="relative isolate flex flex-col gap-6">
						<img
							src={officeImage}
							alt=""
							width={960}
							height={636}
							decoding="async"
							className="mask-l-from-50% mask-l-to-100% pointer-events-none absolute top-0 right-0 h-10 w-32 rounded-r-xl object-cover opacity-60 md:h-full md:w-2/5 dark:opacity-40"
						/>
						<CollaborationPageHeader
							title="Routines"
							description="Let your assistant take care of the repeat work. Your briefs appear here."
							className="relative mb-0 md:w-3/5 md:pr-6"
						/>
						<TabsList className="relative w-full sm:w-fit">
							<TabsTrigger value="system">
								System routines
							</TabsTrigger>
							<TabsTrigger value="mine">My routines</TabsTrigger>
						</TabsList>
					</div>
					<TabsContent
						value="system"
						forceMount
						className="data-[state=inactive]:hidden"
					>
						{SYSTEM_ROUTINES.filter(
							(routine) => !opened.has(routine.id),
						).map((routine) => (
							<SummaryProbe
								key={routine.id}
								id={routine.id}
								pixel={routine.pixel}
								onReport={report}
							/>
						))}
						<div className="grid min-w-0 gap-6 md:grid-cols-[16rem_minmax(0,1fr)]">
							<RoutineNav
								label="System routines"
								entries={SYSTEM_ROUTINES.map((routine) => ({
									id: routine.id,
									name: routine.name,
									icon: routine.icon,
									...summaries[routine.id],
								}))}
								selected={selected}
								onSelect={select}
							/>
							{/* opened routines stay mounted, so a pending autosave survives picking another */}
							{SYSTEM_ROUTINES.filter((routine) =>
								opened.has(routine.id),
							).map((routine) => (
								<div
									key={routine.id}
									hidden={routine.id !== selected}
									className="min-w-0"
								>
									{detail(routine.id)}
								</div>
							))}
						</div>
					</TabsContent>
					<TabsContent
						value="mine"
						forceMount
						className="flex flex-col gap-6 data-[state=inactive]:hidden"
					>
						{hasOpenedMine && <CustomRoutinesTab />}
					</TabsContent>
				</Tabs>
			</div>
		</CollaborationPage>
	);
}
