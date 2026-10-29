import { Plus, Repeat } from "lucide-react";
import { useEffect, useState } from "react";
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
import { CustomRoutineCard } from "./custom-routine-card";
import {
	type CustomRoutine,
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

/** The owner's own routines in a list beside the chosen one, a way to add one, and their skills. */
export function CustomRoutinesTab() {
	const routines = usePixel<unknown>("WorkListCustomRoutines();");
	const skills = usePixel<unknown>("WorkListMySkills();");
	const [isAdding, setIsAdding] = useState(false);
	const [selected, setSelected] = useState("");
	const parsedRoutines = customRoutineListSchema.safeParse(routines.data);
	const parsedSkills = mySkillListSchema.safeParse(skills.data);
	const { actions } = useInsight();
	const { update } = routines;
	const isRunning =
		parsedRoutines.success &&
		parsedRoutines.data.routines.some(
			(routine) => routine.lastRun?.status === "running",
		);
	// update in place: a refresh would show the loading state and reset every card
	useEffect(() => {
		if (!isRunning) return;
		const timer = window.setInterval(() => {
			callPixel(
				actions,
				pixel("WorkListCustomRoutines"),
				customRoutineListSchema,
			)
				.then(update)
				.catch(() => {
					// keep the last list; the next tick tries again
				});
		}, RUNNING_POLL_MS);
		return () => window.clearInterval(timer);
	}, [isRunning, actions, update]);
	const isLoading = [routines.status, skills.status].some(
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
	if (!parsedRoutines.success || !parsedSkills.success) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Could not load your routines</AlertTitle>
				<AlertDescription>
					{routines.error?.message ||
						skills.error?.message ||
						"Your routines could not be verified. Please try again."}
					<Button
						variant="outline"
						onClick={() => {
							routines.refresh();
							skills.refresh();
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
							skills={mySkills}
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
							timezone={current.timezone}
						>
							<CustomRoutineCard
								routine={current}
								skills={mySkills}
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
