import { Accordion, type AccordionProps } from "./Accordion";
import {
	AccordionDetails,
	type AccordionDetailsProps,
} from "./AccordionDetails";
import {
	AccordionSummary,
	type AccordionSummaryProps,
} from "./AccordionSummary";

const AccordionNameSpace = Object.assign(Accordion, {
	Content: AccordionDetails,
	Trigger: AccordionSummary,
});

export type { AccordionProps, AccordionDetailsProps, AccordionSummaryProps };

export { AccordionNameSpace as Accordion };
