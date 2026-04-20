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
import { CodeEditorSettings, QueryInputSettings } from "../../";

const trueSegment = DEFAULT_TRUE_VARIABLE;
const falseSegment = DEFAULT_FALSE_VARIABLE;

export const MermaidBlockMenu: BlockComponent = ({ id }) => {
	// biome-ignore lint/correctness/noUnusedVariables: used in JSX or callback
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
			<CodeEditorSettings id={id} path="text" />
		</div>
	);
};
