import type { Prompt, Token } from "../prompt.types";
import { PromptCard } from "./prompt-card";

type ViewMode = "grid" | "list";

interface PromptLibraryCardsProps {
	/**
	 * List of prompts to display
	 */
	prompts: Prompt[];

	/**
	 * View mode - grid or list
	 */
	view?: ViewMode;

	/**
	 * Current user ID for ownership checks
	 */
	currentUserId?: string;

	/**
	 * TODO: Get rid of this and use onClick
	 */
	openUIBuilderForTemplate?: (
		title: string,
		tags: string[],
		inputs: Token[],
		inputTypes: object,
	) => void;

	/**
	 * TODO: Get rid of above and have onClick replace the functionality we had in Agent Builder
	 */
	onClick: (prompt: Prompt) => void;

	/**
	 * Callback when a prompt is deleted
	 */
	onDelete?: (prompt: Prompt) => void;
}

export const PromptLibraryCards = (props: PromptLibraryCardsProps) => {
	const { prompts, view = "grid", currentUserId, onClick, onDelete } = props;

	const containerClass =
		view === "list"
			? "flex flex-col gap-2"
			: "grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4";

	return (
		<div className={containerClass}>
			{prompts.map((prompt, i) => (
				<PromptCard
					key={prompt.id || i}
					prompt={prompt}
					variant={view === "list" ? "row" : "catalog"}
					isOwner={currentUserId === prompt.created_by}
					onDelete={onDelete}
					onClick={(p) => {
						onClick(p);
					}}
				/>
			))}
		</div>
	);
};
