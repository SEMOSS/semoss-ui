import { useMemo } from "react";
import { useTranslation } from "@semoss/i18n";
import { usePixel } from "@semoss/sdk/react";
import { Muted, ScrollArea, Spinner } from "@semoss/ui/next";
import type { Prompt } from "@/types";

interface WorkspacePromptListProps {
	/** Prompt IDs from the workspace */
	promptIds: string[];
}

/**
 * Read-only list of prompts configured for an agent.
 * Renders title + context for each.
 */
export const WorkspacePromptList = ({
	promptIds,
}: WorkspacePromptListProps) => {
	const { t } = useTranslation("workspace");

	const ids = useMemo(
		() => promptIds.filter(Boolean).map((p) => `"${p}"`),
		[promptIds],
	);

	const getPrompts = usePixel<Prompt[]>(
		ids.length > 0
			? `META | ListPrompt(filters=[Filter( (PROMPT__ID == [${ids.join(", ")}]) )])`
			: "",
		{ data: [] },
	);

	if (promptIds.length === 0) {
		return (
			<div className="flex min-h-32 w-full items-center justify-center p-6">
				<Muted>{t("prompts.noPrompts")}</Muted>
			</div>
		);
	}

	if (getPrompts.status === "LOADING") {
		return (
			<div className="flex min-h-32 w-full items-center justify-center p-6">
				<Spinner />
			</div>
		);
	}

	const prompts = getPrompts.data ?? [];

	if (prompts.length === 0) {
		return (
			<div className="flex min-h-32 w-full items-center justify-center p-6">
				<Muted>{t("prompts.noPrompts")}</Muted>
			</div>
		);
	}

	return (
		<ScrollArea className="h-full w-full">
			<div className="flex flex-col gap-3 p-4">
				{prompts.map((p) => (
					<div
						key={p.id}
						className="flex flex-col gap-1 rounded-lg border border-border bg-card px-4 py-3"
					>
						<div className="font-semibold text-foreground text-sm">
							{p.title}
						</div>
						{p.context ? (
							<div className="line-clamp-3 whitespace-pre-wrap text-muted-foreground text-sm">
								{p.context}
							</div>
						) : null}
					</div>
				))}
			</div>
		</ScrollArea>
	);
};
