import { getFileIconComponent } from "@semoss/shared";

interface FilePanelIconProps {
	/**
	 * Only the two fields the glyph is chosen from — deliberately narrower than
	 * `FilePanelParams`, so one renderer fits every blueprint's own `P`/`V`
	 * without being generic over them.
	 */
	config: { path?: string; name?: string };
	className: string;
}

/**
 * A file panel's tab glyph: the icon for its file type.
 *
 * Every file panel draws the same thing, so they share one renderer instead of
 * repeating the closure in eight blueprints. It reads `config.path`, falling
 * back to `config.name` — the toolbox editor carries a display name whose
 * extension is the honest one.
 */
export const FilePanelIcon = ({ config, className }: FilePanelIconProps) => {
	const Icon = getFileIconComponent(config.path || config.name || "");
	return <Icon className={className} />;
};
