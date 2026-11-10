import { Plus } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { useInsight, usePixel } from "@semoss/sdk/react";
import { Tabs, TabsContent, TabsList, TabsTrigger, z } from "@semoss/ui/next";
import { CollaborationPage } from "@/features/collaboration/components/collaboration-page";
import { CollaborationPageHeader } from "@/features/collaboration/components/collaboration-page-header";
import { runAgendaRoutineNow, saveAgendaRoutine } from "./agenda-routine-api";
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
import { runInboxRoutineNow, saveInboxRoutine } from "./inbox-routine-api";
import { InboxRoutineForm } from "./inbox-routine-form";
import { inboxRoutineSchema } from "./inbox-routine-schema";
import { NewRoutineTab } from "./new-routine-tab";
import { RoutineAgentAvatar } from "./routine-agent-avatar";
import { RoutineDetail } from "./routine-detail";
import { RoutineLoader } from "./routine-loader";
import { RoutineNav, type RoutineNavEntry } from "./routine-nav";
import {
	findSystemRoutine,
	SYSTEM_ROUTINES,
	type SystemRoutineId,
} from "./system-routines";

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

/**
 * System routines and the owner's own, each as a list beside the chosen routine; a routine loads when opened.
 * A link with `?routine=<id>`, such as a sidebar run, opens that routine.
 */
export function RoutinesWorkspace() {
	const { actions } = useInsight();
	const { key: locationKey } = useLocation();
	const [searchParams] = useSearchParams();
	const requested = searchParams.get("routine");
	const [tab, setTab] = useState("system");
	const [selected, setSelected] =
		useState<SystemRoutineId>("inbox-daily-brief");
	const [opened, setOpened] = useState<Set<SystemRoutineId>>(
		() => new Set(["inbox-daily-brief"]),
	);
	const [summaries, setSummaries] = useState<Record<string, RoutineSummary>>(
		{},
	);
	const [hasOpenedMine, setHasOpenedMine] = useState(false);
	const [hasOpenedNew, setHasOpenedNew] = useState(false);
	// each new routine rereads My routines, so the list has it, and starts the New routine tab over
	const [createdCount, setCreatedCount] = useState(0);
	const navigate = useNavigate();
	const [shownLocation, setShownLocation] = useState<string | null>(null);
	// stable, so the reporters' effects only rerun when a summary changes
	const [report] = useState(
		() => (id: string, summary: RoutineSummary) =>
			setSummaries((current) => ({ ...current, [id]: summary })),
	);
	const select = (id: string) => {
		const routine = findSystemRoutine(id);
		if (!routine) return;
		setSelected(routine.id);
		setOpened((current) => new Set(current).add(routine.id));
	};
	// every navigation here, even to the routine already in the address, opens what it names
	if (shownLocation !== locationKey) {
		setShownLocation(locationKey);
		const system = findSystemRoutine(requested);
		if (system) {
			select(system.id);
			setTab("system");
		} else if (requested) {
			setTab("mine");
			setHasOpenedMine(true);
		}
	}

	const detail = (id: SystemRoutineId): ReactNode => {
		switch (id) {
			case "inbox-daily-brief":
				return (
					<RoutineLoader
						pixel="WorkGetInboxRoutine();"
						schema={inboxRoutineSchema}
					>
						{(routine, update, runNow) => (
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
									onRunNow={() =>
										runNow(() =>
											runInboxRoutineNow(actions),
										)
									}
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
						{(routine, update, runNow) => (
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
									onRunNow={() =>
										runNow(() =>
											runAgendaRoutineNow(actions),
										)
									}
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
						{(routine, update, runNow) => (
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
									onRunNow={() =>
										runNow(() =>
											runEventPlanningNow(actions),
										)
									}
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
					value={tab}
					className="gap-6"
					onValueChange={(value) => {
						setTab(value);
						if (value === "mine") setHasOpenedMine(true);
						if (value === "new") setHasOpenedNew(true);
					}}
				>
					<div className="flex flex-col gap-6">
						<CollaborationPageHeader
							title="Routines"
							description="Let your assistant take care of the repeat work. Your briefs appear here."
							className="mb-0"
						/>
						<TabsList className="w-full sm:w-fit">
							<TabsTrigger value="system">
								System routines
							</TabsTrigger>
							<TabsTrigger value="mine">My routines</TabsTrigger>
							<TabsTrigger value="new">
								<Plus aria-hidden="true" />
								New routine
							</TabsTrigger>
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
									avatar: (
										<RoutineAgentAvatar
											routineId={routine.id}
										/>
									),
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
						{hasOpenedMine && (
							<CustomRoutinesTab
								key={createdCount}
								request={
									requested && !findSystemRoutine(requested)
										? { id: requested, key: locationKey }
										: undefined
								}
								onNew={() => {
									setTab("new");
									setHasOpenedNew(true);
								}}
							/>
						)}
					</TabsContent>
					{/* mounted while hidden, so a half-written routine survives a look at another tab */}
					<TabsContent
						value="new"
						forceMount
						className="data-[state=inactive]:hidden"
					>
						{hasOpenedNew && (
							<NewRoutineTab
								key={createdCount}
								onCreated={(created) => {
									setCreatedCount((count) => count + 1);
									// the address names it, so My routines opens on it as a link would
									void navigate(
										`/routines?${new URLSearchParams({ routine: created.id })}`,
									);
								}}
							/>
						)}
					</TabsContent>
				</Tabs>
			</div>
		</CollaborationPage>
	);
}
