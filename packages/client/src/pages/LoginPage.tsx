import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { type Location, Navigate, useLocation } from "react-router-dom";
import {
	Alert,
	Box,
	Button,
	ButtonGroup,
	Divider,
	LinearProgress,
	Modal,
	Snackbar,
	Stack,
	styled,
	TextField,
	Tooltip,
	Typography,
} from "@semoss/ui";
import GIF from "@/assets/img/login-gif.gif";
import { useRootStore } from "@/hooks";

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

const StyledImage = styled("img")(() => ({
	height: "100%",
	// width: '100%',
	objectFit: "cover",
}));

const StyledAction = styled(ButtonGroup.Item)({
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

const StyledButtonGroup = styled(ButtonGroup)({
	".MuiButtonGroup-grouped": {
		borderColor: "#fff",
	},
});

const StyledButtonGroupItem = styled(ButtonGroup.Item, {
	shouldForwardProp: (prop) => prop !== "selected",
})<{
	/** Track if Button is selected */
	selected: boolean;
}>(({ theme, selected }) => ({
	color: selected ? theme.palette.common.white : theme.palette.primary.main,
	backgroundColor: selected
		? theme.palette.primary.main
		: theme.palette.common.white,
	"&:hover": {
		backgroundColor: selected ? theme.palette.primary.dark : "",
		borderColor: theme.palette.common.white,
	},
}));

const StyledRegisterNowBox = styled(Box)({
	display: "flex",
	align: "center",
	alignItems: "center",
	justifyContent: "center",
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

const StyledButtonText = styled(ButtonGroup.Item)({
	fontFamily: "Inter",
	fontSize: "15px",
	fontStyle: "normal",
	fontWeight: 600,
	lineHeight: "26px" /* 173.333% */,
	letterSpacing: "0.46px",
});

const StyledGoBackBox = styled(Box)({
	display: "flex",
	justifyContent: "space-between",
});

interface TypeUserLogin {
	USERNAME: string;
	PASSWORD: string;
	REMEMBER_LOGIN: boolean;
	OTP_CONFIRM: string;
}

interface TypeUserRegister {
	FIRST_NAME: "";
	LAST_NAME: "";
	USERNAME: "";
	EMAIL: "";
	PHONE: "";
	EXTENTION: "";
	COUNTRY_CODE: "";
	PASSWORD: "";
	PASSWORD_CONFIRMATION: "";
}

/**
 * LoginPage
 */
export const LoginPage = observer(() => {
	const { configStore } = useRootStore();
	const location = useLocation();

	const [forgotPassword, setForgotPassword] = useState(false);
	const [loginType, setLoginType] = useState<
		"native" | "ldap" | "linotp" | ""
	>("");
	const [register, setRegister] = useState(false);
	const [showOTPCodeField, setShowOTPCodeField] = useState(false);
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
	const [success, setSuccess] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const {
		control,
		handleSubmit,
		formState: { errors: formErrors },
	} = useForm({
		mode: "onChange",
		defaultValues: {
			USERNAME: "",
			PASSWORD: "",
			REMEMBER_LOGIN: false,
			OTP_CONFIRM: "",
		},
	});

	const {
		control: registerControl,
		handleSubmit: registerSubmit,
		watch,
		formState: { errors },
		reset,
	} = useForm({
		mode: "onChange",
		defaultValues: {
			FIRST_NAME: "",
			LAST_NAME: "",
			USERNAME: "",
			EMAIL: "",
			PHONE: "",
			EXTENTION: "",
			COUNTRY_CODE: "",
			PASSWORD: "",
			PASSWORD_CONFIRMATION: "",
		},
	});

	const regPassword = watch("PASSWORD");

	const regPasswordRules = (password: string) => {
		return {
			length: password.length >= 8,
			upper: /[A-Z]/.test(password),
			lower: /[a-z]/.test(password),
			special: /[!@#$%^&*]/.test(password),
		};
	};

	const passwordTooltipContent = (
		<Box>
			<Typography variant="body2">• At least 8 characters</Typography>
			<Typography variant="body2">• One uppercase letter</Typography>
			<Typography variant="body2">• One lowercase letter</Typography>
			<Typography variant="body2">
				• One special character [!, @, #, $, %, ^, &, *]
			</Typography>
		</Box>
	);

	// get a map of all providers
	const availableProvidersMap: Record<
		string,
		{
			provider: string;
			label: string;
			name: string;
			isOauth: boolean;
		}
	> = configStore.store.config.availableProviders.reduce((acc, val) => {
		acc[val.provider] = acc;

		return acc;
	}, {});

	// check if there is oAuth
	const hasOAuth = configStore.store.config.availableProviders.some(
		(val) => val.isOauth,
	);

	const isNative = Object.hasOwn(availableProvidersMap, "native"),
		isLdap = Object.hasOwn(availableProvidersMap, "ldap"),
		isLinOTP = Object.hasOwn(availableProvidersMap, "linotp");

	// check if it requires username or password
	const hasUsernamePassword = isNative || isLdap || isLinOTP;

	const hasMoreThanOneUserNamePassword =
		(isNative && isLdap) || (isNative && isLinOTP) || (isLdap && isLinOTP);

	// set initial selected login type from config.
	useEffect(() => {
		if (isNative) {
			setLoginType("native");
		} else if (isLdap) {
			setLoginType("ldap");
		} else if (isLinOTP) {
			setLoginType("linotp");
		}
	}, [isNative, isLdap, isLinOTP]);

	/**
	 * Allow the user to login
	 */
	const login = handleSubmit(
		async (data: TypeUserLogin): Promise<TypeUserLogin> => {
			// turn on loading
			setIsLoading(true);
			setSuccess("");

			if (!data.USERNAME || !data.PASSWORD) {
				setError("Username and Password is Required");
				return;
			}

			if (!showOTPCodeField) {
				if (loginType === "native") {
					await configStore
						.login(data.USERNAME, data.PASSWORD)
						.then(async () => {
							// noop
							await configStore.initialize();
						})
						.catch((error) => {
							setError(error.message);
						})
						.finally(() => {
							// turn off loading
							setIsLoading(false);
						});
				}
				if (loginType === "ldap") {
					await configStore
						.loginLDAP(data.USERNAME, data.PASSWORD)
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
				}
				if (loginType === "linotp") {
					await configStore
						.loginOTP(data.USERNAME, data.PASSWORD)
						.then(() => {
							// noop
							setShowOTPCodeField(true);
						})
						.catch((error) => {
							setError(error.message);
						})
						.finally(() => {
							// turn off loading
							setIsLoading(false);
						});
				}
			}
			if (showOTPCodeField) {
				await configStore
					.confirmOTP(data.OTP_CONFIRM)
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
				setShowOTPCodeField(true);
			}
		},
	);

	/**
	 * Allow the user to login
	 */
	const registerAccount = registerSubmit(
		async (data: TypeUserRegister): Promise<TypeUserRegister> => {
			// turn on loading
			setIsLoading(true);

			if (
				!data.USERNAME ||
				!data.PASSWORD ||
				!data.PASSWORD_CONFIRMATION ||
				!data.FIRST_NAME ||
				!data.LAST_NAME ||
				!data.EMAIL
			) {
				setError(
					"Username, password, password confirmation, email, first and last name are required",
				);
				setIsLoading(false);
				return;
			}

			if (data.PASSWORD !== data.PASSWORD_CONFIRMATION) {
				setError("Passwords do not match");
				setIsLoading(false);
				return;
			}

			await configStore
				.register(
					`${data.FIRST_NAME} ${data.LAST_NAME}`,
					data.USERNAME,
					data.EMAIL,
					data.PASSWORD,
					data.PHONE,
					data.EXTENTION,
					data.COUNTRY_CODE,
				)
				.then((res) => {
					if (res) {
						setError("");
						setRegister(false);
						setSuccess(
							"Account registration successful. Log in below.",
						);
						reset();
					}
				})
				.catch((error) => {
					setIsLoading(false);
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

		await configStore
			.oauth(provider)
			.then(async () => {
				await configStore.initialize();
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
	if (configStore.store.status === "SUCCESS") {
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
									{configStore.theme.logo ? (
										<img src={configStore.theme.logo} />
									) : null}
									<Typography
										variant="h6"
										sx={{ fontWeight: 700 }}
									>
										{configStore.theme.name}
									</Typography>
								</StyledLogoContainer>
								<StyledTitle variant="h4">Welcome!</StyledTitle>
								<StyledInstructions variant="body1">
									{register
										? "Register below"
										: "Log in below"}
								</StyledInstructions>
							</div>
							{!register && hasMoreThanOneUserNamePassword && (
								<StyledButtonGroup variant="outlined">
									{isNative && (
										<StyledButtonGroupItem
											onClick={() => {
												setLoginType("native");
												setSuccess("");
												setError("");
											}}
											selected={loginType === "native"}
											data-testid={
												"loginPage-button-native"
											}
										>
											Native
										</StyledButtonGroupItem>
									)}
									{isLdap && (
										<StyledButtonGroupItem
											onClick={() => {
												setLoginType("ldap");
												setSuccess("");
												setError("");
											}}
											selected={loginType === "ldap"}
											data-testid={
												"loginPage-button-ldap"
											}
										>
											LDAP
										</StyledButtonGroupItem>
									)}
									{isLinOTP && (
										<StyledButtonGroupItem
											onClick={() => {
												setLoginType("linotp");
												setSuccess("");
												setError("");
											}}
											selected={loginType === "linotp"}
											data-testid={
												"loginPage-button-linotp"
											}
										>
											LinOTP
										</StyledButtonGroupItem>
									)}
								</StyledButtonGroup>
							)}
							{error && (
								<Alert severity="error" color="error">
									{error}
								</Alert>
							)}
							{success && (
								<Alert severity="success" color="success">
									{success}
								</Alert>
							)}
							<form>
								<Stack spacing={2}>
									{hasUsernamePassword && (
										<>
											{!showOTPCodeField && register && (
												<>
													<Controller
														name={"FIRST_NAME"}
														control={
															registerControl
														}
														rules={{
															required:
																"First name is required",
														}}
														render={({ field }) => {
															return (
																<TextField
																	label="First Name *"
																	variant="outlined"
																	size="small"
																	fullWidth
																	value={
																		field.value
																			? field.value
																			: ""
																	}
																	onChange={(
																		e,
																	) =>
																		field.onChange(
																			e
																				.target
																				.value,
																		)
																	}
																	inputProps={{
																		"data-testid":
																			"loginPage-textField-firstNameRegister",
																	}}
																	error={
																		!!errors.FIRST_NAME
																	}
																	helperText={
																		errors
																			.FIRST_NAME
																			?.message
																	}
																/>
															);
														}}
													/>
													<Controller
														name={"LAST_NAME"}
														control={
															registerControl
														}
														rules={{
															required:
																"Last name is required",
														}}
														render={({ field }) => {
															return (
																<TextField
																	label="Last Name *"
																	size="small"
																	variant="outlined"
																	fullWidth
																	value={
																		field.value
																			? field.value
																			: ""
																	}
																	onChange={(
																		e,
																	) =>
																		field.onChange(
																			e
																				.target
																				.value,
																		)
																	}
																	inputProps={{
																		"data-testid":
																			"loginPage-textField-lastNameRegister",
																	}}
																	error={
																		!!errors.LAST_NAME
																	}
																	helperText={
																		errors
																			.LAST_NAME
																			?.message
																	}
																/>
															);
														}}
													/>
													<Controller
														name={"USERNAME"}
														control={
															registerControl
														}
														rules={{
															required:
																"Username is required",
														}}
														render={({ field }) => {
															return (
																<TextField
																	label="Username *"
																	size="small"
																	variant="outlined"
																	fullWidth
																	value={
																		field.value
																			? field.value
																			: ""
																	}
																	onChange={(
																		e,
																	) =>
																		field.onChange(
																			e
																				.target
																				.value,
																		)
																	}
																	inputProps={{
																		"data-testid":
																			"loginPage-textField-usernameRegister",
																	}}
																	error={
																		!!errors.USERNAME
																	}
																	helperText={
																		errors
																			.USERNAME
																			?.message
																	}
																/>
															);
														}}
													/>
													<Controller
														name={"EMAIL"}
														control={
															registerControl
														}
														rules={{
															required:
																"Email is required",
															pattern: {
																value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
																message:
																	"Please enter a valid email address",
															},
														}}
														render={({ field }) => {
															return (
																<TextField
																	label="Email *"
																	size="small"
																	variant="outlined"
																	fullWidth
																	value={
																		field.value
																			? field.value
																			: ""
																	}
																	onChange={(
																		e,
																	) =>
																		field.onChange(
																			e
																				.target
																				.value,
																		)
																	}
																	inputProps={{
																		"data-testid":
																			"loginPage-textField-emailRegister",
																	}}
																	error={
																		!!errors.EMAIL
																	}
																	helperText={
																		errors
																			.EMAIL
																			?.message
																	}
																/>
															);
														}}
													/>
													<Controller
														name={"PHONE"}
														control={
															registerControl
														}
														rules={{
															pattern: {
																value: /^\d{10}$/,
																message:
																	"Please enter valid Phone Number",
															},
														}}
														render={({ field }) => {
															return (
																<TextField
																	label="Phone Number"
																	size="small"
																	variant="outlined"
																	fullWidth
																	value={
																		field.value
																			? field.value
																			: ""
																	}
																	onChange={(
																		e,
																	) =>
																		field.onChange(
																			e
																				.target
																				.value,
																		)
																	}
																	inputProps={{
																		"data-testid":
																			"loginPage-textField-phone",
																	}}
																	error={
																		!!errors.PHONE
																	}
																	helperText={
																		errors
																			.PHONE
																			?.message
																	}
																/>
															);
														}}
													/>
													<Controller
														name={"EXTENTION"}
														control={
															registerControl
														}
														rules={{
															required: false,
														}}
														render={({ field }) => {
															return (
																<TextField
																	label="Phone Extention"
																	size="small"
																	variant="outlined"
																	fullWidth
																	value={
																		field.value
																			? field.value
																			: ""
																	}
																	onChange={(
																		e,
																	) =>
																		field.onChange(
																			e
																				.target
																				.value,
																		)
																	}
																	inputProps={{
																		"data-testid":
																			"loginPage-textField-extension",
																	}}
																/>
															);
														}}
													/>
													<Controller
														name={"COUNTRY_CODE"}
														control={
															registerControl
														}
														rules={{
															required: false,
														}}
														render={({ field }) => {
															return (
																<TextField
																	label="Country Code"
																	size="small"
																	variant="outlined"
																	fullWidth
																	value={
																		field.value
																			? field.value
																			: ""
																	}
																	onChange={(
																		e,
																	) =>
																		field.onChange(
																			e
																				.target
																				.value,
																		)
																	}
																	inputProps={{
																		"data-testid":
																			"loginPage-textField-countryCode",
																	}}
																/>
															);
														}}
													/>
													<Controller
														name={"PASSWORD"}
														control={
															registerControl
														}
														rules={{
															required:
																"Password is required",
															validate: (
																value,
															) => {
																const rules =
																	regPasswordRules(
																		value,
																	);
																if (
																	!rules.length
																)
																	return "Minimum 8 characters";
																if (
																	!rules.upper
																)
																	return "At least one uppercase letter";
																if (
																	!rules.lower
																)
																	return "At least one lowercase letter";
																if (
																	!rules.special
																)
																	return "At least one special character";
																return true;
															},
														}}
														render={({ field }) => {
															return (
																<Tooltip
																	title={
																		passwordTooltipContent
																	}
																	placement="right"
																	arrow
																>
																	<TextField
																		label="Password *"
																		error={
																			!!errors.PASSWORD
																		}
																		helperText={
																			errors
																				.PASSWORD
																				?.message
																		}
																		size="small"
																		variant="outlined"
																		type="password"
																		fullWidth
																		value={
																			field.value
																				? field.value
																				: ""
																		}
																		onChange={(
																			e,
																		) =>
																			field.onChange(
																				e
																					.target
																					.value,
																			)
																		}
																		inputProps={{
																			"data-testid":
																				"loginPage-textField-passwordRegister",
																		}}
																	/>
																</Tooltip>
															);
														}}
													/>
													<Controller
														name={
															"PASSWORD_CONFIRMATION"
														}
														control={
															registerControl
														}
														rules={{
															required:
																"Please confirm your password",
															validate: (value) =>
																value ===
																	regPassword ||
																"Passwords do not match",
														}}
														render={({ field }) => {
															return (
																<TextField
																	label="Password Confirmation *"
																	size="small"
																	error={
																		!!errors.PASSWORD_CONFIRMATION
																	}
																	helperText={
																		errors
																			.PASSWORD_CONFIRMATION
																			?.message
																	}
																	variant="outlined"
																	type="password"
																	fullWidth
																	value={
																		field.value
																			? field.value
																			: ""
																	}
																	onChange={(
																		e,
																	) =>
																		field.onChange(
																			e
																				.target
																				.value,
																		)
																	}
																	inputProps={{
																		"data-testid":
																			"loginPage-textField-passwordConfirm",
																	}}
																/>
															);
														}}
													/>
													<StyledGoBackBox>
														<ButtonGroup.Item
															fullWidth
															variant={"text"}
															onClick={() =>
																setRegister(
																	false,
																)
															}
															data-testid={
																"loginPage-button-back"
															}
														>
															Go Back
														</ButtonGroup.Item>
														<ButtonGroup.Item
															fullWidth
															variant={
																"contained"
															}
															onClick={
																registerAccount
															}
															data-testid={
																"loginPage-button-register"
															}
														>
															Register
														</ButtonGroup.Item>
													</StyledGoBackBox>
												</>
											)}
											{!showOTPCodeField && !register && (
												<>
													<Controller
														name={"USERNAME"}
														control={control}
														rules={{
															required:
																"Username is required",
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
																	onChange={(
																		e,
																	) =>
																		field.onChange(
																			e
																				.target
																				.value,
																		)
																	}
																	inputProps={{
																		"data-testid":
																			"loginPage-textField-username",
																	}}
																	error={
																		!!formErrors.USERNAME
																	}
																	helperText={
																		formErrors
																			.USERNAME
																			?.message
																	}
																/>
															);
														}}
													/>
													<Controller
														name={"PASSWORD"}
														control={control}
														rules={{
															required:
																"Password is required",
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
																	onChange={(
																		e,
																	) =>
																		field.onChange(
																			e
																				.target
																				.value,
																		)
																	}
																	inputProps={{
																		"data-testid":
																			"loginPage-textField-password",
																	}}
																	error={
																		!!formErrors.PASSWORD
																	}
																	helperText={
																		formErrors
																			.PASSWORD
																			?.message
																	}
																/>
															);
														}}
													/>
												</>
											)}
											{showOTPCodeField && (
												<Controller
													name={"OTP_CONFIRM"}
													control={control}
													rules={{
														required: true,
													}}
													render={({ field }) => {
														return (
															<TextField
																label="OTP Confirmation Code"
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
																		"loginPage-textField-otpCode",
																}}
															/>
														);
													}}
												/>
											)}
											{!register && (
												<>
													<ButtonGroup.Item
														fullWidth
														variant={"contained"}
														onClick={login}
														type="submit"
														data-testid={
															"loginPage-button-login"
														}
													>
														Login
													</ButtonGroup.Item>
													{configStore.store.config
														.nativeRegistration && (
														<StyledRegisterNowBox>
															Don&apos;t have an
															account?{" "}
															<StyledButtonText
																variant="text"
																onClick={() => {
																	setRegister(
																		true,
																	);
																	setError(
																		"",
																	);
																}}
																data-testid={
																	"loginPage-button-registerPage"
																}
															>
																Register Now
															</StyledButtonText>
														</StyledRegisterNowBox>
													)}
												</>
											)}
										</>
									)}
									{!register && (
										<>
											{hasUsernamePassword &&
												hasOAuth && (
													<>
														<StyledDivider>
															<StyledDividerBox>
																or
															</StyledDividerBox>
														</StyledDivider>
													</>
												)}
											{configStore.store.config.availableProviders.map(
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
																oauth(
																	p.provider,
																);
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
										</>
									)}
								</Stack>
							</form>
						</StyledContent>
					</StyledScroll>
					<StyledGradient />
					<StyledImageHolder>
						<StyledImage src={GIF} />
					</StyledImageHolder>
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
					<ButtonGroup.Item
						variant={"outlined"}
						onClick={() => {
							setForgotPassword(false);
						}}
					>
						Ok
					</ButtonGroup.Item>
				</Modal.Actions>
			</Modal>
		</>
	);
});
