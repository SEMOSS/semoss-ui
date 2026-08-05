import { LockKeyhole, RefreshCcw } from "lucide-react";
import { useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import type { Project, Role } from "@semoss/shared";
import { Button, Spinner } from "@semoss/ui/next";
import { ProjectAccessRequestDialog } from "./project-access-request-dialog";

interface ProjectAccessRequestButtonProps {
	/** Project details */
	project: Project;

	/** Current role of the user */
	permission: Role;

	/** Callback fired when the access request dialog is successful */
	onSuccess: () => void;
}

export const ProjectAccessRequestButton = ({
	project,
	permission,
	onSuccess,
}: ProjectAccessRequestButtonProps) => {
	const [open, setOpen] = useState(false);

	// get the current access request
	const getCurrentAccessRequest = usePixel<
		{
			PERMISSION: number;
			REQUEST_TIMESTAMP: string;
			APPROVER_DECISION: string;
			EMAIL: string;
			NAME: string;
			PROJECTID: string;
			USERNAME: string;
			REQUEST_USERID: string;
			REQUEST_TYPE: string;
			ID: string;
		}[]
	>(
		project.project_id
			? `GetProjectUserAccessRequest(project='${project.project_id}', isSpecificUser=true)`
			: "",
		{ data: [] },
	);

	const hasPendingRequest =
		getCurrentAccessRequest.status === "SUCCESS" &&
		Array.isArray(getCurrentAccessRequest.data) &&
		getCurrentAccessRequest.data.length > 0;

	return (
		<>
			<Button
				disabled={
					getCurrentAccessRequest.status === "LOADING" ||
					hasPendingRequest
				}
				variant={permission === "DISCOVERABLE" ? "default" : "outline"}
				className="gap-2"
				onClick={() => setOpen(true)}
				data-testid={"appDetail-access-btn"}
			>
				{getCurrentAccessRequest.status === "LOADING" ? (
					<Spinner className="size-4" />
				) : null}
				{permission === "DISCOVERABLE" ? (
					<LockKeyhole className="size-4" />
				) : (
					<RefreshCcw className="size-4" />
				)}

				{hasPendingRequest
					? "Pending Access"
					: permission === "DISCOVERABLE"
						? "Request Access"
						: "Change Access"}
			</Button>

			<ProjectAccessRequestDialog
				open={open}
				onClose={(success) => {
					// refresh the current acces
					if (success) {
						getCurrentAccessRequest.refresh();
						onSuccess();
					}

					// close it
					setOpen(false);
				}}
				project={project}
				permission={permission}
			/>
		</>
	);
};
