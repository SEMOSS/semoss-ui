import type { Prompt, Token } from "../prompt.types";
import { PromptCard } from "./PromptCard";

type ViewMode = "grid" | "list";

interface PromptLibraryCardsProps {
	/**
	 * List of prompts to display
	 */
	prompts: Prompt[];

	/**
	 *
	 */
	filter: string;

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
	const {
		prompts,
		filter,
		view = "grid",
		currentUserId,
		onClick,
		onDelete,
	} = props;

	return (
		<div className="flex flex-col gap-4">
			<h4 className="font-semibold text-lg capitalize">
				{`${filter} (${prompts.length})`}
			</h4>
			{view === "grid" ? (
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{prompts.map((prompt, i) => (
						<PromptCard
							key={prompt.id || i}
							prompt={prompt}
							variant="catalog"
							isOwner={currentUserId === prompt.created_by}
							onDelete={onDelete}
							onClick={(p) => {
								onClick(p);
							}}
						/>
					))}
				</div>
			) : (
				<div className="flex flex-col divide-y rounded-lg border">
					{prompts.map((prompt, i) => (
						<PromptCard
							key={prompt.id || i}
							prompt={prompt}
							variant="row"
							isOwner={currentUserId === prompt.created_by}
							onDelete={onDelete}
							onClick={(p) => {
								onClick(p);
							}}
						/>
					))}
				</div>
			)}
		</div>
	);
};
