import { Plus } from "lucide-react";
import { useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	P,
	Skeleton,
} from "@semoss/ui/next";
import { CustomRoutineCard } from "./custom-routine-card";
import {
	type CustomRoutine,
	customRoutineListSchema,
	type MySkill,
	mySkillListSchema,
} from "./custom-routine-schema";
import { MySkillsCard } from "./my-skills-card";
import { NewCustomRoutine } from "./new-custom-routine";

/** The owner's own routines, a way to add one, and their skills. */
export function CustomRoutinesTab() {
	const routines = usePixel<unknown>("WorkListCustomRoutines();");
	const skills = usePixel<unknown>("WorkListMySkills();");
	const [isAdding, setIsAdding] = useState(false);
	const parsedRoutines = customRoutineListSchema.safeParse(routines.data);
	const parsedSkills = mySkillListSchema.safeParse(skills.data);
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
	return (
		<div className="flex flex-col gap-6">
			{list.length === 0 && !isAdding && (
				<P className="text-muted-foreground text-sm">
					Ask your assistant for something on a schedule, such as
					"Every weekday at 8, summarize what my clients asked for and
					email it to me", or add one here. Results go only to you.
				</P>
			)}
			{list.map((routine) => (
				<CustomRoutineCard
					key={routine.id}
					routine={routine}
					skills={mySkills}
					onChange={(saved) =>
						setList(
							saved
								? list.map((item) =>
										item.id === saved.id ? saved : item,
									)
								: list.filter((item) => item.id !== routine.id),
						)
					}
					onRefresh={routines.refresh}
				/>
			))}
			{isAdding ? (
				<NewCustomRoutine
					skills={mySkills}
					onCreated={(created) => {
						setList([...list, created]);
						setIsAdding(false);
					}}
					onCancel={() => setIsAdding(false)}
				/>
			) : (
				<Button
					type="button"
					variant="outline"
					className="self-start"
					onClick={() => setIsAdding(true)}
				>
					<Plus aria-hidden="true" data-icon="inline-start" />
					New routine
				</Button>
			)}
			<MySkillsCard skills={mySkills} onChange={setSkills} />
		</div>
	);
}
