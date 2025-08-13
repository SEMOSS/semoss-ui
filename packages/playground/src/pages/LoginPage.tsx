import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { type Location, Navigate, useLocation } from "react-router-dom";
import { useInsight } from "@semoss/sdk/react";
import {
	Alert,
	Box,
	Button,
	Divider,
	LinearProgress,
	Modal,
	Snackbar,
	Stack,
	styled,
	TextField,
	Typography,
} from "@semoss/ui";
import LOGO_FULL from "@/assets/img/logo_full.svg";

const APP_NAME = import.meta.env.VITE_APP_NAME
	? import.meta.env.VITE_APP_NAME
	: "";
const LOGO_FULL_PATH = import.meta.env.VITE_LOGO_FULL_PATH
	? import.meta.env.VITE_LOGO_FULL_PATH
	: "";

const StyledMain = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	height: "100vh",
	width: "100vw",
	background: theme.palette.background.paper,
}));

const StyledRow = styled("div")(() => ({
	flex: "1",
	display: "flex",
	flexDirection: "row",
	position: "relative",
	width: "100%",
	overflow: "hidden",
}));

const StyledProgress = styled(LinearProgress)(() => ({
	width: "100%",
}));

const StyledScroll = styled("div")(({ theme }) => ({
	flexShrink: 0,
	position: "relative",
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	zIndex: 1,
	background: theme.palette.background.paper,
	overflowY: "auto",
	overflowX: "hidden",
	[theme.breakpoints.down("md")]: {
		height: "100%",
		width: "100%",
	},
}));

const StyledContent = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(3),
	width: "610px",
	marginTop: theme.spacing(18), // 144px
	marginBottom: theme.spacing(2), // 16px
	marginLeft: theme.spacing(13.5), // 108px
	marginRight: theme.spacing(13.5), // 108px
	[theme.breakpoints.down("md")]: {
		margin: 0,
		padding: theme.spacing(4),
		maxWidth: "610px",
		width: "100%",
	},
}));

const StyledGradient = styled("div")(({ theme }) => ({
	height: "100%",
	width: theme.spacing(42), // 336px
	background:
		"linear-gradient(90deg, #FFF 0%, rgba(255, 255, 255, 0.00) 100%)",
	zIndex: 1,
}));

const StyledImageHolder = styled("div")(() => ({
	position: "absolute",
	top: "0px",
	right: "0px",
	bottom: "0px",
	overflow: "hidden",
	zIndex: 0,
}));

const _StyledImage = styled("img")(() => ({
	height: "100%",
	// width: '100%',
	objectFit: "cover",
}));

const StyledAction = styled(Button)({
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	overflow: "hidden",
});

const StyledActionBox = styled("div")({
	display: "flex",
	alignItems: "center",
	gap: "16px",
	padding: "4px",
});

// const StyledActionImage = styled('img')(({ theme }) => ({
//     height: theme.spacing(3),
// }));

const StyledActionText = styled("span")(() => ({
	fontFamily: "Inter",
	fontSize: "14px",
	fontStyle: "normal",
	fontWeight: 500,
	lineHeight: "24px",
	letterSpacing: "0.4px",
	color: "#000",
}));

const StyledDivider = styled(Divider)({
	background: "transparent",
});

const StyledDividerBox = styled(Box)({
	color: "#000",
	fontFeatureSettings: '"clig" off, "liga" off',
	fontFamily: "Inter",
	fontSize: "16px",
	fontStyle: "normal",
	fontWeight: 700,
	lineHeight: "150%" /* 24px */,
	letterSpacing: " 0.15px",
});

const StyledLogoContainer = styled(Stack)(({ theme }) => ({
	marginBottom: theme.spacing(1),
}));

const StyledTitle = styled(Typography)(({ theme }) => ({
	marginBottom: theme.spacing(1),
}));

const StyledInstructions = styled(Typography)(({ theme }) => ({
	marginBottom: theme.spacing(4),
}));

interface TypeUserLogin {
	USERNAME: string;
	PASSWORD: string;
	REMEMBER_LOGIN: boolean;
	OTP_CONFIRM: string;
}

/**
 * LoginPage
 */
