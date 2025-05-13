import { BlockComponent } from "../../../store";
import { Accordion, Stack, styled } from "@semoss/ui";
import {
    AIGenerationSettings,
    CodeEditorSettings,
    QueryInputSettings,
} from "../../block-settings";
import { useBlock } from "../../../hooks";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import {
    DEFAULT_TRUE_VARIABLE,
    DEFAULT_FALSE_VARIABLE,
} from "../block-defaults.constants";
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
export const HTMLBlockMenu: BlockComponent = ({ id }) => {
    const { data } = useBlock(id);
    const [expandAccordion, setExpandAccordion] = useState(true);
    console.log({
        id,
        data,
    });
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
            <CodeEditorSettings id={id} path="html" />

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
        </Stack>
    );
};
