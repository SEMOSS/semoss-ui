import {  OpenInBrowser } from "@mui/icons-material";
import LockIcon from "@mui/icons-material/Lock";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { usePixel } from "@semoss/sdk/react";
import {
	Box,
	Button,
	FileDropzone,
	Grid,
	LoadingScreen,
	styled,
	Table,
	TextField,
	Typography,
	useNotification,
} from "@semoss/ui";
import { setProjectPortal, uploadFile as uploadFileAPI } from "@/api";
import { Java } from "@/assets/img/Java";
import { useRootStore, useSettings } from "@/hooks";

const StyledTable = styled(Table)(({ theme }) => ({
	borderRadius: theme.spacing(1),
	borderColor: theme.palette.secondary.main,
	borderStyle: "solid",
	borderCollapse: "initial",
	borderWidth: "thin",
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
	display: "flex",
	borderRadius: "16px",
	border: `1px solid ${theme.palette.divider}`,
	alignItems: "center",
	justifyContent: "center",
	width: "100%",
	height: "70px",
	color: theme.palette.text.secondary,
}));

const StyledBox = styled(Box)({
	display: "flex",
	justifyContent: "space-between",
	alignItems: "flex-start",
	width: "100%",
	mb: 2,
	gap: 4,
	flexWrap: "nowrap",
});

const StyledContainer = styled(Box)(({ theme }) => ({
	padding: theme.spacing(2),
	width: "100%",
}));

const StyledReactor = styled(Box)({
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	mb: 2,
	flexWrap: "wrap",
	gap: 2,
});
// Root container
const _RootGrid = styled(Grid)(({ theme }) => ({
	marginBottom: theme.spacing(4),
	width: "100%",
}));

// Column wrapper box
const _ColumnBox = styled(Box)(({ theme }) => ({
	display: "flex",
	justifyContent: "space-between",
	gap: theme.spacing(2),
	border: `1px solid ${theme.palette.secondary.main}`,
	borderRadius: theme.shape.borderRadius * 2,
	padding: theme.spacing(2),
	height: 136,
}));

// Left text block container
const _LeftTextContainer = styled(Box)(({ theme }) => ({
	display: "flex",
	alignItems: "flex-start",
	gap: theme.spacing(1),
}));

// Styled Lock icon
const _StyledLockIcon = styled(LockIcon)(({ theme }) => ({
	color: theme.palette.text.disabled,
}));

// Publish title
const _PublishTitle = styled(Typography)(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	fontSize: "16px",
	gap: theme.spacing(1),
	marginBottom: theme.spacing(0.5),
}));

// Publish description
const Description = styled(Typography)({
	fontSize: "14px",
});

const _PublishPortalDescription = styled(Typography)({
	marginBottom: "0.5px",
});

// Second column container
const _SecondColumnBox = styled(Box)(({ theme }) => ({
	gap: theme.spacing(2),
	border: `1px solid ${theme.palette.secondary.main}`,
	borderRadius: theme.shape.borderRadius * 2,
	padding: theme.spacing(2),
	height: 136,
	width: 610,
}));

// Header section inside second column
const _SecondColumnHeader = styled(Box)(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	gap: theme.spacing(2),
	flexWrap: "wrap",
	paddingBottom: theme.spacing(2),
}));

// Custom text field
const _StyledTextField = styled(TextField)({
	"& .MuiOutlinedInput-root": {
		borderRadius: "8px",
	},
});

const SectionDivider = styled("hr")(({ theme }) => ({
	border: `1px solid ${theme.palette.secondary.divider}`,
	borderTop: theme.palette.secondary.divider,
	marginTop: theme.spacing(3),
	marginBottom: theme.spacing(3),
}));

const Title = styled(Typography)({
	fontSize: "20px",
});

const ReactorActions = styled(Box)(({ theme }) => ({
	display: "flex",
	gap: theme.spacing(2),
}));

const ActionBtnOutlined = styled(Button)({
	fontSize: "14px",
});

const LeftPane = styled(Box)({
	width: 619,
});

const RightPane = styled(Box)({
	width: 518,
});

const UpdateText = styled(Typography)(({ theme }) => ({
	marginBottom: theme.spacing(2),
	fontSize: "14px",
}));

const UploadIcon = styled(OpenInBrowser)(({ theme }) => ({
	fontSize: 32,
	color: theme.palette.primary.dark,
	marginBottom: theme.spacing(1),
}));

const BrowseText = styled(Typography)({
	color: "theme.palette.primary.dark",
	fontWeight: 500,
	cursor: "pointer",
});

const SecondaryText = styled(Typography)(({ theme }) => ({
	color: theme.palette.text.secondary,
}));

interface AppSettingsProps {
	id: string;
	condensed?: boolean;
}

type EditAppForm = {
	PROJECT_UPLOAD: File;
};

