import { Download, FileIcon, XIcon } from "lucide-react";
import { useCallback, useId, useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { uploadFile } from "@/api";
import { useRootStore } from "@/hooks";
import type { ALL_TYPES } from "@/types";

type BatchUploadPermissionsOverlayProps = {
	open: boolean;
	onClose: (success: boolean) => void;
	id: string;
	type: ALL_TYPES;
};

export const BatchUploadPermissionsOverlay = ({
	open,
	onClose,
	id,
	type,
}: BatchUploadPermissionsOverlayProps) => {
	const { monolithStore, configStore } = useRootStore();
	const fileInputId = useId();
	const [file, setFile] = useState<File | null>(null);
	const [isUploading, setIsUploading] = useState(false);

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFiles = Array.from(e.target.files || []);
		if (selectedFiles.length > 0) {
			setFile(selectedFiles[0]);
		}
	};

	const handleRemoveFile = () => {
		setFile(null);
	};

	const handleUpload = async () => {
		if (!file) {
			toast.error("Please select a CSV file");
			return;
		}

		setIsUploading(true);
		try {
			const uploaded = await uploadFile(
				[file],
				configStore.store.insightID,
			);
			const fileLocation = uploaded[0].fileLocation;

			const idParam =
				type === "PROJECT" ? `project=["${id}"]` : `engine=["${id}"]`;
			const response = await monolithStore.runQuery(
				`BatchAppPermissionsCsv(filePath=["${fileLocation}"], ${idParam});`,
			);

			const operationType = response.pixelReturn[0].operationType;
			const output = response.pixelReturn[0].output;

			if (operationType.indexOf("ERROR") > -1) {
				toast.error(
					typeof output === "string"
						? output
						: "Failed to process CSV",
				);
				return;
			}

			const { success, added, updated, missingUsers, failures } =
				output as {
					success: boolean;
					added: number;
					updated: number;
					missingUsers: string[];
					failures: string[];
				};

			if (success) {
				toast.success(`Added: ${added}, Updated: ${updated}`);

				if (missingUsers && missingUsers.length > 0) {
					toast.warning(`Missing users: ${missingUsers.join(", ")}`);
				}

				if (failures && failures.length > 0) {
					toast.warning(`Failures: ${failures.join(", ")}`);
				}

				setFile(null);
				onClose(true);
			} else {
				toast.error("Batch upload failed");
			}
		} catch (e) {
			toast.error(String(e));
			console.error(e);
		} finally {
			setIsUploading(false);
		}
	};

	const handleDownloadTemplate = useCallback(() => {
		const csv =
			"email,permission\nuser1@example.com,EDIT\nuser2@example.com,READ_ONLY\nuser3@example.com,OWNER\n";
		const blob = new Blob([csv], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "permissions_template.csv";
		a.click();
		URL.revokeObjectURL(url);
	}, []);

	const [isDragging, setIsDragging] = useState(false);

	const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	};

	const handleDrop = (e: React.DragEvent<HTMLElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
		const droppedFiles = Array.from(e.dataTransfer.files || []);
		const csvFile = droppedFiles.find((f) => f.name.endsWith(".csv"));
		if (csvFile) {
			setFile(csvFile);
		} else {
			toast.error("Please upload a CSV file");
		}
	};

	return (
		<Dialog open={open} onOpenChange={() => onClose(false)}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Batch Upload Permissions</DialogTitle>
					<DialogDescription>
						Upload a CSV file to batch assign or update user
						permissions.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="rounded-md border bg-muted/50 p-3 text-sm">
						<div className="mb-2 flex items-center justify-between">
							<span className="font-medium">CSV Format</span>
							<button
								type="button"
								onClick={handleDownloadTemplate}
								className="inline-flex items-center gap-1 text-primary text-xs hover:underline"
							>
								<Download className="h-3 w-3" />
								Download template
							</button>
						</div>
						<p className="mb-1.5 text-muted-foreground">
							Required columns:{" "}
							<code className="rounded bg-muted px-1 py-0.5">
								email
							</code>{" "}
							and{" "}
							<code className="rounded bg-muted px-1 py-0.5">
								permission
							</code>
						</p>
						<p className="mb-1.5 text-muted-foreground">
							Valid permissions:{" "}
							<code className="rounded bg-muted px-1 py-0.5">
								OWNER
							</code>
							,{" "}
							<code className="rounded bg-muted px-1 py-0.5">
								EDIT
							</code>
							,{" "}
							<code className="rounded bg-muted px-1 py-0.5">
								READ_ONLY
							</code>
						</p>
						<div className="mt-2 rounded bg-muted p-2 font-mono text-xs leading-5">
							email,permission
							<br />
							alice@company.com,EDIT
							<br />
							bob@company.com,READ_ONLY
							<br />
							carol@company.com,OWNER
						</div>
					</div>

					<div>
						<label
							htmlFor={fileInputId}
							className="mb-2 block font-medium text-sm"
						>
							CSV File
						</label>
						<button
							type="button"
							className={`w-full rounded-md border-2 border-dashed p-4 text-left transition-colors ${
								isDragging
									? "border-primary bg-primary/5"
									: "border-border"
							}`}
							onDragOver={handleDragOver}
							onDragLeave={handleDragLeave}
							onDrop={handleDrop}
							onClick={() => {
								document.getElementById(fileInputId)?.click();
							}}
						>
							<input
								type="file"
								accept=".csv"
								onChange={handleFileSelect}
								disabled={isUploading}
								className="hidden"
								id={fileInputId}
							/>
							<span className="cursor-pointer text-muted-foreground text-sm hover:text-foreground">
								Drag and drop or click to select a CSV file
							</span>
						</button>

						{file && (
							<div className="mt-3 w-full">
								<div className="flex max-w-xs items-start justify-between gap-2 overflow-hidden rounded-md border px-3 py-2 text-sm">
									<div className="flex min-w-0 flex-1 items-start gap-2 overflow-hidden">
										<FileIcon className="mt-0.5 h-4 w-4 shrink-0" />
										<span className="truncate break-all">
											{file.name}
										</span>
									</div>
									<button
										type="button"
										onClick={handleRemoveFile}
										disabled={isUploading}
										className="shrink-0 rounded p-1 hover:bg-destructive/10"
										aria-label="Remove file"
									>
										<XIcon className="h-4 w-4" />
									</button>
								</div>
							</div>
						)}
					</div>

					<div className="flex justify-end gap-2">
						<Button
							variant="outline"
							onClick={() => {
								onClose(false);
								setFile(null);
							}}
							disabled={isUploading}
						>
							Cancel
						</Button>
						<Button
							onClick={handleUpload}
							disabled={!file || isUploading}
						>
							{isUploading ? (
								<>
									<Spinner className="mr-2 h-4 w-4" />
									Uploading...
								</>
							) : (
								"Upload"
							)}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
