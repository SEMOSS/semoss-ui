import { Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { usePixel } from "@semoss/sdk/react";
import {
	Button,
	Separator,
	Spinner,
	Table,
	TableBody,
	TableCell,
	TableRow,
	toast,
} from "@semoss/ui/next";
import { setProjectPortal, uploadFile as uploadFileAPI } from "@/api";
import { Java } from "@/assets/img/Java";
import { useRootStore, useSettings } from "@/hooks";

interface AppSettingsProps {
	id: string;
	condensed?: boolean;
}

type EditAppForm = {
	PROJECT_UPLOAD: File;
};

interface FileDropAreaProps {
	disabled: boolean;
	value: File | null;
	onChange: (value: File | null) => void;
}

const FileDropArea = ({ disabled, value, onChange }: FileDropAreaProps) => {
	const inputRef = useRef<HTMLInputElement | null>(null);
	const [isDragging, setIsDragging] = useState(false);

	const handleFiles = (files: FileList | null) => {
		if (!files || files.length === 0) {
			return;
		}
		onChange(files[0]);
	};

	return (
		<button
			type="button"
			disabled={disabled}
			onClick={() => inputRef.current?.click()}
			onKeyDown={(event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					inputRef.current?.click();
				}
			}}
			onDragOver={(event) => {
				if (disabled) return;
				event.preventDefault();
				setIsDragging(true);
			}}
			onDragLeave={() => setIsDragging(false)}
			onDrop={(event) => {
				if (disabled) return;
				event.preventDefault();
				setIsDragging(false);
				handleFiles(event.dataTransfer.files);
			}}
			className={`flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-6 py-4 text-center transition ${
				disabled ? "cursor-not-allowed opacity-60" : ""
			} ${isDragging ? "border-primary bg-muted/50" : "border-border bg-muted/20"}`}
		>
			<Upload className="mb-2 size-8 text-primary" />
			<span className="font-medium text-primary">Browse</span>
			<span className="text-muted-foreground text-sm">
				or drop file to upload
			</span>
			{value?.name ? (
				<span className="mt-2 text-muted-foreground text-xs">
					{value.name}
				</span>
			) : null}
			<input
				ref={inputRef}
				type="file"
				accept=".zip,application/zip"
				className="hidden"
				disabled={disabled}
				onChange={(event) => handleFiles(event.target.files)}
			/>
		</button>
	);
};

