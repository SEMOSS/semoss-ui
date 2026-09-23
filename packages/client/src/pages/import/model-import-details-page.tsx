import type { CatalogMatchState } from "@/components/import/model/model-catalog-match";
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
	onModelIdChange?: (modelId: string) => void;
	catalogMatch?: CatalogMatchState | null;
	pickedCatalogKey?: string | null;
	onPickCatalogKey?: (catalogKey: string | null) => void;
}

export const ModelImportDetailsPage: React.FC<ModelImportDetailsPageProps> = ({
	fields,
	advanced,
	selectedProvider,
	importableModelsCategory,
	onModelIdChange,
	catalogMatch,
	pickedCatalogKey,
	onPickCatalogKey,
}) => {
	return (
		<ModelImportForm
			fields={fields}
			advanced={advanced}
			selectedProvider={selectedProvider}
			importableModelsCategory={importableModelsCategory}
			onModelIdChange={onModelIdChange}
			catalogMatch={catalogMatch}
			pickedCatalogKey={pickedCatalogKey}
			onPickCatalogKey={onPickCatalogKey}
		/>
	);
};
