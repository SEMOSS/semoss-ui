import { useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";
import type { AppTestInvalidFile } from "./app-test.types";
/** Keeps malformed files visible and requires confirmation before deleting exactly one. */
export const AppTestInvalidFiles = ({
	files,
	isBusy,
	onDelete,
}: {
	/** Server-reported filenames and validation errors. */ files: AppTestInvalidFile[];
	isBusy: boolean;
	onDelete?: (file: string) => Promise<void>;
}) => {
	const [selected, setSelected] = useState<AppTestInvalidFile | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState("");
	const remove = async (): Promise<void> => {
		if (!selected || !onDelete) return;
		setIsDeleting(true);
		setError("");
		try {
			await onDelete(selected.file);
			setSelected(null);
		} catch (failure: unknown) {
			setError(
				failure instanceof Error
					? failure.message
					: "Could not delete this invalid test file",
			);
		} finally {
			setIsDeleting(false);
		}
	};
	if (!files.length) return null;
	return (
		<>
			<Alert>
				<AlertDescription>
					<p>
						Some test files are invalid. Valid tests remain
						available. Repair these files in Files or delete them
						explicitly; Run all will not silently skip them.
					</p>
					<ul className="mt-2 flex flex-col gap-2">
						{files.map((file) => (
							<li key={file.file} className="break-words">
								<strong>{file.file}</strong>: {file.reason}
								{onDelete && (
									<Button
										type="button"
										variant="ghost"
										size="sm"
										disabled={isBusy}
										onClick={() => {
											setError("");
											setSelected(file);
										}}
									>
										Delete invalid file {file.file}
									</Button>
								)}
							</li>
						))}
					</ul>
				</AlertDescription>
			</Alert>
			<Dialog
				open={selected !== null}
				onOpenChange={(open) => {
					if (!open && !isDeleting) setSelected(null);
				}}
			>
				<DialogContent
					showCloseButton={!isDeleting}
					onEscapeKeyDown={(event) => {
						if (isDeleting) event.preventDefault();
					}}
					onInteractOutside={(event) => {
						if (isDeleting) event.preventDefault();
					}}
				>
					<DialogHeader>
						<DialogTitle>Delete invalid test file</DialogTitle>
						<DialogDescription>
							Delete {selected?.file}? This removes that test
							definition. Run history is preserved.
						</DialogDescription>
					</DialogHeader>
					{error && (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							disabled={isDeleting}
							onClick={() => setSelected(null)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant="destructive"
							disabled={isDeleting}
							onClick={() => void remove()}
						>
							{isDeleting ? "Deleting…" : "Delete file"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};
