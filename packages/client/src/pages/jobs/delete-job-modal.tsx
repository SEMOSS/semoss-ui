import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";
import type { Job } from "./job.types";

export const DeleteJobModal = (props: {
	job: Job[];
	isOpen: boolean;
	close: () => void;
	deleteJob: (id: string[], group: string[]) => void;
}) => {
	const { job, isOpen, close, deleteJob } = props;
	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete Job</DialogTitle>
				</DialogHeader>
				<p className="text-sm">
					Are you sure you want to delete{" "}
					{job.length > 1 ? (
						<strong>all selected jobs</strong>
					) : (
						<strong>&ldquo;{job[0]?.name}&rdquo;</strong>
					)}
					? This action is permanent.
				</p>
				<DialogFooter>
					<Button
						variant="ghost"
						onClick={close}
						data-testid={"deleteJobModal-cancel-btn"}
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
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
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
