import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	H2,
	P,
	Skeleton,
} from "@semoss/ui/next";
import { callPixel, pixel } from "@/lib/pixel";
import { ROUTINE_RUN_DELETED } from "./api/delete-routine-run";
import { CustomRoutineCard } from "./custom-routine-card";
import {
	type CustomRoutine,
	customRoutineListSchema,
} from "./custom-routine-schema";
import { RoutineAgentAvatar } from "./routine-agent-avatar";
import { RoutineNav } from "./routine-nav";
import { useSkillCatalog } from "./use-skill-catalog";

// how often a running routine's card checks for its result
const RUNNING_POLL_MS = 5000;

interface CustomRoutinesTabProps {
	/** A routine a link asked to open; a new `key` (the navigation's) opens it again after the owner picked another. */
	request?: { id: string; key: string };
	/** Opens the New routine tab, from the empty list. */
	onNew: () => void;
}

/** The owner's own routines in a list beside the chosen one. */
export function CustomRoutinesTab({ request, onNew }: CustomRoutinesTabProps) {
	const routines = usePixel<unknown>("WorkListCustomRoutines();");
	const catalog = useSkillCatalog();
	const [selected, setSelected] = useState("");
	const [shownRequest, setShownRequest] = useState<string | null>(null);
	if (request && shownRequest !== request.key) {
		setShownRequest(request.key);
		setSelected(request.id);
	}
	const parsedRoutines = customRoutineListSchema.safeParse(routines.data);
	const { actions } = useInsight();
	const { update } = routines;
	const isRunning =
		parsedRoutines.success &&
		parsedRoutines.data.routines.some(
			(routine) => routine.lastRun?.status === "running",
		);
	// update in place: a refresh would show the loading state and reset every card
	const reread = useCallback(() => {
		callPixel(
			actions,
			pixel("WorkListCustomRoutines"),
			customRoutineListSchema,
		)
			.then(update)
			.catch(() => {
				// keep the last list; the next read tries again
			});
	}, [actions, update]);
	useEffect(() => {
		if (!isRunning) return;
		const timer = window.setInterval(reread, RUNNING_POLL_MS);
		return () => window.clearInterval(timer);
	}, [isRunning, reread]);
	// a deleted run can be a routine's latest, whose result then goes
	useEffect(() => {
		window.addEventListener(ROUTINE_RUN_DELETED, reread);
		return () => window.removeEventListener(ROUTINE_RUN_DELETED, reread);
	}, [reread]);
	const isLoading =
		routines.status === "INITIAL" ||
		routines.status === "LOADING" ||
		catalog.isLoading;
	if (isLoading) {
		return (
			<div className="flex flex-col gap-4">
				<Skeleton className="h-24 w-full" />
				<Skeleton className="h-64 w-full" />
				<output className="sr-only">Loading your routines...</output>
			</div>
		);
	}
	if (!parsedRoutines.success || !catalog.skills) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Could not load your routines</AlertTitle>
				<AlertDescription>
					{routines.error?.message ||
						catalog.error ||
						"Your routines could not be verified. Please try again."}
					<Button
						variant="outline"
						onClick={() => {
							routines.refresh();
							catalog.refresh();
						}}
					>
						Try again
					</Button>
				</AlertDescription>
			</Alert>
		);
	}
	const list = parsedRoutines.data.routines;
	const catalogSkills = catalog.skills;
	const setList = (next: CustomRoutine[]) =>
		routines.update({ routines: next });
	if (list.length === 0) {
		return (
			<div className="flex flex-col items-start gap-3 rounded-xl border border-dashed p-6">
				<H2 className="font-medium text-xl">No routines yet</H2>
				<P className="max-w-prose text-muted-foreground text-sm">
					Make one from scratch or start from an idea, such as a
					morning digest of what your clients asked for. Results go
					only to you.
				</P>
				<Button type="button" onClick={onNew}>
					<Plus aria-hidden="true" data-icon="inline-start" />
					New routine
				</Button>
			</div>
		);
	}
	// the first routine until the owner picks one; a deleted pick falls back to it
	const current = list.find((routine) => routine.id === selected) ?? list[0];
	return (
		<div className="grid min-w-0 gap-6 md:grid-cols-[16rem_minmax(0,1fr)]">
			<RoutineNav
				label="My routines"
				entries={list.map((routine) => ({
					id: routine.id,
					name: routine.name,
					avatar: <RoutineAgentAvatar routineId={routine.id} />,
					enabled: routine.enabled,
					lastStatus: routine.lastRun?.status ?? null,
				}))}
				selected={current?.id ?? ""}
				onSelect={setSelected}
			/>
			<div className="min-w-0">
				{current && (
					<CustomRoutineCard
						key={current.id}
						routine={current}
						skills={catalogSkills}
						onChange={(saved) =>
							setList(
								saved
									? list.map((item) =>
											item.id === saved.id ? saved : item,
										)
									: list.filter(
											(item) => item.id !== current.id,
										),
							)
						}
						onRefresh={reread}
					/>
				)}
			</div>
		</div>
	);
}
