import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useState } from "react";
import { BlockComponent, useBlock } from "@semoss/renderer";
import { Accordion, Stack, styled } from "@semoss/ui";
import { AIGenerationSettings, JsonSettings } from "../../";

const StyledAccordionTrigger = styled(Accordion.Trigger)(() => ({
	"& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
		transform: "rotate(180deg)",
	},
}));
const StyledSpan = styled("span")(() => ({
	fontSize: "14px",
	fontStyle: "normal",
	lineHeight: "143%",
	letterSpacing: "0.17px",
	fontFamily: '"Inter", sans-serif',
	textTransform: "uppercase",
	fontWeight: "bold",
}));
export const VegaVisualizationBlockMenu: BlockComponent = ({ id }) => {
	const { data } = useBlock(id);
	const [expandAccordion, setExpandAccordion] = useState(false);
	return (
		<Stack padding={2} height="100%" justifyContent={"space-between"}>
			<Accordion
				expanded={expandAccordion}
				onChange={() =>
					setExpandAccordion((expandAccordion) => !expandAccordion)
				}
			>
				<StyledAccordionTrigger expandIcon={<ExpandMoreIcon />}>
					<StyledSpan>VEGA JSON</StyledSpan>
				</StyledAccordionTrigger>
				<Accordion.Content>
					<JsonSettings id={id} path="specJson" height="300px" />
				</Accordion.Content>
			</Accordion>

			{!data.variation && (
				<AIGenerationSettings
					id={id}
					path="specJson"
					appendPrompt={
						'Use vega lite version 5 and make the schema as simple as possible. Return the response as JSON. Ensure "data" is a top-level key in the JSON object.'
					}
					placeholder="Ex: Generate a bar graph."
					showFileUpload
				/>
			)}
		</Stack>
	);
};
