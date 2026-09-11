import { getFileIconComponent } from "@semoss/shared";
import type { WorkbenchChromeProps } from "@semoss/workbench";
import type { FilePanelParams } from "./use-file-panel";

/**
 * A file panel's tab glyph: the icon for its file type.
 *
 * Every file panel draws the same thing, so they share one renderer instead of
 * repeating the closure in eight blueprints. It reads `config.path`, falling
 * back to `config.name` — the toolbox editor carries a display name whose
 * extension is the honest one.
 */
export const FilePanelIcon = ({
	config,
	className,
}: WorkbenchChromeProps<FilePanelParams> & { className: string }) => {
	const Icon = getFileIconComponent(config.path || config.name || "");
	return <Icon className={className} />;
};