export const SettingsTab = (props: AppSettingsProps) => {
	const { id } = props;
	const { monolithStore, configStore } = useRootStore();
	const { adminMode } = useSettings();
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const { handleSubmit, control, reset, watch } = useForm<EditAppForm>({
		defaultValues: {
			PROJECT_UPLOAD: null,
		},
	});

	const uploadFile = watch("PROJECT_UPLOAD");

	const admin = configStore.store.user.admin;

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
		url?: string;
		hasPortal?: boolean;
		// isPublished: boolean;
		project_has_portal: boolean;
		project_portal_url?: string;
		lastCompiled?: string;
		compiledBy?: string;
	}>({
		url: "",
		hasPortal: false,
		// isPublished: false,
		project_has_portal: false,
		project_portal_url: "",
		lastCompiled: "12/25/2022",
		compiledBy: "J.Smith",
	});

	const getPortalDetails = usePixel<{
		url?: string;
		hasPortal?: boolean;
		// isPublished: boolean;
		project_has_portal: boolean;
		project_portal_url?: string;
		lastCompiled?: string;
		compiledBy?: string;
	}>(
		adminMode
			? `AdminGetProjectPortalDetails('${id}');`
			: `GetProjectPortalDetails('${id}');`,
	);

	/**
	 * @name getPortalReactors
	 */
	const getPortalReactors = useCallback(() => {
		const pixelString = adminMode
			? `AdminGetProjectAvailableReactors(project=['${id}']);`
			: `GetProjectAvailableReactors(project=['${id}']);`;

		monolithStore
			.runQuery(pixelString)
			.then((response) => {
				console.log(response, "response");
				const output: string[] = response.pixelReturn[0].output;
				const type: string = response.pixelReturn[0].operationType[0];

				if (type.indexOf("ERROR") > -1) {
					toast.error(String(output));

					return;
				}

				setPortalReactors((prev) => ({
					...prev,
					reactors: output,
				}));
			})
			.catch((error) => {
				toast.error(String(error));
			});
	}, [adminMode, id, monolithStore]);

	useEffect(() => {
		if (getPortalDetails.status !== "SUCCESS") {
			return;
		}

		// Set Details for Portal
		setPortalDetails({
			...getPortalDetails.data,
		});

		// Get the portal reactors if we have a portal
		if (getPortalDetails.data.project_has_portal) {
			getPortalReactors();
		}
	}, [getPortalDetails.status, getPortalDetails.data, getPortalReactors]);

	/** LOADING */
	if (getPortalDetails.status !== "SUCCESS") {
		return (
			<div className="flex items-center gap-2 text-muted-foreground">
				<Spinner className="size-4" />
				<span>Loading...</span>
			</div>
		);
	}

	/**
	 * @name recompileReactors
	 */
	const recompileReactors = ({ release }) => {
		let pixelString: string;
		if (release == null) {
			pixelString = `ReloadInsightClasses(project='${id}');`;
		} else {
			pixelString = `ReloadInsightClasses(project='${id}', release=true);`;
		}

		monolithStore
			.runQuery(pixelString)
			.then((response) => {
				const output: string[] = response.pixelReturn[0].output;
				const type: string = response.pixelReturn[0].operationType[0];

				if (type.indexOf("ERROR") > -1) {
					toast.error(String(output));
					return;
				}

				if (release == null) {
					toast.success("Successfully recompiled");
				} else {
					toast.success("Successfully redeployed");
				}
			})
			.catch((error) => {
				toast.error(String(error));
			});
	};

	/**
	 * @name publish
	 * @desc Publishes Portal
	 */
	const _publish = () => {
		const pixelString = `PublishProject(project='${id}', release=true);`;
		monolithStore
			.runQuery(pixelString)
			.then((response) => {
				const output: string = response.pixelReturn[0].output;
				const type: string = response.pixelReturn[0].operationType[0];
				if (type.indexOf("ERROR") > -1) {
					toast.error(String(output));

					return;
				}

				setPortalDetails({
					...portalDetails,
					project_portal_url: output,
				});

				toast.success("Successfully published");
			})
			.catch((error) => {
				toast.error(String(error));
			});
	};

	/**
	 * @name enablePublishing
	 */
	const _enablePublishing = () => {
		setProjectPortal(admin, id, !portalDetails.project_has_portal)
			.then((resp) => {
				if (resp.data) {
					setPortalDetails({
						...portalDetails,
						project_has_portal: !portalDetails.project_has_portal,
					});

					toast.success(
						`Successfully ${
							!portalDetails.project_has_portal
								? "enabled"
								: "disabled"
						} portal`,
					);
				} else {
					toast.error(
						`Unsuccessfully ${
							!portalDetails.project_has_portal
								? "disabled"
								: "enabled"
						} portal`,
					);
				}
			})
			.catch((error) => {
				toast.error(String(error));
			});
	};

	/**
	 * @name editApp
	 */
	const editApp = handleSubmit(async (data: EditAppForm) => {
		// turn on loading
		setIsLoading(true);

		try {
			const path = "version/assets/";

			// unzip the file in the new app
			await monolithStore.runQuery(
				`DeleteAsset(filePath=["${path}"], space=["${id}"]);`,
			);

			// upload the file
			const upload = await uploadFileAPI(
				[data.PROJECT_UPLOAD],
				configStore.store.insightID,
				id,
				path,
			);

			// upnzip the file in the new app
			await monolithStore.runQuery(
				`UnzipFile(filePath=["${`${path}${upload[0].fileName}`}"], space=["${id}"]);`,
			);

			// Load the insight classes
			await monolithStore.runQuery(
				`ReloadInsightClasses(project='${id}', release=true);`,
			);

			// set the app portal
			await setProjectPortal(false, id, true, "public");

			// Publish the app the insight classes
			await monolithStore.runQuery(
				`PublishProject(project='${id}', release=true);`,
			);

			toast.success("Succesfully Updated Project");

			reset();
		} catch (e) {
			console.error(e);

			toast.error((e as Error).message);
		} finally {
			// turn of loading
			setIsLoading(false);
		}
	});

	return (
		<div className="flex w-full flex-col gap-6 p-4">
			{/* Access Section */}
			{/* <Typography variant="h6" gutterBottom>
        Access
      </Typography>
      <RootGrid container spacing={3}>
        <Grid item xs={12} md={5}>
          <ColumnBox>
            <LeftTextContainer>
              <StyledLockIcon fontSize="small" />
              <Box>
                <PublishTitle variant="subtitle2">Publish</PublishTitle>
                <Description variant="body2">
                  Enable the publishing of the portal
                </Description>
              </Box>
            </LeftTextContainer>
            <Switch
              defaultChecked
              size="medium"
              checked={portalDetails.project_has_portal}
              value={portalDetails.project_has_portal}
              onChange={() => {
                enablePublishing();
              }}
              disabled={
                !configStore.isEngineOperationAvailable("PROJECT", "access")
              }
            />
          </ColumnBox>
        </Grid>

        <Grid item xs={12} md={7}>
          <SecondColumnBox>
            <SecondColumnHeader>
              <Box>
                <PublishPortalDescription variant="subtitle2">
                  Publish Portal
                </PublishPortalDescription>
                <Typography variant="body2">
                  Publish the portal to generate a shareable link
                </Typography>
              </Box>

              <Button
                variant="contained"
                size="small"
                disabled={
                  !portalDetails.project_has_portal ||
                  !configStore.isEngineOperationAvailable("PROJECT", "access")
                }
                onClick={() => {
                  publish();
                }}
              >
                Publish
              </Button>
            </SecondColumnHeader>

            <StyledTextField
              fullWidth
              size="small"
              focused={false}
              label={"Link"}
              variant={"outlined"}
              value={
                portalDetails.project_has_portal
                  ? portalDetails.project_portal_url
                  : ""
              }
              InputProps={{
                startAdornment: <InsertLink />,
              }}
            >
              {portalDetails.project_has_portal
                ? portalDetails.project_portal_url
                : ""}
            </StyledTextField>
          </SecondColumnBox>
        </Grid>
      </RootGrid> */}
			{/* <SectionDivider /> */}
			{/* Reactors Section */}
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="space-y-1">
					<h3 className="font-semibold text-lg">Reactors</h3>

					{portalReactors.reactors.length > 0 && (
						<p className="text-muted-foreground text-sm">
							Custom reactors created for the portal
						</p>
					)}
				</div>

				{portalReactors.reactors.length > 0 && (
					<div className="flex flex-wrap gap-2">
						<Button
							variant="outlined"
							onClick={() => {
								recompileReactors({ release: true });
							}}
						>
							Deploy and Persist Changes
						</Button>
						<Button
							onClick={() => {
								recompileReactors({ release: null });
							}}
						>
							Compile Changes On This Instance
						</Button>
					</div>
				)}
			</div>

			{portalReactors.reactors.length > 0 ? (
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
			) : (
				<div className="flex h-[70px] items-center justify-center rounded-2xl border text-muted-foreground">
					No reactors found
				</div>
			)}

			<Separator className="my-6" />

			{/* Update Project Section */}
			<div className="flex flex-col gap-6 lg:flex-row lg:items-start">
				<div className="flex flex-1 flex-col gap-2">
					<div className="flex items-center gap-2 text-muted-foreground">
						{isLoading ? <Spinner className="size-4" /> : null}
					</div>
					<h3 className="font-semibold text-lg">Update Project</h3>
					<p className="text-muted-foreground text-sm">
						The maximum file size we can handle is 5MB per Zip
					</p>
					<Button
						disabled={isLoading || !uploadFile}
						onClick={editApp}
						className="w-fit"
					>
						Update
					</Button>
				</div>

				<div className="w-full max-w-[520px]">
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
							<FileDropArea
								value={field.value}
								disabled={
									!configStore.isEngineOperationAvailable(
										"PROJECT",
										"access",
									) || isLoading
								}
								onChange={(newValue) =>
									field.onChange(newValue)
								}
							/>
						)}
					/>
				</div>
			</div>
		</div>
	);
};
