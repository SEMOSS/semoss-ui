import type { FieldDefinition } from "./model-import.constants";

interface ModelImportFormProps {
	/**
	 * Fields to be rendered in the form
	 */
	fields: FieldDefinition[];
	/**
	 * advanced Fields to be rendered in the form (collapsible section)
	 */
	advanced: FieldDefinition[];
}

export const ModelImportForm = (props: ModelImportFormProps) => {
	return <div>Model Import Form</div>;
};
