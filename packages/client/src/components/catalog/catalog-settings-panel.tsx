import { useState } from "react";
import { CatalogSettingsFrame } from "./catalog-settings-frame";
import type { CatalogSettingsSection } from "./catalog-settings-layout";
import {
	CatalogSettingsNavItemContent,
	getCatalogSettingsNavItemClassName,
} from "./catalog-settings-nav-item";

/** A Settings section the panel renders itself, since it has no routes. */
export interface CatalogSettingsPanelSection extends CatalogSettingsSection {
	/** The section's content */
	element: React.ReactNode;
}

export interface CatalogSettingsPanelProps {
	/** Sections the viewer can open, in order. The first one opens by default. */
	sections: CatalogSettingsPanelSection[];
	/** Accessible name for the section nav */
	ariaLabel: string;
	/** Prefix for each nav button's data-testid, e.g. "project-settings-panel" */
	testIdPrefix: string;
}

/**
 * A catalog entry's Settings in a place without routes, such as a workbench
 * panel: the same section nav and frame as {@link CatalogSettingsLayout}, with
 * the open section kept in state rather than the URL.
 */
export const CatalogSettingsPanel = ({
	sections,
	ariaLabel,
	testIdPrefix,
}: CatalogSettingsPanelProps) => {
	const [selectedPath, setSelectedPath] = useState<string | null>(null);
	// a section the viewer can no longer open falls back to the first
	const activeSection =
		sections.find((section) => section.path === selectedPath) ??
		sections[0];

	return (
		<CatalogSettingsFrame
			ariaLabel={ariaLabel}
			nav={sections.map((section) => {
				const isActive = section.path === activeSection?.path;
				return (
					<button
						key={section.path}
						type="button"
						aria-current={isActive ? "true" : undefined}
						data-testid={`${testIdPrefix}--${section.path}-btn`}
						className={getCatalogSettingsNavItemClassName(isActive)}
						onClick={() => setSelectedPath(section.path)}
					>
						<CatalogSettingsNavItemContent section={section} />
					</button>
				);
			})}
		>
			{activeSection?.element ?? null}
		</CatalogSettingsFrame>
	);
};
