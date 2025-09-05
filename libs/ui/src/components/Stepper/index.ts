import { Step, type StepProps } from "./Step";
import { StepContent, type StepContentProps } from "./StepContent";
import { StepLabel, type StepLabelProps } from "./StepLabel";
import { Stepper, type StepperProps } from "./Stepper";

const StepperNameSpace = Object.assign(Stepper, {
	Step: Step,
	StepLabel: StepLabel,
	StepContent: StepContent,
});

export type { StepperProps, StepProps, StepLabelProps, StepContentProps };

export { StepperNameSpace as Stepper };
