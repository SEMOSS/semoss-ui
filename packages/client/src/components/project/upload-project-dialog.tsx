import { X } from "lucide-react";
import { useId, useState } from "react";
import {
	Badge,
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Field,
	FieldContent,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FileDropzone,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	Switch,
	Textarea,
	toast,
} from "@semoss/ui/next";
import { uploadFile } from "@/api";
import { useRootStore } from "@/hooks";

/** Title and error message shown based on the entity being uploaded. */
const DIALOG_CONFIG = {
	APP: {
		name: "App",
	},
	SKILL: {
		name: "Skill",
	},
	AGENT: {
		name: "Agent",
	},
} as const;

/**
 * "App Zip"    — A full SEMOSS project archive (.smss + asset folders).
 *                Uploaded directly via UploadProjectApp.
 * "Assets Copy" — A plain assets zip that gets unpacked into a new project
 *                created via CreateProject + UnzipFile.
 */
type FolderType = "App Zip" | "Assets Copy";

/** Project type used when creating an Assets Copy project. */
type AppType = "CODE" | "BLOCKS";

interface UploadProjectDialogProps {
	/** Controls the dialog title and error copy. Defaults to "app". */
	type: keyof typeof DIALOG_CONFIG;
	/** Controls whether the dialog is visible. */
	open: boolean;
	/** Called when the dialog open state changes. */
	handleClose: (appId?: string) => void;
}

/**
 * Dialog for uploading a project zip file.
 *
 * Two upload flows:
 *  - App Zip:     upload → UploadProjectApp pixel
 *  - Assets Copy: CreateProject → SetProjectMetadata → DeleteAsset →
 *                 upload → UnzipFile
 *
 * The Assets Copy fields (App Type, Name, Description, Tags) are shown
 * only when that folder type is selected.
 */
