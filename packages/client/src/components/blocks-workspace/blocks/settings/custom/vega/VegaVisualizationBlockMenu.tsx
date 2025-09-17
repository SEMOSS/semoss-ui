import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useEffect, useState } from "react";
import { BlockComponent, useBlock } from "@semoss/renderer";
import { Accordion, Stack, styled } from "@semoss/ui";
import {
	DEFAULT_FALSE_VARIABLE,
	DEFAULT_TRUE_VARIABLE,
} from "../../../block-settings/block-defaults.constants";
import { AIGenerationSettings, JsonSettings } from "../../";

const _trueSegment = DEFAULT_TRUE_VARIABLE;
const _falseSegment = DEFAULT_FALSE_VARIABLE;

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

const _barGraphJSON = `
{
  "description": "A basic bar chart example, with value labels shown upon pointer hover.",
  "width": 400,
  "height": 200,
  "padding": 5,

  "data": [
    {
      "name": "table",
      "values": [
        {"category": "A", "amount": 28},
        {"category": "B", "amount": 55},
        {"category": "C", "amount": 43},
        {"category": "D", "amount": 91},
        {"category": "E", "amount": 81},
        {"category": "F", "amount": 53},
        {"category": "G", "amount": 19},
        {"category": "H", "amount": 87}
      ]
    }
  ],

  "signals": [
    {
      "name": "tooltip",
      "value": {},
      "on": [
        {"events": "rect:pointerover", "update": "datum"},
        {"events": "rect:pointerout",  "update": "{}"}
      ]
    }
  ],

  "scales": [
    {
      "name": "xscale",
      "type": "band",
      "domain": {"data": "table", "field": "category"},
      "range": "width",
      "padding": 0.05,
      "round": true
    },
    {
      "name": "yscale",
      "domain": {"data": "table", "field": "amount"},
      "nice": true,
      "range": "height"
    }
  ],

  "axes": [
    { "orient": "bottom", "scale": "xscale" },
    { "orient": "left", "scale": "yscale" }
  ],

  "marks": [
    {
      "type": "rect",
      "from": {"data":"table"},
      "encode": {
        "enter": {
          "x": {"scale": "xscale", "field": "category"},
          "width": {"scale": "xscale", "band": 1},
          "y": {"scale": "yscale", "field": "amount"},
          "y2": {"scale": "yscale", "value": 0}
        },
        "update": {
          "fill": {"value": "steelblue"}
        },
        "hover": {
          "fill": {"value": "red"}
        }
      }
    },
    {
      "type": "text",
      "encode": {
        "enter": {
          "align": {"value": "center"},
          "baseline": {"value": "bottom"},
          "fill": {"value": "#333"}
        },
        "update": {
          "x": {"scale": "xscale", "signal": "tooltip.category", "band": 0.5},
          "y": {"scale": "yscale", "signal": "tooltip.amount", "offset": -2},
          "text": {"signal": "tooltip.amount"},
          "fillOpacity": [
            {"test": "datum === tooltip", "value": 0},
            {"value": 1}
          ]
        }
      }
    }
  ]
}
`;

export const VegaVisualizationBlockMenu: BlockComponent = ({ id }) => {
	const { data } = useBlock(id);
	const [_expandAccordion, _setExpandAccordionn] = useState(true);
	const [_aiOutputJSON, setAIOutputJSON] = useState<string | null>(null);
	const [expandJsonAccordion, setExpandJsonAccordion] = useState(false);
	useEffect(() => {
		console.log(
			"aiOutputJSON from VegaVisualizationBlockMenu: ",
			_aiOutputJSON,
		);
	}, [_aiOutputJSON]);
	return (
		<Stack padding={2} height="100%" justifyContent={"space-between"}>
			{/* <Accordion
				expanded={expandAccordion}
				onChange={() =>
					setExpandAccordion((expandAccordion) => !expandAccordion)
				}
			>
				<StyledAccordionTrigger expandIcon={<ExpandMoreIcon />}>
					<StyledSpan>CONDITIONAL</StyledSpan>
				</StyledAccordionTrigger>
				<Accordion.Content>
					<QueryInputSettings
						id={id}
						label="Show Block"
						path="show"
						defaultPathMap={{
							...trueSegment,
							...falseSegment,
						}}
					/>
				</Accordion.Content>
			</Accordion> */}
			{/* CodeEditorSettings is a dup of JsonSettings with LLM prompting and wordwrap added to the editor and ability to work with HTML as well as JSON */}
			{/* Not sure if we want to delete JsonSettings but it's no longer in use here */}
			<Accordion
				expanded={expandJsonAccordion}
				onChange={() =>
					setExpandJsonAccordion(
						(expandJsonAccordion) => !expandJsonAccordion,
					)
				}
			>
				<StyledAccordionTrigger expandIcon={<ExpandMoreIcon />}>
					<StyledSpan>VEGA SPECIFICATION (JSON EDITOR)</StyledSpan>
				</StyledAccordionTrigger>
				<JsonSettings
					id={id}
					path="specJson"
					aiOutputJSON={_aiOutputJSON}
					// aiOutputJSON={barGraphJSON}
					height="300px"
				/>
			</Accordion>
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
					setAIOutputJSON={setAIOutputJSON}
				/>
			)}
		</Stack>
	);
};
