import type React from "react";
import { useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Field,
	FieldGroup,
	FieldLabel,
	FieldSeparator,
	FieldSet,
	Input,
	Muted,
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
	Spinner,
	toast,
} from "@semoss/ui/next";
import type { FileMode } from "./file.types";

interface NewFileOverlayProps {
	/** Mode of file editor */
	mode: FileMode;

	/** Path to upload or create at */
	path: string;

	/** Track if the overlay is open */
	open: boolean;

	/** Callback triggered when the dialog is closed */
	onClose: (success: boolean) => void;
}

export const NewFileOverlay: React.FC<NewFileOverlayProps> = ({
	mode,
	path,
	open,
	onClose = () => null,
}) => {
	const insight = useInsight();
	const [data, setData] = useState<
		| {
				action: "upload";
				files: File[];
		  }
		| {
				action: "add_file";
				name: string;
		  }
		| {
				action: "add_directory";
				name: string;
		  }
	>({
		action: "upload",
		files: [],
	});

	const [isLoading, setIsLoading] = useState(false);

	const isDisabled =
		isLoading ||
		(data.action === "add_file" && data.name.trim().length === 0) ||
		(data.action === "add_directory" && data.name.trim().length === 0) ||
		(data.action === "upload" && data.files.length === 0);

	/**
	 * Reset the form
	 */
	const resetForm = () => {
		setData({
			action: "upload",
			files: [],
		});
		onClose(false);
	};

	/**
	 * Submit the form
	 */
	const submitForm = async () => {
		try {
			setIsLoading(true);

			let pixel = "";
			if (data.action === "upload") {
				if (data.files.length === 0) {
					toast.error("Please select at least one file to upload");
					return;
				}

				// upload the files
				if (mode.type === "APP") {
					await insight.actions.uploadApp(mode.app, path, data.files);
				} else if (mode.type === "ENGINE") {
					await insight.actions.uploadEngine(
						mode.engine,
						path,
						data.files,
					);
				} else if (mode.type === "INSIGHT") {
					await insight.actions.uploadInsight(path, data.files);
				} else {
					throw new Error("Unknown mode type");
				}

				toast.success("Successfully uploaded file(s)");
			} else if (data.action === "add_file") {
				if (!data.name.trim()) {
					toast.error("Please enter a name for the file");
					return;
				}

				if (mode.type === "APP") {
					pixel = `NewAppAssetsFile(project=["${mode.app}"], filePath=["${path}${data.name}"]);`;
				} else if (mode.type === "ENGINE") {
					pixel = `NewEngineAssetsFile(engine=["${mode.engine}"], filePath=["${path}${data.name}"]);`;
				} else if (mode.type === "INSIGHT") {
					pixel = `NewInsightAssetsFile(filePath=["${path}${data.name}"]);`;
				}

				// run it
				await insight.actions.run(pixel);

				toast.success("Successfully created file");
			} else if (data.action === "add_directory") {
				if (!data.name.trim()) {
					toast.error("Please enter a name for the directory");
					return;
				}

				if (mode.type === "APP") {
					pixel = `NewAppAssetsDirectory(project=["${mode.app}"], filePath=["${path}${data.name}"]);`;
				} else if (mode.type === "ENGINE") {
					pixel = `NewEngineAssetsDirectory(engine=["${mode.engine}"], filePath=["${path}${data.name}"]);`;
				} else if (mode.type === "INSIGHT") {
					pixel = `NewInsightAssetsDirectory(filePath=["${path}${data.name}"]);`;
				}

				// run it
				await insight.actions.run(pixel);

				toast.success("Successfully created directory");
			} else {
				throw new Error("Unknown action");
			}

			// reset the data
			resetForm();

			onClose(true);
		} catch (e) {
			toast.error(e.message);
			console.error(e);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={() => resetForm()}>
			<DialogContent
				aria-describedby="Upload or create a new file or directory in the current path"
				className="sm:max-w-2xl"
			>
				<DialogHeader>
					<DialogTitle>Create File or Directory</DialogTitle>
					<DialogDescription>
						Upload or create a new file or directory at path: {path}
					</DialogDescription>
				</DialogHeader>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						submitForm();
					}}
				>
					<FieldSet>
						<FieldGroup>
							<Field>
								<FieldLabel>Action</FieldLabel>
								<Select
									value={data.action}
									onValueChange={(value) => {
										if (value === "upload") {
											setData({
												action: "upload",
												files: [],
											});
										} else if (value === "add_file") {
											setData({
												action: "add_file",
												name: "",
											});
										} else if (value === "add_directory") {
											setData({
												action: "add_directory",
												name: "",
											});
										}
									}}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select action" />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											<SelectLabel>Action</SelectLabel>
											<SelectItem value="upload">
												Upload Files
											</SelectItem>
											<SelectItem value="add_file">
												New File
											</SelectItem>
											<SelectItem value="add_directory">
												New Directory
											</SelectItem>
										</SelectGroup>
									</SelectContent>
								</Select>
							</Field>
						</FieldGroup>
						<FieldSeparator />
						<FieldGroup>
							{data.action === "upload" && (
								<Field>
									<FieldLabel>Select Files</FieldLabel>
									<Input
										type="file"
										multiple
										onChange={(e) => {
											const files = Array.from(
												e.target.files,
											);

											setData((prev) => ({
												...prev,
												files,
											}));
										}}
									/>
									{data.files.length > 0 && (
										<Muted className="text-xs">
											{data.files.length} file(s) selected
										</Muted>
									)}
								</Field>
							)}

							{data.action === "add_file" && (
								<Field>
									<FieldLabel>File Name</FieldLabel>
									<Input
										placeholder={"Enter File Name"}
										value={data.name}
										onChange={(e) =>
											setData((prev) => ({
												...prev,
												name: e.target.value,
											}))
										}
									/>
								</Field>
							)}

							{data.action === "add_directory" && (
								<Field>
									<FieldLabel>Directory Name</FieldLabel>
									<Input
										placeholder={"Enter Directory Name"}
										value={data.name}
										onChange={(e) =>
											setData((prev) => ({
												...prev,
												name: e.target.value,
											}))
										}
									/>
								</Field>
							)}
						</FieldGroup>
					</FieldSet>
				</form>
				<DialogFooter>
					<Button
						variant="ghost"
						disabled={isLoading}
						onClick={() => {
							resetForm();
						}}
					>
						Cancel
					</Button>
					<Button
						variant="default"
						disabled={isDisabled}
						onClick={() => submitForm()}
					>
						{isLoading ? (
							<Spinner />
						) : (
							<>
								{data.action === "upload" && "Upload"}
								{data.action === "add_file" && "Create"}
								{data.action === "add_directory" && "Create"}
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
