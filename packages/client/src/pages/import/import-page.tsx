import { useMemo } from "react";
import { DatabasePageContent } from "@/components/import/database/database-page-content";
import { FunctionImport } from "@/components/import/function/function-import";
import { GuardrailImport } from "@/components/import/guardrail/guardrail-import";
import { StorageImport } from "@/components/import/storage/storage-import";
import { VectorImport } from "@/components/import/vector/vector-import";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import type { ENGINE_TYPES } from "@/types";
import { ImportLayout } from "./import-layout";
import { ModelImportPage } from "./model-import-page";

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
				return <ModelImportPage />;
			case "VECTOR":
				return <VectorImport name={name} />;
			case "FUNCTION":
				return <FunctionImport name={name} />;
			case "STORAGE":
				return <StorageImport name={name} />;
			case "GUARDRAIL":
				return <GuardrailImport name={name} />;
			default:
				return null;
		}
	}, [name, type]);

	return (
		<>
			<NavbarLeft>
				<NavbarHeader />
			</NavbarLeft>
			<ImportLayout>{EngineImportFlow}</ImportLayout>
		</>
	);
};