export const SettingsTab = (props: AppSettingsProps) => {
	const { id } = props;
	const { monolithStore, configStore } = useRootStore();
	const notification = useNotification();
	const { adminMode } = useSettings();
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const { handleSubmit, control, reset, watch } = useForm<EditAppForm>({
		defaultValues: {
			PROJECT_UPLOAD: null,
		},
	});

	const uploadFile = watch("PROJECT_UPLOAD");

	const admin = configStore.store.user.admin;

	// const mcpUrl = `${Env.MODULE}/api/ext/mcp/${id}/comms`;

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
	}, [getPortalDetails.status, getPortalDetails.data]);

	/** LOADING */
	if (getPortalDetails.status !== "SUCCESS") {
		return (
			<LoadingScreen>
				<LoadingScreen.Trigger description="Loading..." />
			</LoadingScreen>
		);
	}

	/**
	 * @name getPortalReactors
	 */
	const getPortalReactors = () => {
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
					notification.add({
						color: "error",
						message: output,
					});

					return;
				}

				setPortalReactors({
					...portalReactors,
					reactors: output,
				});
			})
			.catch((error) => {
				notification.add({
					color: "error",
					message: error,
				});
			});
	};

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
					notification.add({
						color: "error",
						message: output,
					});
					return;
				}

				if (release == null) {
					notification.add({
						color: "success",
						message: "Successfully recompiled",
					});
				} else {
					notification.add({
						color: "success",
						message: "Successfully redeployed",
					});
				}
			})
			.catch((error) => {
				notification.add({
					color: "error",
					message: error,
				});
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
					notification.add({
						color: "error",
						message: output,
					});

					return;
				}

				setPortalDetails({
					...portalDetails,
					project_portal_url: output,
				});

				notification.add({
					color: "success",
					message: "Successfully published",
				});
			})
			.catch((error) => {
				notification.add({
					color: "error",
					message: error,
				});
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

					notification.add({
						color: "success",
						message: `Successfully ${
							!portalDetails.project_has_portal
								? "enabled"
								: "disabled"
						} portal`,
					});
				} else {
					notification.add({
						color: "error",
						message: `Unsuccessfully ${
							!portalDetails.project_has_portal
								? "disabled"
								: "enabled"
						} portal`,
					});
				}
			})
			.catch((error) => {
				notification.add({
					color: "error",
					message: error,
				});
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

			notification.add({
				color: "success",
				message: "Succesfully Updated Project",
			});

			reset();
		} catch (e) {
			console.error(e);

			notification.add({
				color: "error",
				message: e.message,
			});
		} finally {
			// turn of loading
			setIsLoading(false);
		}
	});

	// /**
	//  * Copy text and add it to the clipboard
	//  * @param text - text to copy
	//  */
	// const copy = async (text: string) => {
	// 	try {
	// 		await navigator.clipboard.writeText(text);

	// 		notification.add({
	// 			color: "success",
	// 			message: "Successfully copied to clipboard",
	// 		});
	// 	} catch (_e) {
	// 		notification.add({
	// 			color: "error",
	// 			message: "Unable to copy to clipboard",
	// 		});
	// 	}
	// };

	return (
		<StyledContainer>
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
			<StyledReactor>
				<Box>
					<Title variant="h6">Reactors</Title>

					{portalReactors.reactors.length > 0 && (
						<Description variant="body2">
							Custom reactors created for the portal
						</Description>
					)}
				</Box>

				{portalReactors.reactors.length > 0 && (
					<ReactorActions>
						<ActionBtnOutlined
							variant="outlined"
							onClick={() => {
								recompileReactors({ release: true });
							}}
						>
							Deploy and Persist Changes
						</ActionBtnOutlined>
						<ActionBtnOutlined
							variant="contained"
							onClick={() => {
								recompileReactors({ release: null });
							}}
						>
							Compile Changes On This Instance
						</ActionBtnOutlined>
					</ReactorActions>
				)}
			</StyledReactor>

			{portalReactors.reactors.length > 0 ? (
				<StyledTable>
					<Table.Body>
						{portalReactors.reactors.map((reactor) => (
							<Table.Row key={`reactor-${reactor}`}>
								<Table.Cell>{reactor}</Table.Cell>
								<Table.Cell align="right">
									<Java />
								</Table.Cell>
							</Table.Row>
						))}
					</Table.Body>
				</StyledTable>
			) : (
				<StyledTypography variant="body2">
					No reactors found
				</StyledTypography>
			)}

			<SectionDivider />

			{/* <Stack direction="row">
				<TextField
					label="MCP URL"
					size="small"
					value={mcpUrl}
					fullWidth={true}
					slotProps={{
						input: {
							endAdornment: (
								<InputAdornment position="end">
									<IconButton
										aria-label="copy"
										color="default"
										size="small"
										onClick={() => copy(`{{${mcpUrl}}}`)}
									>
										<ContentCopy fontSize="small" />
									</IconButton>
								</InputAdornment>
							),
						},
					}}
				/>
			</Stack> */}

			<SectionDivider />

			{/* Update Project Section */}
			<StyledBox>
				{/* Left Content */}
				<LeftPane>
					{isLoading && (
						<LoadingScreen>
							<LoadingScreen.Trigger description="Loading..." />
						</LoadingScreen>
					)}
					<Title variant="h6">Update Project</Title>
					<UpdateText variant="body2">
						The maximum file size we can handle is 5MB per Zip
					</UpdateText>
					<Button
						variant="contained"
						disabled={isLoading || !uploadFile}
						onClick={editApp}
					>
						Update
					</Button>
				</LeftPane>

				{/* Right Upload Box */}
				<RightPane>
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
							>
								<UploadIcon />
								<BrowseText variant="body2">Browse</BrowseText>
								<SecondaryText variant="caption">
									or drop file to upload
								</SecondaryText>
							</FileDropzone>
						)}
					/>
				</RightPane>
			</StyledBox>
		</StyledContainer>
	);
};
