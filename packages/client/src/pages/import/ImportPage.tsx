import type { ENGINE_TYPES } from "@/types";
import { DatabasePageContent } from "../CatalogueEngines/DatabaseEngine/DatabasePageContent";
import { FunctionPageContent } from "../CatalogueEngines/FunctionEngine/FunctionPageContent";
import { ModelPageContent } from "../CatalogueEngines/ModelEngine/ModelPageContent";
import { StoragePageContent } from "../CatalogueEngines/StorageEngine/StoragePageContent";
import { VectorPageContent } from "../CatalogueEngines/VectorEngine/VectorPageContent";
import { ImportLayout } from "./ImportLayout";
import { ImportPageContent } from "./ImportPageContent";

/** TODO: Refactor */
interface ImportPageProps {
	/**
	 * Name of the section
	 */
	name: string;

	/**
	 * What engine are you importing
	 */
	type: ENGINE_TYPES;
}
export const ImportPage: React.FC<ImportPageProps> = ({ name, type }) => {
	return (
		<ImportLayout>
			{type === "VECTOR" ? (
				<VectorPageContent name={name} />
			) : type === "MODEL" ? (
				<ModelPageContent name={name} />
			) : type === "DATABASE" ? (
				<DatabasePageContent name={name} />
			) : type === "STORAGE" ? (
				<StoragePageContent name={name} />
			) : type === "FUNCTION" ? (
				<FunctionPageContent name={name} />
			) : (
				<ImportPageContent name={name} type={type} />
			)}
		</ImportLayout>
	);
};
