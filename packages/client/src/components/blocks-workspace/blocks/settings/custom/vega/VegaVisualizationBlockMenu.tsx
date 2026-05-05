import { type BlockComponent, useBlock } from "@semoss/renderer";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@semoss/ui/next";
import {
	DEFAULT_FALSE_VARIABLE,
	DEFAULT_TRUE_VARIABLE,
} from "../../../block-settings/block-defaults.constants";
import { AIGenerationSettings, JsonSettings, QueryInputSettings } from "../../";

const trueSegment = DEFAULT_TRUE_VARIABLE;
const falseSegment = DEFAULT_FALSE_VARIABLE;

export const VegaVisualizationBlockMenu: BlockComponent = ({ id }) => {
	const { data } = useBlock(id);
	return (
		<div className="flex h-full flex-col p-4">
			<Accordion type="single" collapsible defaultValue="conditional">
				<AccordionItem value="conditional">
					<AccordionTrigger>
						<span className="font-bold text-sm uppercase tracking-wide">
							CONDITIONAL
						</span>
					</AccordionTrigger>
					<AccordionContent>
						<QueryInputSettings
							id={id}
							label="Show Block"
							path="show"
							defaultPathMap={{
								...trueSegment,
								...falseSegment,
							}}
						/>
					</AccordionContent>
				</AccordionItem>
			</Accordion>
			{/* CodeEditorSettings is a dup of JsonSettings with LLM prompting and wordwrap added to the editor and ability to work with HTML as well as JSON */}
			{/* Not sure if we want to delete JsonSettings but it's no longer in use here */}
			<JsonSettings id={id} path="specJson" />

			{/* <CodeEditorSettings id={id} path="specJson" /> */}
			{!data.variation && (
				<AIGenerationSettings
					id={id}
					path="specJson"
					appendPrompt={
						'Use vega lite version 5 and make the schema as simple as possible. Return the response as JSON. Ensure "data" is a top-level key in the JSON object.'
					}
					placeholder="Ex: Generate a bar graph."
					valueAsObject
				/>
			)}
		</div>
	);
};
