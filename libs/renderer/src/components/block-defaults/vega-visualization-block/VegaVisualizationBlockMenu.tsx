import { BlockComponent } from "../../../store";
import { Accordion, Stack, styled } from "@semoss/ui";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
    AIGenerationSettings,
    CodeEditorSettings,
    JsonSettings,
    QueryInputSettings,
} from "../../block-settings";
import { useBlock } from "../../../hooks";
import { DEFAULT_TRUE_VARIABLE, DEFAULT_FALSE_VARIABLE } from "../block-defaults.constants";
import { useState } from "react";

const trueSegment = DEFAULT_TRUE_VARIABLE;
const falseSegment = DEFAULT_FALSE_VARIABLE;

const StyledAccordionTrigger = styled(Accordion.Trigger)(() => ({
    "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
        transform: "rotate(180deg)",
    },
}));
const StyledSpan = styled('span')(() => ({
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
    const [expandAccordion, setExpandAccordion] = useState(true);
    return (
        <Stack padding={2} height="100%">
            <Accordion
                expanded={expandAccordion}
                onChange={() =>
                    setExpandAccordion((expandAccordion) => !expandAccordion)
                }
            >
                <StyledAccordionTrigger expandIcon={<ExpandMoreIcon />}>
                    <StyledSpan>
                        CONDITIONAL
                    </StyledSpan>
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
        </Stack>
    );
};
