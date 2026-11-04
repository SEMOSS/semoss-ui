import { useState } from "react";
import { toast } from "@semoss/ui/next";
import { useSession } from "@/hooks/use-session";
import type { ALL_TYPES } from "@/types";
import { getDeleteRequest } from "./delete-request";

/** The resource {@link useDeleteResource} deletes. */
export interface DeleteResourceTarget {
	/** The resource's type: an engine type, or PROJECT */
	type: ALL_TYPES;
	/** The resource's id */
	id: string;
	/** For a project, its project type, which picks the delete pixel */
	projectType?: string;
}

/** What {@link useDeleteResource} gives its caller. */
export interface UseDeleteResourceResult {
	/** What the product calls the resource, such as "engine" or "agent" */
	entityLabel: string;
	/** Whether a delete is running */
	isDeleting: boolean;
	/**
	 * Deletes the resource, reporting the outcome in a toast.
	 *
	 * @returns true when the resource was deleted
	 */
	deleteResource: () => Promise<boolean>;
}

/**
 * Deletes an engine or a project with the pixel its type takes, tracking
 * whether the delete is running.
 *
 * @param target - The resource to delete.
 * @returns The delete action and its state.
 */
export const useDeleteResource = ({
	type,
	id,
	projectType,
}: DeleteResourceTarget): UseDeleteResourceResult => {
	const runPixel = useSession((state) => state.runPixel);
	const [isDeleting, setIsDeleting] = useState(false);
	const request = getDeleteRequest(type, id, projectType);

	const deleteResource = async (): Promise<boolean> => {
		if (!request) {
			toast.error("This cannot be deleted here");
			return false;
		}
		setIsDeleting(true);
		try {
			const response = await runPixel(request.pixel);
			const [result] = response.pixelReturn;
			if (!result || result.operationType.indexOf("ERROR") > -1) {
				toast.error(String(result?.output ?? "Could not delete"));
				return false;
			}
			toast.success(`Successfully deleted ${request.entityLabel}`);
			return true;
		} catch (e) {
			toast.error(String(e));
			return false;
		} finally {
			setIsDeleting(false);
		}
	};

	return {
		entityLabel: request?.entityLabel ?? "",
		isDeleting,
		deleteResource,
	};
};
