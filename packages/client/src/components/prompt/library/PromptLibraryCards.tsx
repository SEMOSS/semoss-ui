import type { Prompt, Token } from "../prompt.types";
import { PromptCard } from "./PromptCard";

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
	 *
	 * TODO: The issue is the way this component is set up we specify Input Types.
	 * And the reason for that is because we wanted to construct the app for them just off this click
	 * MODIFICATIONS: When they click prompt we take them to step 2, to identify additional holes in the prompt, or simply stick with what we have
	 */
	onClick: (prompt: Prompt) => void;
}

export const PromptLibraryCards = (props: PromptLibraryCardsProps) => {
	const { prompts, filter, onClick } = props;

	return (
		<div className="grid grid-cols-12 gap-4">
			<div className="col-span-12">
				<h6 className="text-lg font-semibold capitalize">
					{`${filter} (${prompts.length})`}
				</h6>
			</div>
			{Array.from(prompts, (prompt, i) => {
				return (
					<div className="col-span-4" key={i}>
						<PromptCard
							prompt={prompt}
							onClick={(p) => {
								onClick(p);
							}}
						/>
						{/* <PromptCardOld
                            cardKey={`${i}`}
                            title={prompt.title}
                            tags={prompt.tags}
                            tokens={prompt.inputs}
                            inputTypes={prompt.inputTypes}
                            openUIBuilderForTemplate={() => {
                                props.openUIBuilderForTemplate(
                                    prompt.title,
                                    prompt.tags,
                                    prompt.inputs,
                                    prompt.inputTypes,
                                );
                            }}
                        /> */}
					</div>
				);
			})}
		</div>
	);
};
