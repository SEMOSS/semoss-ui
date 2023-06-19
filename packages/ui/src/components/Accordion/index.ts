import { Accordion as _Accordion, AccordionProps } from "./Accordion";
import { AccordionDetails, AccordionDetailsProps } from "./AccordionDetails";
import { AccordionSummary, AccordionSummaryProps } from "./AccordionSummary";

const AccordionNameSpace = Object.assign(_Accordion, {
    Content: AccordionDetails,
    Trigger: AccordionSummary,
});

export type { AccordionProps, AccordionDetailsProps, AccordionSummaryProps };

export { AccordionNameSpace as Accordion };
