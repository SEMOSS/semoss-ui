import { useId, useState } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Button,
	Card,
	H2,
	Label,
	P,
	Skeleton,
	Switch,
} from "@semoss/ui/next";
import {
	type MySkill,
	mySkillListSchema,
	setSkillInAssistant,
} from "./skills-api";

/** The owner's own skills, and which ones their assistant loads in every chat. */
export function SkillsSettings() {
	const { actions } = useInsight();
	const id = useId();
	const skills = usePixel<unknown>("WorkListMySkills();");
	const parsed = mySkillListSchema.safeParse(skills.data);
	const [error, setError] = useState("");
	const [pending, setPending] = useState<string | null>(null);
	const isLoading =
		skills.status === "INITIAL" || skills.status === "LOADING";

	const handleToggle = async (
		skill: MySkill,
		use: boolean,
	): Promise<void> => {
		if (!parsed.success) return;
		setPending(skill.id);
		setError("");
		try {
			await setSkillInAssistant(actions, skill.id, use);
			skills.update({
				skills: parsed.data.skills.map((item) =>
					item.id === skill.id ? { ...item, inAssistant: use } : item,
				),
			});
		} catch (cause) {
			setError(
				cause instanceof Error ? cause.message : "That did not save.",
			);
		} finally {
			setPending(null);
		}
	};

	return (
		<section className="min-w-0" aria-labelledby={`${id}-title`}>
			<Card className="gap-0 p-5 shadow-none">
				<header className="space-y-2 border-b pb-4">
					<H2 id={`${id}-title`} className="font-medium text-xl">
						Skills
					</H2>
					<P className="text-base text-muted-foreground">
						Instructions you saved with your assistant, such as how
						you like a summary written. Turn one on to use it in all
						your chats. Routines choose their own skills in
						Routines.
					</P>
				</header>
				{isLoading ? (
					<div className="flex flex-col gap-3 pt-4">
						<Skeleton className="h-12 w-full" />
						<Skeleton className="h-12 w-full" />
						<output className="sr-only">
							Loading your skills...
						</output>
					</div>
				) : !parsed.success ? (
					<Alert variant="destructive" className="mt-4">
						<AlertDescription>
							{skills.error?.message ||
								"Your skills could not be loaded."}
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={skills.refresh}
							>
								Try again
							</Button>
						</AlertDescription>
					</Alert>
				) : parsed.data.skills.length === 0 ? (
					<P className="pt-4 text-base text-muted-foreground">
						No skills yet. Try asking your assistant: "Make a skill
						for how I like client summaries."
					</P>
				) : (
					<ul className="divide-y divide-border">
						{parsed.data.skills.map((skill) => (
							<li
								key={skill.id}
								className="flex min-h-16 items-center justify-between gap-4 py-4"
							>
								<div className="flex min-w-0 flex-col gap-1">
									<Label
										id={`${id}-${skill.id}-name`}
										htmlFor={`${id}-${skill.id}`}
										className="font-medium text-base"
									>
										{skill.name}
									</Label>
									{skill.description && (
										<P
											id={`${id}-${skill.id}-description`}
											className="text-base text-muted-foreground"
										>
											{skill.description}
										</P>
									)}
								</div>
								<div className="flex shrink-0 items-center gap-2">
									<span
										id={`${id}-${skill.id}-use`}
										className="text-muted-foreground text-sm"
									>
										Use in my chats
									</span>
									<Switch
										id={`${id}-${skill.id}`}
										aria-labelledby={`${id}-${skill.id}-name ${id}-${skill.id}-use`}
										aria-describedby={
											skill.description
												? `${id}-${skill.id}-description`
												: undefined
										}
										checked={skill.inAssistant}
										disabled={pending === skill.id}
										onCheckedChange={(use) =>
											void handleToggle(skill, use)
										}
									/>
								</div>
							</li>
						))}
					</ul>
				)}
				{error && (
					<Alert variant="destructive" className="mt-4">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
			</Card>
		</section>
	);
}
