import { RegisteredStep } from './step.constants';

/** Actual Step data */
export interface Step<C extends StepConfig> {
    /** ID of the current step */
    id: C['id'];

    /** Data associated with each step */
    data: C['data'];

    /** name of the current step */
    name: string;
}

/** Configuration information related to each step */
export interface StepConfig {
    /** ID of the current step */
    id: string;

    /** Data associated with each step */
    data: Record<string, unknown>;
}

export interface StepComponentProps<C extends StepConfig> {
    /** Index of the current step */
    stepIdx: number;

    /** Information related to the current step that */
    step: Step<C>;

    /** Update the current step of the flow */
    updateStep: (step: Partial<Step<C>>) => RegisteredStep[];

    /** Method that will navigate to  the next step of the import flow */
    navigateStep: (index: number) => void;

    /** Current list of steps */
    steps: RegisteredStep[];

    /** Method that will update all of the step of the import flow */
    updateSteps: (steps: RegisteredStep[]) => void;
}

export type StepComponent<C extends StepConfig> = React.FunctionComponent<
    StepComponentProps<C>
> & {
    /** Initial configuration of the step */
    config: {
        /** ID of the current step */
        id: C['id'];

        /** Data associated with each step */
        data: C['data'];
    };
};
