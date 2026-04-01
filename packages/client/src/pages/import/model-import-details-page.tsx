import type {
	CategoryTexts,
	FieldDefinition,
} from "@/components/import/model/model-import.constants";
import { ModelImportForm } from "@/components/import/model/model-import-form";

interface ModelImportDetailsPageProps {
	fields: FieldDefinition[];
	advanced: FieldDefinition[];
	selectedProvider: string;
	importableModelsCategory: CategoryTexts | null;
}

export const ModelImportDetailsPage: React.FC<ModelImportDetailsPageProps> = ({
	fields,
	advanced,
	selectedProvider,
	importableModelsCategory,
}) => {
	return (
		<ModelImportForm
			fields={fields}
			advanced={advanced}
			selectedProvider={selectedProvider}
			importableModelsCategory={importableModelsCategory}
		/>
	);
};
