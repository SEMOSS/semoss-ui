import { useState } from "react";
import {
	Badge,
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Spinner,
	toast,
} from "@semoss/ui/next";
import type { GitCommit } from "./git.types";

/** Props for confirming a Git snapshot restore. */
interface GitRestoreDialogProps {
	/** Commit whose file state will be restored. */
	commit: GitCommit;
	/** Whether the dialog is open. */
	open: boolean;
	/** Update the dialog state. */
	onOpenChange: (open: boolean) => void;
	/** Restore the repository to the commit snapshot. */
	onRestore: () => Promise<void>;
	/** Notify the adapter after a successful restore. */
	onRestored?: () => void;
}

/** Confirm and run a history-preserving Git restore. */
export const GitRestoreDialog = ({
	commit,
	open,
	onOpenChange,
	onRestore,
	onRestored,
}: GitRestoreDialogProps) => {
	const [isRestoring, setIsRestoring] = useState(false);
	const subject = commit.commitMessage.split("\n")[0] || "Untitled commit";
	const shortCommitId = commit.commitId.slice(0, 7);

	/** Run the injected restore and notify the owning history adapter. */
	const restore = async () => {
		setIsRestoring(true);
		try {
			await onRestore();
			toast.success(
				`Reverted to commit ${shortCommitId}. A new commit has been created.`,
			);
			onOpenChange(false);
			onRestored?.();
		} catch (error) {
			console.error(error);
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to revert to this commit",
			);
		} finally {
			setIsRestoring(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => !isRestoring && onOpenChange(next)}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Restore to this commit?</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-3 text-sm">
					<p>
						This will restore all files to their state at commit{" "}
						<Badge variant="outline" className="font-mono text-xs">
							{shortCommitId}
						</Badge>
						.
					</p>
					<div className="rounded-md border border-border bg-muted/30 p-3">
						<p className="font-medium">{subject}</p>
						<p className="mt-1 text-muted-foreground text-xs">
							{commit.author.userId}
						</p>
					</div>
					<p className="text-muted-foreground text-xs">
						A new commit will record the restoration. No history
						will be lost.
					</p>
				</div>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						disabled={isRestoring}
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						type="button"
						variant="destructive"
						disabled={isRestoring}
						onClick={() => void restore()}
					>
						{isRestoring ? <Spinner className="size-4" /> : null}
						Restore
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
