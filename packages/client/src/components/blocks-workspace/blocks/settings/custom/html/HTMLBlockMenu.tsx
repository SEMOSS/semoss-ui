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
import {
	AIGenerationSettings,
	CodeEditorSettings,
	QueryInputSettings,
} from "../../";

const trueSegment = DEFAULT_TRUE_VARIABLE;
const falseSegment = DEFAULT_FALSE_VARIABLE;

export const HTMLBlockMenu: BlockComponent = ({ id }) => {
	const { data } = useBlock(id);
	console.log({
		id,
		data,
	});
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
			<div className="min-h-[250px] pb-6">
				<CodeEditorSettings id={id} path="html" />
			</div>
			{/* the AI tool input and button underneath editor is fixed / working */}
			{!data.variation && (
				<AIGenerationSettings
					id={id}
					path="html"
					appendPrompt={`Use the previous user prompt to create code for an HTML file.`}
					placeholder="Ex: Generate an HTML login page."
					valueAsObject
				/>
			)}
		</div>
	);
};
