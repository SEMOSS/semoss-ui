import { Button, Modal, Typography } from "@semoss/ui";
import type { Job } from "./job.types";

export const DeleteJobModal = (props: {
	job: Job[];
	isOpen: boolean;
	close: () => void;
	deleteJob: (id: string[], group: string[]) => void;
}) => {
	const { job, isOpen, close, deleteJob } = props;
	return (
		<Modal onClose={close} open={isOpen}>
			<Modal.Content>
				<Modal.Title>Delete Job</Modal.Title>
				<Modal.Content>
					<Typography variant="body1">
						Are you sure you want to delete
						{job.length > 1 ? "all selected jobs" : job[0]?.name}?
						This action is permanent.
					</Typography>
				</Modal.Content>
				<Modal.Actions>
					<Button
						variant="text"
						onClick={close}
						data-testid={"deleteJobModal-cancel-btn"}
					>
						Cancel
					</Button>
					<Button
						variant="contained"
						color="error"
						onClick={() => {
							deleteJob(
								job.map((j) => j.id),
								job.map((j) => j.group),
							);
						}}
						data-testid={"deleteJobModal-delete-btn"}
					>
						Delete
					</Button>
				</Modal.Actions>
			</Modal.Content>
		</Modal>
	);
};
