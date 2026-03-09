import {
	FORM_BUILDER_ACTIONS_STEP,
	FORM_BUILDER_DATABASE_STEP,
	FORM_BUILDER_FIELDS_STEP,
	FORM_BUILDER_NAME_STEP,
	FORM_BUILDER_PREVIEW_STEP,
} from "../form-builder.constants";
import type { FormBuilderState } from "../form-builder.types";
import { FormBuilderActionsStep } from "./FormBuilderActionsStep";
import { FormBuilderDatabaseStep } from "./FormBuilderDatabaseStep";
import { FormBuilderFieldsStep } from "./FormBuilderFieldsStep";
import { FormBuilderNameStep } from "./FormBuilderNameStep";
import { FormBuilderPreviewStep } from "./FormBuilderPreviewStep";

interface FormBuilderStepProps {
	currentStep: number;
	state: FormBuilderState;
	onUpdate: (updates: Partial<FormBuilderState>) => void;
}

export const FormBuilderStep = ({
	currentStep,
	state,
	onUpdate,
}: FormBuilderStepProps) => {
	switch (currentStep) {
		case FORM_BUILDER_NAME_STEP:
			return <FormBuilderNameStep state={state} onUpdate={onUpdate} />;
		case FORM_BUILDER_DATABASE_STEP:
			return (
				<FormBuilderDatabaseStep state={state} onUpdate={onUpdate} />
			);
		case FORM_BUILDER_ACTIONS_STEP:
			return <FormBuilderActionsStep state={state} onUpdate={onUpdate} />;
		case FORM_BUILDER_FIELDS_STEP:
			return <FormBuilderFieldsStep state={state} onUpdate={onUpdate} />;
		case FORM_BUILDER_PREVIEW_STEP:
			return <FormBuilderPreviewStep state={state} />;
		default:
			return null;
	}
};