export const UploadProjectDialog = ({
	type,
	open,
	handleClose,
}: UploadProjectDialogProps) => {
	const config = DIALOG_CONFIG[type];
	const { monolithStore, configStore } = useRootStore();

	// --- Form state ---
	const [upload, setUpload] = useState<File | null>(null);
	const [folderType, setFolderType] = useState<FolderType>("App Zip");
	const [appType, setAppType] = useState<AppType>("CODE");
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [tags, setTags] = useState<string[]>([]);
	const [tagInput, setTagInput] = useState("");
	const [isGlobal, setIsGlobal] = useState(false);

	// --- Dialog state ---
	const [isLoading, setIsLoading] = useState(false);

	// Stable IDs for accessible label–input associations
	const nameId = useId();
	const descId = useId();
	const tagId = useId();

	const isAppZip = folderType === "App Zip";

	/**
	 *  Prevent closing while an upload is in progress.
	 */
	const handleDialogClose = () => {
		if (!isLoading) {
			handleClose();
		}
	};

	/**
	 * Upload the zip and run the appropriate pixel flow.
	 **/
	const handleSubmit = async () => {
		setIsLoading(true);
		try {
			if (isAppZip) {
				if (!upload) {
					throw new Error("No file selected for upload.");
				}

				// App Zip: single pixel handles the full project creation
				const uploaded = await uploadFile(
					[upload],
					configStore.store.insightID,
				);
				const resp = await monolithStore.runQuery(
					`UploadProjectApp(filePath=["${uploaded[0].fileLocation}"], global=[${isGlobal}]);`,
				);
				const output = resp.pixelReturn[0].output as {
					project_id: string;
				};
				const opType = resp.pixelReturn[0].operationType[0] as string;
				if (opType.includes("ERROR")) {
					toast.error(String(resp.pixelReturn[0].output));
					return;
				}
				handleClose(output.project_id);
			} else {
				// Assets Copy: create the project shell, set metadata, then
				// delete the default assets folder and unzip the uploaded file
				const createResp = await monolithStore.runQuery(
					`CreateProject(project=["${name}"], global=["${isGlobal}"], projectType=["${appType}"], portal=["true"])`,
				);
				const createOutput = createResp.pixelReturn[0].output as {
					project_id: string;
				};
				if (
					(
						createResp.pixelReturn[0].operationType[0] as string
					).includes("ERROR")
				) {
					toast.error(String(createResp.pixelReturn[0].output));
					return;
				}

				const metaResp = await monolithStore.runQuery(
					`SetProjectMetadata(project=["${createOutput.project_id}"], meta=[${JSON.stringify({ tag: tags, description })}])`,
				);
				if (
					(
						metaResp.pixelReturn[0].operationType[0] as string
					).includes("ERROR")
				) {
					toast.error(String(metaResp.pixelReturn[0].output));
					return;
				}

				const deleteResp = await monolithStore.runQuery(
					`DeleteAsset(filePath=["version/assets/"], space=["${createOutput.project_id}"]);`,
				);
				if (
					(
						deleteResp.pixelReturn[0].operationType[0] as string
					).includes("ERROR")
				) {
					toast.error(String(deleteResp.pixelReturn[0].output));
					return;
				}

				const uploaded = await uploadFile(
					[upload!],
					configStore.store.insightID,
					createOutput.project_id,
					"version",
				);

				const unzipResp = await monolithStore.runQuery(
					`UnzipFile(filePath=["${uploaded[0].fileLocation}"], space=["${createOutput.project_id}"]);`,
				);
				if (
					(
						unzipResp.pixelReturn[0].operationType[0] as string
					).includes("ERROR")
				) {
					toast.error(String(unzipResp.pixelReturn[0].output));
					return;
				}

				handleClose(createOutput.project_id);
			}
		} catch (e) {
			// Unexpected error (network failure, etc.) — show inline message
			toast.error(
				e instanceof Error
					? e.message
					: `Error uploading ${config.name.toLowerCase()}. Please try again.`,
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleDialogClose}>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>
						Upload {config.name.toLowerCase()}
					</DialogTitle>
				</DialogHeader>
				<div className="max-h-[60vh] overflow-y-auto py-2">
					<FieldGroup>
						<Field>
							<FieldLabel>Zip File</FieldLabel>
							<FileDropzone
								multiple={false}
								value={upload}
								onChange={(val) =>
									setUpload(val as File | null)
								}
								extensions={[".zip"]}
							/>
						</Field>

						<Field>
							<FieldLabel>Folder Type</FieldLabel>
							<Select
								value={folderType}
								onValueChange={(val) =>
									setFolderType(val as FolderType)
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="App Zip">
										App Zip — Contains full semoss construct
									</SelectItem>
									<SelectItem value="Assets Copy">
										Assets Copy — Contains project zipped as
										assets
									</SelectItem>
								</SelectContent>
							</Select>
						</Field>

						{/* Assets Copy only */}
						{!isAppZip && (
							<>
								<Field>
									<FieldLabel>App Type</FieldLabel>
									<Select
										value={appType}
										onValueChange={(val) =>
											setAppType(val as AppType)
										}
									>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="CODE">
												CODE
											</SelectItem>
											<SelectItem value="BLOCKS">
												BLOCKS
											</SelectItem>
										</SelectContent>
									</Select>
								</Field>

								<Field>
									<FieldLabel htmlFor={nameId}>
										Name
									</FieldLabel>
									<Input
										id={nameId}
										value={name}
										onChange={(e) =>
											setName(e.target.value)
										}
									/>
								</Field>

								<Field>
									<FieldLabel htmlFor={descId}>
										Description
									</FieldLabel>
									<Textarea
										id={descId}
										value={description}
										onChange={(e) =>
											setDescription(e.target.value)
										}
										rows={3}
									/>
								</Field>

								<Field>
									<FieldLabel htmlFor={tagId}>
										Tags
									</FieldLabel>
									<Input
										id={tagId}
										value={tagInput}
										placeholder='Press "Enter" to add tag'
										onChange={(e) =>
											setTagInput(e.target.value)
										}
										onKeyDown={(e) => {
											if (e.key !== "Enter") return;
											e.preventDefault();
											const trimmed = tagInput.trim();
											if (
												trimmed &&
												!tags.includes(trimmed)
											) {
												setTags((prev) => [
													...prev,
													trimmed,
												]);
											}
											setTagInput("");
										}}
									/>
									{tags.length > 0 && (
										<div className="flex flex-wrap gap-1">
											{tags.map((tag) => (
												<Badge
													key={tag}
													variant="secondary"
													className="gap-1"
												>
													{tag}
													<button
														type="button"
														onClick={() =>
															setTags((prev) =>
																prev.filter(
																	(t) =>
																		t !==
																		tag,
																),
															)
														}
														className="hover:text-destructive"
													>
														<X className="size-3" />
													</button>
												</Badge>
											))}
										</div>
									)}
								</Field>
							</>
						)}

						{/* Always shown */}
						<Field orientation="horizontal" className="items-start">
							<FieldContent>
								<FieldLabel>Make Public</FieldLabel>
								<FieldDescription>
									Show app to all users and automatically give
									them read-only access. Users can request
									elevated access.
								</FieldDescription>
							</FieldContent>
							<Switch
								disabled={isLoading}
								checked={isGlobal}
								onCheckedChange={setIsGlobal}
							/>
						</Field>
					</FieldGroup>
				</div>

				<DialogFooter className="flex items-center justify-end gap-2">
					<Button
						type="button"
						variant="ghost"
						disabled={isLoading}
						onClick={handleDialogClose}
					>
						Cancel
					</Button>
					<Button
						type="button"
						disabled={isLoading || upload === null}
						onClick={() => handleSubmit()}
					>
						{isLoading ? <Spinner /> : "Upload"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
