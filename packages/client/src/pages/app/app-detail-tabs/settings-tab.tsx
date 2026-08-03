import { Copy, DownloadIcon, Link as LinkIcon, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { download, usePixel } from "@semoss/sdk/react";
import type { Project } from "@semoss/shared";
import {
	Avatar,
	AvatarFallback,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Field,
	FileDropzone,
	H3,
	H4,
	Input,
	P,
	Small,
	Spinner,
	Table,
	TableBody,
	TableCell,
	TableRow,
	toast,
} from "@semoss/ui/next";
import { uploadFile as uploadFileAPI } from "@/api";
import { Java } from "@/assets/img/Java";
import { useRootStore, useSettings } from "@/hooks";

interface AppSettingsProps {
	/** Project details */
	project: Project;
}

type EditAppForm = {
	PROJECT_UPLOAD: File | null;
};

export const SettingsTab = (props: AppSettingsProps) => {
	const { project } = props;
	const { monolithStore, configStore } = useRootStore();
	const { adminMode } = useSettings();
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isExporting, setIsExporting] = useState(false);

	const { handleSubmit, control, reset, watch } = useForm<EditAppForm>({
		defaultValues: {
			PROJECT_UPLOAD: null,
		},
	});

	const uploadFile = watch("PROJECT_UPLOAD");

	const [portalReactors, setPortalReactors] = useState<{
		reactors: string[];
		lastCompiled?: string;
		compiledBy?: string;
	}>({
		lastCompiled: "",
		reactors: [],
		compiledBy: "",
	});

	const [portalDetails, setPortalDetails] = useState<{
		project_is_published: boolean;
		project_portal_url?: string;
	}>({
		project_is_published: false,
		project_portal_url: "",
	});

	const getPortalDetails = usePixel<{
		project_is_published: boolean;
		project_portal_url?: string;
	}>(
		adminMode
			? `AdminGetProjectPortalDetails('${project.project_id}');`
			: `GetProjectPortalDetails('${project.project_id}');`,
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: getPortalReactors is defined after this hook
	useEffect(() => {
		if (getPortalDetails.status !== "SUCCESS") {
			return;
		}

		// Set Details for Portal
		setPortalDetails({
			...getPortalDetails.data,
		});

		getPortalReactors();
	}, [getPortalDetails.status, getPortalDetails.data]);

	/** LOADING */
	if (getPortalDetails.status !== "SUCCESS") {
		return (
			<div className="flex h-screen items-center justify-center">
				<Spinner className="items-center justify-center" />
			</div>
		);
	}

	/**
	 * @name getPortalReactors
	 */
	const getPortalReactors = () => {
		const pixelString = adminMode
			? `AdminGetProjectAvailableReactors(project=['${project.project_id}']);`
			: `GetProjectAvailableReactors(project=['${project.project_id}']);`;

		monolithStore
			.runQuery(pixelString)
			.then((response) => {
				const output = Array.isArray(response.pixelReturn[0].output)
					? (response.pixelReturn[0].output as string[])
					: [response.pixelReturn[0].output as string];
				const type: string = response.pixelReturn[0].operationType[0];

				if (type.indexOf("ERROR") > -1) {
					toast.error(output);
					return;
				}

				setPortalReactors({
					...portalReactors,
					reactors: output,
				});
			})
			.catch((error) => {
				toast.error(error);
			});
	};

	/**
	 * @name recompileReactors
	 */
	const recompileReactors = ({ release }) => {
		let pixelString: string;
		if (release == null) {
			pixelString = `ReloadInsightClasses(project='${project.project_id}');`;
		} else {
			pixelString = `ReloadInsightClasses(project='${project.project_id}', release=true);`;
		}

		monolithStore
			.runQuery(pixelString)
			.then((response) => {
				const output: string = response.pixelReturn[0].output as string;
				const type: string = response.pixelReturn[0].operationType[0];

				if (type.indexOf("ERROR") > -1) {
					toast.error(output);
					return;
				}

				if (release == null) {
					toast.success("Successfully compiled");
				} else {
					toast.success("Successfully compiled and deployed");
				}
			})
			.catch((error) => {
				toast.error(error);
			});
	};

	/**
	 * @name publish
	 * @desc Publishes Portal
	 */
	const publish = () => {
		const pixelString = `PublishProject(project='${project.project_id}', release=true);`;
		monolithStore
			.runQuery(pixelString)
			.then((response) => {
				const output: string = response.pixelReturn[0].output as string;
				const type: string = response.pixelReturn[0].operationType[0];
				if (type.indexOf("ERROR") > -1) {
					toast.error(output);
					return;
				}

				setPortalDetails({
					...portalDetails,
					project_is_published: true,
					project_portal_url: output,
				});
				toast.success("Successfully published");
			})
			.catch((error) => {
				toast.error(error);
			});
	};

	/**
	 * @name editApp
	 */
	const editApp = handleSubmit(async (data: EditAppForm) => {
		// turn on loading
		setIsLoading(true);

		try {
			if (!data.PROJECT_UPLOAD) {
				throw new Error(
					"No file selected for upload. Please select a file and try again.",
				);
			}

			const path = "version/assets/";

			// unzip the file in the new app
			await monolithStore.runQuery(
				`DeleteAsset(filePath=["${path}"], space=["${project.project_id}"]);`,
			);

			// upload the file
			const upload = await uploadFileAPI(
				[data.PROJECT_UPLOAD],
				configStore.store.insightID,
				project.project_id,
				path,
			);

			// upnzip the file in the new app
			await monolithStore.runQuery(
				`UnzipFile(filePath=["${`${path}${upload[0].fileName}`}"], space=["${project.project_id}"]);`,
			);

			// Load the insight classes
			await monolithStore.runQuery(
				`ReloadInsightClasses(project='${project.project_id}', release=true);`,
			);

			// Publish the app the insight classes
			await monolithStore.runQuery(
				`PublishProject(project='${project.project_id}', release=true);`,
			);
			toast.success("Succesfully Updated Project");

			reset();
		} catch (e) {
			console.error(e);
			toast.error(
				e instanceof Error
					? e.message
					: "An unexpected error occurred.",
			);
		} finally {
			// turn of loading
			setIsLoading(false);
		}
	});

	/**
	 * Copy text and add it to the clipboard
	 * @param text - text to copy
	 */
	const copy = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			toast.success("Successfully copied to clipboard");
		} catch (_e) {
			toast.error("Unable to copy to clipboard");
		}
	};

	/**
	 * Export the project
	 */
	const exportProject = async () => {
		try {
			setIsExporting(true);

			const response = await configStore.runPixel(
				`ExportProjectApp(project=["${project.project_id}"]);`,
			);

			await download(
				response.insightId,
				response.pixelReturn[0].output as string,
			);
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to export project. Please try again.",
			);
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<div className="flex w-full flex-col gap-6">
			{/* Portals Section */}
			<Card className="gap-1 p-4">
				<CardHeader className="px-0">
					<div className="flex w-full items-start justify-between">
						<div className="flex flex-col gap-2">
							<CardTitle>
								<H3>Portals</H3>
							</CardTitle>
						</div>
					</div>
				</CardHeader>
				<CardContent className="flex flex-col gap-3 px-0">
					{/* Publish Portal */}
					<div className="flex flex-col gap-0">
						<div className="flex items-center justify-between gap-4">
							<div className="flex flex-col gap-1">
								<H4>Publish Portal</H4>
								<P className="text-muted-foreground">
									Publish the portal to generate a shareable
									link.
								</P>
							</div>
							<Button
								variant="outline"
								disabled={
									!configStore.isEngineOperationAvailable(
										"PROJECT",
										"access",
									)
								}
								onClick={() => {
									publish();
								}}
							>
								Publish
							</Button>
						</div>

						<Field>
							<div className="relative">
								<div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
									<LinkIcon className="size-4 text-muted-foreground" />
								</div>
								<Input
									value={
										portalDetails.project_portal_url ?? ""
									}
									readOnly
									className="pr-10 pl-9"
								/>
								<Button
									variant="ghost"
									size="icon-sm"
									className="-translate-y-1/2 absolute top-1/2 right-1"
									onClick={() =>
										copy(
											portalDetails.project_portal_url ??
												"",
										)
									}
									disabled={!portalDetails.project_portal_url}
								>
									<Copy className="size-4" />
								</Button>
							</div>
						</Field>
					</div>
				</CardContent>
			</Card>
			{/* Reactors Section */}
			<Card className="gap-1 p-4">
				<CardContent className="flex flex-col gap-4 px-0">
					{/* Header with Title and Buttons */}
					<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
						<H3>Reactors</H3>
						<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
							<Button
								variant="outline"
								className="w-full justify-start border-(--primary) sm:w-auto"
								onClick={() => {
									recompileReactors({ release: null });
								}}
							>
								Compile Changes on This Instance
							</Button>
							<Button
								variant="outline"
								className="s w-full justify-start border-(--primary) sm:w-auto"
								onClick={() => {
									recompileReactors({ release: true });
								}}
							>
								Deploy and Persist Changes
							</Button>
						</div>
					</div>

					{/* Description */}
					<P className="text-muted-foreground">
						Custom reactors created for the portal.
					</P>

					{/* Reactors Table or Empty State */}
					{portalReactors.reactors.length > 0 ? (
						<div className="rounded-lg border">
							<Table>
								<TableBody>
									{portalReactors.reactors.map((reactor) => (
										<TableRow key={`reactor-${reactor}`}>
											<TableCell>{reactor}</TableCell>
											<TableCell className="text-right">
												<Java />
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					) : (
						<div className="flex h-[120px] w-full items-center justify-center rounded-lg border">
							<P className="text-muted-foreground">
								No reactors found
							</P>
						</div>
					)}

					{/* Last Compiled Info */}
					{portalReactors.lastCompiled && (
						<div className="flex items-center gap-2">
							<Small className="text-muted-foreground">
								Last compiled by:
							</Small>
							<Avatar className="size-6">
								<AvatarFallback>
									<User className="size-3" />
								</AvatarFallback>
							</Avatar>
							<Small>{portalReactors.compiledBy}</Small>
							<Small>on</Small>
							<Small>{portalReactors.lastCompiled}</Small>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Update Project Section */}
			<Card className="gap-1 p-4">
				{isLoading && <Spinner />}
				<CardHeader className="px-0">
					<CardTitle>
						<H3>Update Project</H3>
					</CardTitle>
					<CardDescription>
						The maximum file size we can handle is 5MB per Zip
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4 px-0">
					<Controller
						name={"PROJECT_UPLOAD"}
						control={control}
						rules={{}}
						disabled={
							!configStore.isEngineOperationAvailable(
								"PROJECT",
								"access",
							) || isLoading
						}
						render={({ field }) => (
							<FileDropzone
								multiple={false}
								value={field.value}
								disabled={
									!configStore.isEngineOperationAvailable(
										"PROJECT",
										"access",
									) || isLoading
								}
								onChange={(newValues) =>
									field.onChange(newValues)
								}
							></FileDropzone>
						)}
					/>
					<div className="flex justify-start">
						<Button
							variant="default"
							disabled={isLoading || !uploadFile}
							onClick={editApp}
						>
							Update
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Export Project Section */}
			<Card className="gap-1 p-4">
				<CardHeader className="px-0">
					<CardTitle>
						<H3>Export Project</H3>
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4 px-0">
					<Button
						disabled={isLoading}
						variant="outline"
						size="icon"
						aria-label="Export"
						onClick={() => exportProject()}
						data-testid={"appDetail-export-btn"}
					>
						{isExporting ? (
							<Spinner className="size-4" />
						) : (
							<DownloadIcon className="size-4" />
						)}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
};
