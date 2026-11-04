import { useState } from "react";
import { toast } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { getDeleteRequest } from "@/features/resource-delete/delete-request";
import { useSession } from "@/hooks/use-session";
import { GOVERNANCE_NOUNS, type GovernanceType } from "./governance-types";
import type { GovernanceResource } from "./use-governance-resources";

/** What {@link useDeleteGovernanceResources} gives its caller. */
export interface DeleteGovernanceResources {
	/** Whether the deletes are running */
	isDeleting: boolean;
	/**
	 * Deletes the resources one after another, reporting what was deleted and
	 * what was not in toasts.
	 *
	 * @param resources - The resources to delete.
	 * @returns The ids of the resources deleted.
	 */
	deleteResources: (resources: GovernanceResource[]) => Promise<string[]>;
}

/**
 * Deletes many projects or engines of one type, each with the pixel its type
 * takes, so one that fails does not stop the rest.
 *
 * @param entry - The type of the resources.
 * @returns The delete action and its state.
 */
export const useDeleteGovernanceResources = (
	entry: GovernanceType,
): DeleteGovernanceResources => {
	const runPixel = useSession((state) => state.runPixel);
	const [isDeleting, setIsDeleting] = useState(false);
	const nouns = GOVERNANCE_NOUNS[entry.kind];

	const deleteResources = async (
		resources: GovernanceResource[],
	): Promise<string[]> => {
		setIsDeleting(true);
		const deleted: string[] = [];
		const failures: string[] = [];
		for (const resource of resources) {
			const request =
				entry.kind === "PROJECT"
					? getDeleteRequest("PROJECT", resource.id, entry.type)
					: getDeleteRequest(entry.type, resource.id);
			if (!request) {
				failures.push(`${resource.name}: cannot be deleted here.`);
				continue;
			}
			try {
				const response = await runPixel(request.pixel);
				const [result] = response.pixelReturn;
				if (!result || result.operationType.indexOf("ERROR") > -1) {
					failures.push(
						`${resource.name}: ${String(result?.output ?? "not deleted.")}`,
					);
				} else {
					deleted.push(resource.id);
				}
			} catch (e) {
				failures.push(
					`${resource.name}: ${getErrorMessage(e, "not deleted.")}`,
				);
			}
		}
		setIsDeleting(false);
		if (deleted.length > 0) {
			toast.success(
				`Deleted ${deleted.length} ${
					deleted.length === 1 ? nouns.singular : nouns.plural
				}`,
			);
		}
		if (failures.length > 0) {
			toast.error(failures.join(" "));
		}
		return deleted;
	};

	return { isDeleting, deleteResources };
};
