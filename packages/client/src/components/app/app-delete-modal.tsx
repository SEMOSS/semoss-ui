import { useState } from "react";
import { toast } from "@semoss/ui/next";
import { DeleteEntityDialog } from "@/components/shared/delete-entity-dialog";
import { useRootStore } from "@/hooks";

interface AppDeleteModalProps {
	isOpen: boolean;
	onClose(): void;
	appId: string;
	appName?: string;
	onDelete?: () => void;
	entityType?: "app" | "skill" | "agent";
}

export const AppDeleteModal = (props: AppDeleteModalProps) => {
	const {
		isOpen,
		onClose,
		appId,
		appName,
		onDelete,
		entityType = "app",
	} = props;

	const { monolithStore } = useRootStore();

	const [loading, setLoading] = useState(false);

	const entityLabel =
		entityType === "skill"
			? "Skill"
			: entityType === "agent"
				? "Agent"
				: "App";

	const escapePixelString = (value: string) => {
		return value.replaceAll("'", "\\'");
	};

	const buildDeletePixel = () => {
		const id = escapePixelString(appId);
		if (entityType === "skill") {
			return `DeleteSkill(skillId=['${id}']);`;
		}
		if (entityType === "agent") {
			return `DeleteWorkspace(workspaceId=['${id}']);`;
		}
		return `DeleteProject(project=['${id}']);`;
	};

	/**
	 * Delete the item
	 */
	const deleteApp = async () => {
		try {
			// start the loading screen
			setLoading(true);

			// run the pixel
			const response = await monolithStore.runQuery(buildDeletePixel());

			const operationType =
				response.pixelReturn?.[0]?.operationType || "";
			const output = response.pixelReturn?.[0]?.output;

			if (operationType.indexOf("ERROR") === -1) {
				toast.success("Successfully deleted");
				onDelete?.();
			} else {
				toast.error(
					String(
						output ||
							`Failed to delete ${entityLabel.toLowerCase()}`,
					),
				);
			}
		} catch (e) {
			toast.error(String(e));
		} finally {
			// stop the loading screen
			setLoading(false);
			onClose();
		}
	};

	return (
		<DeleteEntityDialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) {
					onClose();
				}
			}}
			entityLabel={entityLabel}
			entityName={appName || ""}
			entityId={appId}
			onConfirm={deleteApp}
			isLoading={loading}
		/>
	);
};
