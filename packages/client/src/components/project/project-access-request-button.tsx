import { LockKeyhole, RefreshCcw } from "lucide-react";
import type { Role } from "@semoss/sdk";
import type { Project } from "@semoss/shared";
import { Button, Spinner } from "@semoss/ui/next";
import type { MyAccessRequest } from "@/api/user-access";
import { ProjectAccessRequestDialog } from "./project-access-request-dialog";

/** Props for {@link ProjectAccessRequestButton}. */
export interface ProjectAccessRequestButtonProps {
	/** Project details */
	project: Project;
	/** Current role of the user */
	permission: Role;
	/** The user's own request that waits for a decision, or null */
	request: MyAccessRequest | null;
	/** Whether the user's request is still being read */
	isRequestLoading: boolean;
	/** Whether the request dialog is open */
	open: boolean;
	/** Opens or closes the request dialog */
	onOpenChange: (open: boolean) => void;
	/** Called after the user asks for access, or changes what they asked for */
	onSuccess: () => void;
}

/**
 * Asks for access to the project, or for a change to the user's access. With
 * a request waiting, it changes that request: the dialog starts from the level
 * and reason the user gave, and asking again replaces it.
 */
export const ProjectAccessRequestButton = ({
	project,
	permission,
	request,
	isRequestLoading,
	open,
	onOpenChange,
	onSuccess,
}: ProjectAccessRequestButtonProps) => {
	let label =
		permission === "DISCOVERABLE" ? "Request Access" : "Change Access";
	if (request) {
		label = "Change Request";
	}

	return (
		<>
			<Button
				disabled={isRequestLoading}
				variant={
					permission === "DISCOVERABLE" && !request
						? "default"
						: "outline"
				}
				className="gap-2"
				onClick={() => onOpenChange(true)}
				data-testid={"appDetail-access-btn"}
			>
				{isRequestLoading ? <Spinner className="size-4" /> : null}
				{permission === "DISCOVERABLE" && !request ? (
					<LockKeyhole className="size-4" />
				) : (
					<RefreshCcw className="size-4" />
				)}
				{label}
			</Button>

			<ProjectAccessRequestDialog
				open={open}
				onClose={(success) => {
					if (success) {
						onSuccess();
					}
					onOpenChange(false);
				}}
				project={project}
				permission={permission}
				request={request}
			/>
		</>
	);
};
