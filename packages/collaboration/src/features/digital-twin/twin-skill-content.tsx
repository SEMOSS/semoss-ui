import { useCallback } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	P,
	Spinner,
} from "@semoss/ui/next";
import type { InsightActions } from "@/lib/pixel";
import { readTwinSkill } from "./api/twin-skills";
import { useTwinRead } from "./use-twin-read";

interface TwinSkillContentProps {
	/** The skill whose complete instructions should be shown. */
	skill: { id: string; name: string };
}

/** Read the saved SKILL.md, including frontmatter, without changing the skill. */
export function TwinSkillContent({ skill }: TwinSkillContentProps) {
	const read = useCallback(
		(actions: InsightActions) => readTwinSkill(actions, skill.id),
		[skill.id],
	);
	const content = useTwinRead(read);
	return (
		<DialogContent className="max-h-dvh overflow-y-auto sm:max-w-3xl">
			<DialogHeader>
				<DialogTitle className="wrap-anywhere">
					{skill.name}
				</DialogTitle>
				<DialogDescription>
					The saved instructions your twin can follow.
				</DialogDescription>
			</DialogHeader>
			{content.isLoading ? (
				<output className="flex items-center gap-2 text-muted-foreground">
					<Spinner aria-hidden="true" />
					Loading skill…
				</output>
			) : content.error ? (
				<Alert variant="destructive">
					<AlertDescription>{content.error}</AlertDescription>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={content.reload}
					>
						Try again
					</Button>
				</Alert>
			) : (
				<P className="wrap-anywhere whitespace-pre-wrap text-base">
					{content.data || "This skill has no instructions."}
				</P>
			)}
		</DialogContent>
	);
}
