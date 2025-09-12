import type { ENGINE_TYPES } from "@/types";
import { DatabasePageContent } from "../CatalogueEngines/DatabaseEngine/DatabasePageContent";
import { ModelPageContent } from "../CatalogueEngines/ModelEngine/ModelPageContent";
import { VectorPageContent } from "../CatalogueEngines/vectorEngine/VectorPageContent";
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
			) : (
				<ImportPageContent name={name} type={type} />
			)}
		</ImportLayout>
	);
};
