import { Plus, Repeat } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	P,
	Skeleton,
} from "@semoss/ui/next";
import { callPixel, pixel } from "@/lib/pixel";
import { ROUTINE_RUN_DELETED } from "./api/delete-routine-run";
import { SKILL_CATALOG_PIXEL } from "./custom-routine-api";
import { CustomRoutineCard } from "./custom-routine-card";
import {
	type CustomRoutine,
	catalogSkillListSchema,
	customRoutineListSchema,
	type MySkill,
	mySkillListSchema,
} from "./custom-routine-schema";
import { MySkillsCard } from "./my-skills-card";
import { NewCustomRoutine } from "./new-custom-routine";
import { RoutineDetail } from "./routine-detail";
import { RoutineNav } from "./routine-nav";

// how often a running routine's card checks for its result
const RUNNING_POLL_MS = 5000;

interface CustomRoutinesTabProps {
	/** A routine a link asked to open; a new `key` (the navigation's) opens it again after the owner picked another. */
	request?: { id: string; key: string };
}

/** The owner's own routines in a list beside the chosen one, a way to add one, and their skills. */
export function CustomRoutinesTab({ request }: CustomRoutinesTabProps) {
	const routines = usePixel<unknown>("WorkListCustomRoutines();");
	const skills = usePixel<unknown>("WorkListMySkills();");
	const catalog = usePixel<unknown>(SKILL_CATALOG_PIXEL);
	const [isAdding, setIsAdding] = useState(false);
	const [selected, setSelected] = useState("");
	const [shownRequest, setShownRequest] = useState<string | null>(null);
	if (request && shownRequest !== request.key) {
		setShownRequest(request.key);
		setSelected(request.id);
		setIsAdding(false);
	}
	const parsedRoutines = customRoutineListSchema.safeParse(routines.data);
	const parsedSkills = mySkillListSchema.safeParse(skills.data);
	const parsedCatalog = catalogSkillListSchema.safeParse(catalog.data);
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
	const isLoading = [routines.status, skills.status, catalog.status].some(
		(status) => status === "INITIAL" || status === "LOADING",
	);
	if (isLoading) {
		return (
			<div className="flex flex-col gap-4">
				<Skeleton className="h-24 w-full" />
				<Skeleton className="h-64 w-full" />
				<output className="sr-only">Loading your routines...</output>
			</div>
		);
	}
	if (
		!parsedRoutines.success ||
		!parsedSkills.success ||
		!parsedCatalog.success
	) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Could not load your routines</AlertTitle>
				<AlertDescription>
					{routines.error?.message ||
						skills.error?.message ||
						catalog.error?.message ||
						"Your routines could not be verified. Please try again."}
					<Button
						variant="outline"
						onClick={() => {
							routines.refresh();
							skills.refresh();
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
	const mySkills = parsedSkills.data.skills;
	const catalogSkills = parsedCatalog.data;
	const setList = (next: CustomRoutine[]) =>
		routines.update({ routines: next });
	const setSkills = (next: MySkill[]) => skills.update({ skills: next });
	// the first routine until the owner picks one; a deleted pick falls back to it
	const current = list.find((routine) => routine.id === selected) ?? list[0];
	return (
		<div className="flex flex-col gap-6">
			<div className="grid min-w-0 gap-6 md:grid-cols-[16rem_minmax(0,1fr)]">
				<RoutineNav
					label="My routines"
					entries={list.map((routine) => ({
						id: routine.id,
						name: routine.name,
						icon: Repeat,
						enabled: routine.enabled,
						lastStatus: routine.lastRun?.status ?? null,
					}))}
					selected={isAdding ? "" : (current?.id ?? "")}
					onSelect={(id) => {
						setSelected(id);
						setIsAdding(false);
					}}
					footer={
						!isAdding && (
							<Button
								type="button"
								variant="outline"
								className="self-start"
								onClick={() => setIsAdding(true)}
							>
								<Plus
									aria-hidden="true"
									data-icon="inline-start"
								/>
								New routine
							</Button>
						)
					}
				/>
				<div className="min-w-0">
					{isAdding ? (
						<NewCustomRoutine
							skills={catalogSkills}
							onCreated={(created) => {
								setList([...list, created]);
								setSelected(created.id);
								setIsAdding(false);
							}}
							onCancel={() => setIsAdding(false)}
						/>
					) : current ? (
						<RoutineDetail
							key={current.id}
							routineId={current.id}
							routineName={current.name}
							timezone={current.timezone}
						>
							<CustomRoutineCard
								routine={current}
								skills={catalogSkills}
								onChange={(saved) =>
									setList(
										saved
											? list.map((item) =>
													item.id === saved.id
														? saved
														: item,
												)
											: list.filter(
													(item) =>
														item.id !== current.id,
												),
									)
								}
								onRefresh={routines.refresh}
							/>
						</RoutineDetail>
					) : (
						<P className="text-muted-foreground text-sm">
							Ask your assistant for something on a schedule, such
							as "Every weekday at 8, summarize what my clients
							asked for and email it to me", or add one here.
							Results go only to you.
						</P>
					)}
				</div>
			</div>
			<MySkillsCard skills={mySkills} onChange={setSkills} />
		</div>
	);
}
