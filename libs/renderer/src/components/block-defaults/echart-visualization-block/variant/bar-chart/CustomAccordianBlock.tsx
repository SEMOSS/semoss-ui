import { ReactNode, useState } from "react";
import { AccordionDetails, AccordionSummary } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import { Accordion, styled } from "@semoss/ui";

export interface accordianDef {
    accordianExpanded: false;
    accordianSummaryProps: {
        expandIcon: ReactNode;
        ariaControls: string;
        id: string;
    };
    accordianSummary: any;
    accordianDetails: any;
}
const StyledAccordionTrigger = styled(Accordion.Trigger)(() => ({
    "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
        transform: "rotate(90deg)",
    },
}));
//creates an accordion based on data received from called components
const CustomAccordianBlock = ({
    accordianExpanded,
    accordianSummaryProps,
    accordianSummary,
    accordianDetails,
}) => {
    const [expandAccordion, setExpandAccordion] = useState(accordianExpanded);
    return (
        <>
            <Accordion
                expanded={expandAccordion}
                onChange={() =>
                    setExpandAccordion((expandAccordion) => !expandAccordion)
                }
            >
                <StyledAccordionTrigger expandIcon={accordianSummaryProps}>
                    {accordianSummary}
                </StyledAccordionTrigger>
                <Accordion.Content>{accordianDetails}</Accordion.Content>
            </Accordion>
        </>
    );
};
export default CustomAccordianBlock;
