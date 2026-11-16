import { toast } from "@semoss/ui/next";

/**
 * A save the server refused leaves the page showing a change it does not hold. Say so, then read the owner's
 * data again once the queued saves finish, so the page shows what is saved. Only if that read fails too is a
 * page reload left to the owner.
 */
export async function recoverFromFailedSave(
	message: string,
	settled: () => Promise<void>,
	reload: () => Promise<void>,
): Promise<void> {
	toast.error(`Could not save: ${message}. Showing what is saved instead.`);
	try {
		await settled();
		await reload();
	} catch {
		toast.error("Could not read your saved data.", {
			action: {
				label: "Reload",
				onClick: () => window.location.reload(),
			},
		});
	}
}
