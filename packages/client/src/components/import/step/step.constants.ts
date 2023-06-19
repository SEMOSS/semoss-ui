import { Step } from './step.types';
import { LandingStep, LandingStepConfig } from './LandingStep';
import { FileUploadStep, FileUploadStepConfig } from './FileUploadStep';
import { MetaModelStep, MetaModelStepConfig } from './MetaModelStep';
import { DataSelectionStep, DataSelectionConfig } from './DataSelectionStep';

/** List of the registered steps */
export type RegisteredStep = Step<
    | LandingStepConfig
    | FileUploadStepConfig
    | MetaModelStepConfig
    | DataSelectionConfig
>;

export const REGISTRY = {
    [LandingStep.config.id]: LandingStep,
    [FileUploadStep.config.id]: FileUploadStep,
    [MetaModelStep.config.id]: MetaModelStep,
    [DataSelectionStep.config.id]: DataSelectionStep,
};
