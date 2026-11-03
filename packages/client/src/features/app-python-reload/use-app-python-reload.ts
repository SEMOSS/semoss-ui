import { useState } from "react";
import { reloadApp } from "@semoss/sdk";
import { toast } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { useSession } from "@/hooks/use-session";

/** What {@link useAppPythonReload} gives its caller. */
export interface UseAppPythonReloadResult {
	/** Whether a reload is running */
	isReloading: boolean;
	/** Reloads the app's python files, reporting the outcome in toasts */
	reloadPython: () => Promise<void>;
}

/**
 * Reloads an app's python files without restarting python (ReloadProject),
 * tracking whether the reload is running. Editors and owners can reload.
 *
 * @param appId - The app whose python files to reload.
 * @returns The reload action and its state.
 */
export const useAppPythonReload = (appId: string): UseAppPythonReloadResult => {
	const insightID = useSession((state) => state.insightID);
	const [isReloading, setIsReloading] = useState(false);

	const reloadPython = async () => {
		setIsReloading(true);
		let success: string[];
		let warnings: string[];
		try {
			({ success, warnings } = await reloadApp(appId, insightID));
		} catch (e: unknown) {
			toast.error(
				getErrorMessage(e, "Could not reload the python files"),
			);
			setIsReloading(false);
			return;
		}
		setIsReloading(false);
		// a reload that failed everywhere reports only its warnings
		const [message] = success;
		if (message) {
			toast.success(message);
		} else if (warnings.length === 0) {
			toast.success("Reloaded the python files");
		}
		for (const warning of warnings) {
			toast.warning(warning);
		}
	};

	return { isReloading, reloadPython };
};
