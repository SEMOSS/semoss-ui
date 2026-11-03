import { CatalogSettingsLayout } from "@/components/catalog/catalog-settings-layout";
import { useEngine } from "@/hooks/useEngine";
import { getEngineSettingsSections } from "./engine-settings-sections";

/**
 * Layout for every engine's Settings tab: a small left sidebar that switches
 * between the sections the viewer has on the engine, with the active section
 * rendered beside it.
 */
export const EngineSettingsLayout = () => {
	const { catalog, type, permission } = useEngine();

	return (
		<CatalogSettingsLayout
			sections={getEngineSettingsSections(type, permission, catalog.name)}
			ariaLabel="Engine settings sections"
			testIdPrefix="engine-settings-layout"
		/>
	);
};
