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
		<Dialog open={isOpen} onOpenChange={close}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Delete Job</DialogTitle>
				</DialogHeader>

				<div className="text-muted-foreground text-sm">
					Are you sure you want to delete{" "}
					<span className="font-medium text-foreground">
						{job.length > 1 ? "all selected jobs" : job[0]?.name}
					</span>
					? This action is permanent.
				</div>

				<DialogFooter className="mt-4">
					<Button
						variant="outline"
						onClick={close}
						data-testid="deleteJobModal-cancel-btn"
					>
						Cancel
					</Button>

					<Button
						variant="destructive"
						onClick={() =>
							deleteJob(
								job.map((j) => j.id),
								job.map((j) => j.group),
							)
						}
						data-testid="deleteJobModal-delete-btn"
					>
						Delete
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
