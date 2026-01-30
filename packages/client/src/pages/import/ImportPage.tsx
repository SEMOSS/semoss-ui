import { useMemo } from "react";
import { DatabasePageContent } from "@/components/import/database/DatabasePageContent";
import { FunctionImport } from "@/components/import/function/FunctionImport";
import { GuardrailImport } from "@/components/import/guardrail/GuardrailImport";
import { StorageImport } from "@/components/import/storage/StorageImport";
import { VectorImport } from "@/components/import/vector/VectorImport";
import type { ENGINE_TYPES } from "@/types";
import { ModelImport } from "../../components/import/model/ModelImport";
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
	// TODO: Start With Model Import Flow, utilize old component for other flows refactor and replace
	const EngineImportFlow = useMemo(() => {
		switch (type) {
			case "DATABASE":
				return <DatabasePageContent name={name} />;
			case "MODEL":
				return <ModelImport />;
			case "VECTOR":
				return <VectorImport name={name} />;
			case "FUNCTION":
				return <FunctionImport name={name} />;
			case "STORAGE":
				return <StorageImport name={name} />;
			case "GUARDRAIL":
				return <GuardrailImport name={name} />;
			default:
				return <ImportPageContent name={name} type={type} />;
		}
	}, [type]);

	return <ImportLayout>{EngineImportFlow}</ImportLayout>;
};
