import { getFileIconComponent } from "@semoss/shared";
import type { WorkbenchPanelIconProps } from "@semoss/workbench";
import { useWorkbenchPanel } from "@semoss/workbench";

/**
 * A file panel's tab glyph: the icon for its file type.
 *
 * Every file panel draws the same thing, so they share one renderer instead of
 * repeating the closure in eight blueprints. It reads `config.path`, falling
 * back to `config.name` — the toolbox editor carries a display name whose
 * extension is the honest one.
 *
 * Its config is typed to only the two fields the glyph is chosen from —
 * deliberately narrower than `FilePanelParams`, so one renderer fits every
 * blueprint.
 */
export const FilePanelIcon = ({ id, className }: WorkbenchPanelIconProps) => {
	const { config } = useWorkbenchPanel<{ path?: string; name?: string }>(id);
	const Icon = getFileIconComponent(config.path || config.name || "");
	return <Icon className={className} />;
};
