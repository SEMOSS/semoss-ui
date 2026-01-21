import { GetAppRounded } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { MembersTable } from "@semoss/shared";
import {
	Container,
	IconButton,
	Stack,
	styled,
	Tooltip,
	Typography,
	useNotification,
} from "@semoss/ui";
import { AppSettings } from "@/components/app";
import {
	// MembersTable,
	PendingMembersTable,
	SettingsTiles,
} from "@/components/settings";
import { SettingsContext } from "@/contexts";
import { useRootStore, useWorkspace } from "@/hooks";
import { Panel } from "./Panel";

const StyledContainer = styled("div")(({ theme }) => ({
	width: "100%",
	display: "flex",
	alignSelf: "stretch",
	flexDirection: "column",
	alignItems: "flex-start",
	gap: theme.spacing(2),
	paddingTop: theme.spacing(2),
}));

const StyledContent = styled("div")(({ theme }) => ({
	display: "flex",
	width: "100%",
	flexDirection: "column",
	alignItems: "flex-start",
	gap: theme.spacing(2),
	flexShrink: "0",
}));

export const SettingsPanel = observer(
	({ value }: { value: "CURRENT" | "APP" | "GENERAL" }) => {
		const { configStore, monolithStore } = useRootStore();
		const notification = useNotification();
		const { workspace } = useWorkspace();
		const navigate = useNavigate();
		const view = value;

		/**
		 * Method that is called to export the app
		 */
		const exportApp = async () => {
			// turn on loading
			workspace.setLoading(true);

			try {
				// export  the app
				const response = await monolithStore.runQuery<[string]>(
					`ExportProjectApp(project=["${workspace.appId}"]);`,
				);

				// throw an error if there is no key
				const key = response.pixelReturn[0].output;
				if (!key) {
					throw new Error("Error exporting app");
				}

				await monolithStore.download(configStore.store.insightID, key);

				notification.add({
					color: "success",
					message: "Success",
				});
			} catch (e) {
				console.error(e);

				notification.add({
					color: "error",
					message: e.message,
				});
			} finally {
				// turn of loading
				workspace.setLoading(false);
			}
		};

		return (
			<Panel>
				<SettingsContext.Provider
					value={{
						adminMode: false,
					}}
				>
					<Container
						maxWidth={"xl"}
						sx={{
							height: "100%",
							display: "flex",
							flexDirection: "column",
							gap: "16px",
							overflowX: "hidden",
							overflowY: "auto",
						}}
					>
						<StyledContainer>
							{view !== "GENERAL" &&
							(workspace.role === "EDITOR" ||
								workspace.role === "OWNER") ? (
								<Stack
									sx={{ width: "100%" }}
									justifyContent={"flex-end"}
									direction={"row"}
								>
									<div>
										<Tooltip title={"Export"}>
											<IconButton
												color="inherit"
												onClick={() => {
													exportApp();
												}}
											>
												<GetAppRounded />
											</IconButton>
										</Tooltip>
									</div>
								</Stack>
							) : null}
							<StyledContent>
								{view === "CURRENT" && (
									<>
										<PendingMembersTable
											type={"PROJECT"}
											id={workspace.appId}
										/>
										<MembersTable
											type={"PROJECT"}
											id={workspace.appId}
											onChange={() => console.log("TODO")}
										/>
									</>
								)}
								{view === "APP" && (
									<AppSettings id={workspace.appId} />
								)}
								{view === "GENERAL" && (
									<>
										<Typography
											variant="subtitle1"
											gutterBottom
										>
											Privacy & Access Control
											<Typography variant="body2">
												Configure who can access your
												apps and how it appears to
												others
											</Typography>
										</Typography>
										<SettingsTiles
											type={"PROJECT"}
											id={workspace.appId}
											name={
												workspace.metadata
													?.project_name || "app"
											}
											onDelete={() => {
												if (
													location.pathname.startsWith(
														"/settings/app/",
													)
												) {
													// If in app settings
													navigate("/settings/app");
												} else {
													// If in App Library
													navigate("/");
												}
											}}
										/>
									</>
								)}
							</StyledContent>
						</StyledContainer>
					</Container>
				</SettingsContext.Provider>
			</Panel>
		);
	},
);
