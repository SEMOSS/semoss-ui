import { type ReactNode, useCallback, useMemo, useState } from "react";
import { SettingsDialog } from "./settings-dialog";
import {
	SettingsDialogContext,
	type SettingsDialogContextValue,
	type SettingsSectionId,
} from "./settings-dialog.context";

/** Props for {@link SettingsDialogProvider}. */
export interface SettingsDialogProviderProps {
	/** The layout that can open the dialog. */
	children: ReactNode;
}

/**
 * Owns the settings dialog: renders it once, and lets anything below it open
 * it on a given page with `useSettingsDialog`.
 */
export const SettingsDialogProvider = ({
	children,
}: SettingsDialogProviderProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [section, setSection] = useState<SettingsSectionId>("general");

	const openSettings = useCallback((next: SettingsSectionId = "general") => {
		setSection(next);
		setIsOpen(true);
	}, []);

	const value = useMemo<SettingsDialogContextValue>(
		() => ({ openSettings: openSettings }),
		[openSettings],
	);

	return (
		<SettingsDialogContext.Provider value={value}>
			{children}
			<SettingsDialog
				open={isOpen}
				onOpenChange={setIsOpen}
				section={section}
				onSectionChange={setSection}
			/>
		</SettingsDialogContext.Provider>
	);
};
