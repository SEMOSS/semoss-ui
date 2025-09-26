import { useMemo } from "react";
import { Stack } from "@semoss/ui";
import type { ENGINE_TYPES } from "@/types";
import { ImportLayout } from "./ImportLayout";
import { ImportPageContent } from "./ImportPageContent";
import { ModelImportFlow } from "./model/ModelImportFlow";

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
	// TODO: Start With Model Import Flow, utilize old component for other flows for now
	const EngineImportFlow = useMemo(() => {
		switch (type) {
			case "DATABASE":
				return <ImportPageContent name={name} type={type} />;
			case "MODEL":
				return (
					<Stack>
						<ModelImportFlow />
						<ImportPageContent name={name} type={type} />
					</Stack>
				);
			case "VECTOR":
				return <ImportPageContent name={name} type={type} />;
			case "FUNCTION":
				return <ImportPageContent name={name} type={type} />;
			case "STORAGE":
				return <ImportPageContent name={name} type={type} />;
			default:
				return <ImportPageContent name={name} type={type} />;
		}
	}, [type]);

	return (
		<div>
			<ImportLayout>{EngineImportFlow}</ImportLayout>
		</div>
	);
};
