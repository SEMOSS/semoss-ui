import { CopyIcon, GavelIcon, UploadIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { runPixel, upload, usePixel } from "@semoss/sdk/react";
import {
	Button,
	cn,
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldSeparator,
	FileUpload,
	FileUploadDropzone,
	FileUploadItem,
	FileUploadItemDelete,
	FileUploadItemMetadata,
	FileUploadItemPreview,
	FileUploadList,
	FileUploadTrigger,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Item,
	ItemContent,
	ItemMedia,
	ItemTitle,
	ScrollArea,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { setProjectPortal } from "@/api";
import { useRootStore, useSettings } from "@/hooks";

interface AppSpecificSettingsFormProps {
	/** Id of the app */
	id: string;

	/** Class name for the form */
	className?: string;
}

export const AppSpecificSettingsForm = ({
	id,
	className,
}: AppSpecificSettingsFormProps) => {
	const { configStore } = useRootStore();
	const { adminMode } = useSettings();
	const [isPublishing, setIsPublishing] = useState<boolean>(false);
	const [isRecompiling, setIsRecompiling] = useState<boolean>(false);
	const [isUpdatingApp, setIsUpdatingApp] = useState<boolean>(false);

	const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

	const getPortalDetails = usePixel<{
		url?: string;
		hasPortal?: boolean;
		project_has_portal: boolean;
		project_portal_url: string;
		lastCompiled?: string;
		compiledBy?: string;
	}>(
		adminMode
			? `AdminGetProjectPortalDetails('${id}');`
			: `GetProjectPortalDetails('${id}');`,
	);

	const getPortalReactors = usePixel<string[]>(
		adminMode
			? `AdminGetProjectPortalDetails('${id}');`
			: `GetProjectPortalDetails('${id}');`,
	);

	/**
	 * Publish the portal
	 */
	const publishPortal = async () => {
		try {
			setIsPublishing(true);

			// set the app portal if it isn't there
			if (!getPortalDetails.data.project_has_portal) {
				await setProjectPortal(adminMode, id, true);
			}

			const { errors, pixelReturn } = await runPixel<[string]>(
				`PublishProject(project='${id}', release=true);`,
			);

			if (errors.length > 0) {
				throw new Error(errors.join(""));
			}

			// update the data locally
			getPortalDetails.update({
				project_has_portal: true,
				project_portal_url: pixelReturn[0].output,
			});

			toast.success("Successfully published and redeployed");
		} catch (error) {
			toast.error(error);
		} finally {
			setIsPublishing(false);
		}
	};

	/**
	 * Recompile the reactors
	 */
	const recompileReactors = async () => {
		try {
			setIsRecompiling(true);

			const { errors } = await runPixel(
				`ReloadInsightClasses(project='${id}', release=true);`,
			);

			if (errors.length > 0) {
				throw new Error(errors.join(""));
			}

			toast.success("Successfully recompiled and redeployed");
		} catch (error) {
			toast.error(error);
		} finally {
			setIsRecompiling(false);
		}
	};

	/**
	 *  Upload the app
	 */
	const updateApp = async () => {
		try {
			if (uploadedFiles.length === 0) {
				throw new Error("No file selected for upload");
			}

			// turn on loading
			setIsUpdatingApp(true);

			const path = "version/assets/";

			// unzip the file in the new app
			const { insightId } = await runPixel(
				`DeleteAsset(filePath=["${path}"], space=["${id}"]);`,
				"new",
			);

			// upload the file
			const uploaded = await upload(uploadedFiles, insightId, id, path);

			// upnzip the file in the new app
			await runPixel(
				`UnzipFile(filePath=["${`${path}${uploaded[0].fileName}`}"], space=["${id}"]);`,
				insightId,
			);

			// Load the insight classes
			await runPixel(
				`ReloadInsightClasses(project='${id}', release=true);`,
				insightId,
			);

			// set the app portal
			await setProjectPortal(adminMode, id, true);

			// Publish the app the insight classes
			await runPixel(
				`PublishProject(project='${id}', release=true);`,
				insightId,
			);

			toast.success("Successfully updated");

			// reset
			setUploadedFiles([]);
			getPortalDetails.refresh();
		} catch (e) {
			console.error(e);

			toast.error(e.message);
		} finally {
			setIsUpdatingApp(false);
		}
	};

	/**
	 * Copy the text
	 * @param text - text to copy
	 */
	const copy = (text: string) => {
		try {
			navigator.clipboard.writeText(text);

			toast.success("Successfully copied to clipboard");
		} catch (e) {
			toast.error(e.message);
		}
	};

	if (getPortalDetails.status === "LOADING") {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	return (
		<form
			className={cn(
				"mx-auto my-0 flex w-full max-w-2xl flex-1 flex-col items-start gap-6 px-12 py-6",
				className,
			)}
		>
			<FieldGroup>
				<FieldDescription>
					Last compiled by:{" "}
					{getPortalDetails.data?.compiledBy || <i> - </i>}
					on
					{getPortalDetails.data?.lastCompiled || <i> - </i>}
				</FieldDescription>
				<FieldSeparator />
				<FieldGroup>
					<Field orientation="responsive">
						<FieldLabel>Publish Portal</FieldLabel>
						<Button
							disabled={
								!configStore.isEngineOperationAvailable(
									"APP",
									"access",
								) || isPublishing
							}
							onClick={() => {
								publishPortal();
							}}
						>
							{isPublishing ? <Spinner /> : "Publish"}
						</Button>
					</Field>
					<InputGroup className="w-full">
						<InputGroupInput
							placeholder="Link"
							value={
								getPortalDetails.data?.project_has_portal
									? getPortalDetails.data?.project_portal_url
									: ""
							}
							readOnly
						/>
						<InputGroupAddon align="inline-end">
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										disabled={
											!getPortalDetails.data
												?.project_has_portal
										}
										onClick={() => {
											copy(
												getPortalDetails.data
													.project_portal_url,
											);
										}}
									>
										<CopyIcon />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Copy Link</TooltipContent>
							</Tooltip>
						</InputGroupAddon>
					</InputGroup>
				</FieldGroup>
				<Field orientation="responsive">
					<FieldLabel>Compile Reactors</FieldLabel>
					<Button
						disabled={isRecompiling}
						onClick={() => {
							recompileReactors();
						}}
					>
						{isRecompiling ? <Spinner /> : "Compile"}
					</Button>
				</Field>
				<Field>
					<FieldLabel>Reactors</FieldLabel>
					<ScrollArea className="h-42 rounded-lg border border-border">
						{getPortalReactors.data?.length > 0 ? (
							getPortalReactors.data.map((reactor) => (
								<Item variant="outline" key={reactor}>
									<ItemMedia>
										<GavelIcon className="size-5" />
									</ItemMedia>
									<ItemContent>
										<ItemTitle>{reactor}</ItemTitle>
									</ItemContent>
								</Item>
							))
						) : (
							<div className="absolute top-1/2 w-full text-center text-muted-foreground text-xs">
								No reactors found
							</div>
						)}
					</ScrollArea>
				</Field>

				<FieldSeparator />

				<FieldGroup>
					<Field orientation="responsive">
						<FieldLabel>Replace App</FieldLabel>

						<Button
							disabled={
								isUpdatingApp || uploadedFiles.length === 0
							}
							onClick={() => {
								updateApp();
							}}
						>
							{isUpdatingApp ? <Spinner /> : "Upload"}
						</Button>
					</Field>
					<FileUpload
						value={uploadedFiles}
						onValueChange={(v) => {
							setUploadedFiles(v);
						}}
						multiple={false}
						disabled={isUpdatingApp}
					>
						<FileUploadDropzone>
							<div className="flex flex-col items-center gap-1 text-center">
								<div className="flex items-center justify-center rounded-full border p-2.5">
									<UploadIcon className="size-6 text-muted-foreground" />
								</div>
								<p className="font-medium text-sm">
									Drag & drop app here
								</p>
							</div>
							<FileUploadTrigger asChild>
								<Button
									variant="outline"
									size="sm"
									className="mt-2 w-fit"
									disabled={isUpdatingApp}
								>
									Browse files
								</Button>
							</FileUploadTrigger>
						</FileUploadDropzone>
						<FileUploadList>
							{uploadedFiles.map((file) => (
								<FileUploadItem
									key={`${file.name}-${file.size}-${file.lastModified}`}
									value={file}
								>
									<div className="flex w-full items-center gap-2">
										<FileUploadItemPreview />
										<FileUploadItemMetadata />
										<FileUploadItemDelete asChild>
											<Button
												variant="ghost"
												size="icon"
												className="size-7"
											>
												<XIcon />
											</Button>
										</FileUploadItemDelete>
									</div>
								</FileUploadItem>
							))}
						</FileUploadList>
					</FileUpload>
				</FieldGroup>
			</FieldGroup>
		</form>
	);
};
