import { BookOpen } from "lucide-react";
import { useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	H2,
	Label,
	P,
	Switch,
} from "@semoss/ui/next";
import { setSkillInAssistant } from "./custom-routine-api";
import type { MySkill } from "./custom-routine-schema";

interface MySkillsCardProps {
	skills: MySkill[];
	onChange: (skills: MySkill[]) => void;
}

/** The owner's own skills, and which ones their assistant loads. */
export function MySkillsCard({ skills, onChange }: MySkillsCardProps) {
	const { actions } = useInsight();
	const [error, setError] = useState("");
	const [pending, setPending] = useState<string | null>(null);
	const toggle = async (skill: MySkill, use: boolean) => {
		setPending(skill.id);
		setError("");
		try {
			await setSkillInAssistant(actions, skill.id, use);
			onChange(
				skills.map((item) =>
					item.id === skill.id ? { ...item, inAssistant: use } : item,
				),
			);
		} catch (cause) {
			setError(
				cause instanceof Error ? cause.message : "That did not save.",
			);
		} finally {
			setPending(null);
		}
	};
	return (
		<Card className="gap-0 py-0 shadow-none">
			<CardHeader className="gap-2 border-b py-6">
				<div className="flex items-center gap-3">
					<BookOpen
						className="size-5 shrink-0 text-muted-foreground"
						aria-hidden="true"
					/>
					<CardTitle>
						<H2 className="font-medium text-xl">My skills</H2>
					</CardTitle>
				</div>
				<CardDescription>
					Instructions you saved for your assistant, such as how you
					like a summary written. Ask your assistant to make one. Only
					you can see or use them.
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-4 py-6">
				{skills.length === 0 ? (
					<P className="text-muted-foreground text-sm">
						No skills yet. Try asking your assistant: "Make a skill
						for how I like client summaries."
					</P>
				) : (
					skills.map((skill) => (
						<div
							key={skill.id}
							className="flex items-start justify-between gap-4"
						>
							<div className="flex min-w-0 flex-col gap-1">
								<Label htmlFor={`skill-${skill.id}`}>
									{skill.name}
								</Label>
								{skill.description && (
									<P className="text-muted-foreground text-sm">
										{skill.description}
									</P>
								)}
							</div>
							<div className="flex shrink-0 items-center gap-2">
								<span className="text-muted-foreground text-xs">
									Use in my chats
								</span>
								<Switch
									id={`skill-${skill.id}`}
									checked={skill.inAssistant}
									disabled={pending === skill.id}
									onCheckedChange={(use) =>
										void toggle(skill, use)
									}
								/>
							</div>
						</div>
					))
				)}
				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
			</CardContent>
		</Card>
	);
}
