import { DownloadIcon, UploadIcon } from "lucide-react";
import { useState } from "react";
import {
	Button,
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Controller,
	FileDropzone,
	Spinner,
	toast,
	useForm,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { useAppExport } from "@/features/app-export/use-app-export";
import { useProject } from "@/hooks/use-project";
import { useSession } from "@/hooks/use-session";
import { AutomationImportExportCard } from "./app-detail-tabs/automation-import-export-card";

type UpdateAppForm = {
	PROJECT_UPLOAD: File | null;
};

/**
 * The Import and Export section of an app's Settings: replace the app's files
 * with a zip, and export the app. An automation also imports and exports its
 * definition here.
 */
export const AppImportExportSettingsPage = () => {
	const { project } = useProject();
	const sessionRunPixel = useSession((state) => state.runPixel);
	const sessionUpload = useSession((state) => state.upload);
	const isEngineOperationAvailable = useSession(
		(state) => state.isEngineOperationAvailable,
	);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const { isExporting, exportApp } = useAppExport(project.project_id);

	const { handleSubmit, control, reset, watch } = useForm<UpdateAppForm>({
		defaultValues: {
			PROJECT_UPLOAD: null,
		},
	});

	const uploadFile = watch("PROJECT_UPLOAD");
	const canUpload = isEngineOperationAvailable("PROJECT", "access");

	/**
	 * Replaces the app's assets with the uploaded zip, then compiles and
	 * publishes the app
	 */
	const updateApp = handleSubmit(async (data: UpdateAppForm) => {
		setIsLoading(true);

		try {
			if (!data.PROJECT_UPLOAD) {
				throw new Error(
					"No file selected for upload. Please select a file and try again.",
				);
			}

			const path = "version/assets/";

			// clear the current assets
			await sessionRunPixel(
				`DeleteAsset(filePath=["${path}"], space=["${project.project_id}"]);`,
			);

			// upload the file
			const uploaded = await sessionUpload(
				[data.PROJECT_UPLOAD],
				project.project_id,
				path,
			);

			// unzip the file in the app
			await sessionRunPixel(
				`UnzipFile(filePath=["${`${path}${uploaded[0].fileName}`}"], space=["${project.project_id}"]);`,
			);

			// load the insight classes
			await sessionRunPixel(
				`CompileAppReactors(project='${project.project_id}', release=true);`,
			);

			// publish the app
			await sessionRunPixel(
				`PublishProject(project='${project.project_id}', release=true);`,
			);
			toast.success("Updated the app");

			reset();
		} catch (e) {
			console.error(e);
			toast.error(getErrorMessage(e, "An unexpected error occurred."));
		} finally {
			setIsLoading(false);
		}
	});

	return (
		<div className="flex w-full flex-col gap-4">
			{project.project_type === "AUTOMATION" && (
				<AutomationImportExportCard project={project} />
			)}

			<Card>
				<CardHeader className="border-b">
					<CardTitle>Update App</CardTitle>
					<CardDescription>
						Replace the app's files with a zip of up to 5MB, then
						compile and publish it.
					</CardDescription>
					<CardAction className="self-center">
						<Button
							type="button"
							size="sm"
							disabled={isLoading || !uploadFile}
							onClick={updateApp}
							data-testid="appImportExport-update-btn"
						>
							{isLoading ? (
								<Spinner className="size-4" />
							) : (
								<UploadIcon aria-hidden />
							)}
							{isLoading ? "Updating..." : "Update"}
						</Button>
					</CardAction>
				</CardHeader>
				<CardContent>
					<Controller
						name="PROJECT_UPLOAD"
						control={control}
						disabled={!canUpload || isLoading}
						render={({ field }) => (
							<FileDropzone
								multiple={false}
								value={field.value}
								disabled={!canUpload || isLoading}
								onChange={(newValues) =>
									field.onChange(newValues)
								}
							/>
						)}
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Export App</CardTitle>
					<CardDescription>
						Download the app's files as a zip.
					</CardDescription>
					<CardAction className="self-center">
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={isLoading || isExporting}
							onClick={exportApp}
							data-testid="appDetail-export-btn"
						>
							{isExporting ? (
								<Spinner className="size-4" />
							) : (
								<DownloadIcon aria-hidden />
							)}
							{isExporting ? "Exporting..." : "Export"}
						</Button>
					</CardAction>
				</CardHeader>
			</Card>
		</div>
	);
};
