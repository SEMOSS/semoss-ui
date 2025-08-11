import type { ENGINE_TYPES } from "@/types";
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
		<>
			<ImportLayout>
				<ImportPageContent name={name} type={type} />
			</ImportLayout>
		</>
	);
};