export const LoginPage = observer(() => {
	const { system, actions, isAuthorized } = useInsight();
	const location = useLocation();

	const [forgotPassword, setForgotPassword] = useState(false);
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		color: "success" | "info" | "warning" | "error";
	}>({
		open: false,
		message: "",
		color: "success",
	});
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const { control, handleSubmit } = useForm({
		defaultValues: {
			USERNAME: "",
			PASSWORD: "",
			REMEMBER_LOGIN: false,
			OTP_CONFIRM: "",
		},
	});

	// get a map of all providers
	const availableProvidersMap: Record<
		string,
		{
			provider: string;
			name: string;
			isOauth: boolean;
		}
	> = system.config.availableProviders.reduce((acc, val) => {
		acc[val.provider] = acc;

		return acc;
	}, {});

	// check if there is oAuth
	const hasOAuth = system.config.availableProviders.some(
		(val) => val.isOauth,
	);

	const isNative = Object.hasOwn(availableProvidersMap, "native");

	// check if it requires username or password
	const hasUsernamePassword = isNative;

	/**
	 * Allow the user to login
	 */
	const login = handleSubmit(
		async (data: TypeUserLogin): Promise<TypeUserLogin> => {
			// turn on loading
			setIsLoading(true);

			if (!data.USERNAME || !data.PASSWORD) {
				setError("Username and Password is Required");
				return;
			}

			await actions
				.login({
					type: "native",
					username: data.USERNAME,
					password: data.PASSWORD,
				})
				.then(() => {
					// noop
				})
				.catch((error) => {
					setError(error.message);
				})
				.finally(() => {
					// turn off loading
					setIsLoading(false);
				});
		},
	);

	/**
	 * Login with oauth
	 * @param provider - provider to oauth with
	 */
	const oauth = async (provider: string) => {
		// turn on loading
		setIsLoading(true);

		await actions
			.login({
				type: "oauth",
				provider: provider,
			})
			.then(() => {
				// turn off loading
				setIsLoading(false);

				// noop
				// (handled  by the configStore)

				setSnackbar({
					open: true,
					message: `Successfully logged in`,
					color: "success",
				});
			})
			.catch((error) => {
				// turn off loading
				setIsLoading(false);

				setError(error.message);

				setSnackbar({
					open: true,
					message: error.message,
					color: "error",
				});
			});
	};

	// get the path the user is coming from
	const path = (location.state as { from: Location })?.from?.pathname || "/";

	// navigate if already logged in
	if (isAuthorized) {
		return <Navigate to={path} replace />;
	}

	return (
		<>
			<Snackbar
				open={snackbar.open}
				anchorOrigin={{ vertical: "top", horizontal: "right" }}
				autoHideDuration={6000}
				onClose={() => {
					setSnackbar({
						open: false,
						message: "",
						color: "success",
					});
				}}
			>
				<Alert severity={snackbar.color} sx={{ width: "100%" }}>
					{snackbar.message}
				</Alert>
			</Snackbar>
			<StyledMain>
				<StyledRow>
					<StyledScroll>
						<StyledContent>
							<div>
								<StyledLogoContainer
									direction={"row"}
									alignItems={"center"}
									spacing={1}
								>
									{LOGO_FULL_PATH ? (
										<img
											src={LOGO_FULL_PATH}
											aria-label={APP_NAME}
										/>
									) : (
										<img
											src={LOGO_FULL}
											aria-label={APP_NAME}
										/>
									)}
								</StyledLogoContainer>
								<StyledTitle variant="h4">Welcome!</StyledTitle>
								<StyledInstructions variant="body1">
									Log in below
								</StyledInstructions>
							</div>
							{error && <Alert color="error">{error}</Alert>}
							<form>
								<Stack spacing={2}>
									{hasUsernamePassword && (
										<>
											<Controller
												name={"USERNAME"}
												control={control}
												rules={{
													required: true,
												}}
												render={({ field }) => {
													return (
														<TextField
															label="Username"
															variant="outlined"
															fullWidth
															value={
																field.value
																	? field.value
																	: ""
															}
															onChange={(e) =>
																field.onChange(
																	e.target
																		.value,
																)
															}
															inputProps={{
																"data-testid":
																	"loginPage-textField-username",
															}}
														/>
													);
												}}
											/>
											<Controller
												name={"PASSWORD"}
												control={control}
												rules={{
													required: true,
												}}
												render={({ field }) => {
													return (
														<TextField
															label="Password"
															variant="outlined"
															type="password"
															fullWidth
															value={
																field.value
																	? field.value
																	: ""
															}
															onChange={(e) =>
																field.onChange(
																	e.target
																		.value,
																)
															}
															inputProps={{
																"data-testid":
																	"loginPage-textField-password",
															}}
														/>
													);
												}}
											/>
											<Button
												fullWidth
												variant={"contained"}
												onClick={login}
												type="submit"
												data-testid={
													"loginPage-button-login"
												}
											>
												Login
											</Button>
										</>
									)}

									{hasUsernamePassword && hasOAuth && (
										<StyledDivider>
											<StyledDividerBox>
												or
											</StyledDividerBox>
										</StyledDivider>
									)}
									{system.config.availableProviders.map(
										(p) => {
											// skip ones that aren't oauth
											if (!p.isOauth) {
												return null;
											}

											return (
												<StyledAction
													key={p.provider}
													variant="outlined"
													onClick={() => {
														oauth(p.provider);
													}}
													fullWidth
												>
													<StyledActionBox>
														{/* <StyledActionImage
                                                                    src={MS}
                                                                /> */}
														<StyledActionText>
															{p.name}
														</StyledActionText>
													</StyledActionBox>
												</StyledAction>
											);
										},
									)}
								</Stack>
							</form>
						</StyledContent>
					</StyledScroll>
					<StyledGradient />
					<StyledImageHolder>&nbsp;</StyledImageHolder>
				</StyledRow>
				{isLoading && <StyledProgress />}
			</StyledMain>
			<Modal
				open={forgotPassword}
				maxWidth={"md"}
				onClose={() => {
					setForgotPassword(false);
				}}
			>
				<Modal.Title>Forgot your password?</Modal.Title>
				<Modal.Content>
					<Box>
						Please contact your administrator to reset password.
					</Box>
				</Modal.Content>
				<Modal.Actions>
					<Button
						variant={"outlined"}
						onClick={() => {
							setForgotPassword(false);
						}}
					>
						Ok
					</Button>
				</Modal.Actions>
			</Modal>
		</>
	);
});
