import { CatalogImageSettings } from "@/features/catalog-images/catalog-image-settings";
import { useEngine } from "@/hooks/useEngine";

/** Edit the image for any engine catalog using its resource permission. */
export function EngineImageSettingsPage() {
	const { engine, permission } = useEngine();
	return (
		<CatalogImageSettings
			key={engine.engine_id}
			resource="ENGINE"
			id={engine.engine_id}
			name={engine.engine_display_name || engine.engine_name}
			canEdit={permission === "OWNER" || permission === "EDIT"}
		/>
	);
}
