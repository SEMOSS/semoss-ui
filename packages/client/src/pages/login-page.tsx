import { Eye, EyeOff, Loader2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useId, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { type Location, Navigate, useLocation } from "react-router-dom";
import {
	Alert,
	AlertDescription,
	Button,
	cn,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Separator,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
	useTheme,
} from "@semoss/ui/next";
import { setupResetPassword } from "@/api/auth";
import loginDarkHero from "@/assets/img/login-dark-hero.gif";
import loginHero from "@/assets/img/login-gif.gif";
import { useRootStore, useThemeLogo } from "@/hooks";
import {
	getLoginProviderInitials,
	getLoginProviderKey,
	loadLoginProviderLogos,
} from "@/shared/constants/login-provider-icons.constants";

interface TypeUserLogin {
	USERNAME: string;
	PASSWORD: string;
	REMEMBER_LOGIN: boolean;
	OTP_CONFIRM: string;
}

interface TypeUserRegister {
	FIRST_NAME: string;
	LAST_NAME: string;
	USERNAME: string;
	EMAIL: string;
	PHONE: string;
	EXTENTION: string;
	COUNTRY_CODE: string;
	PASSWORD: string;
	PASSWORD_CONFIRMATION: string;
}

const LOGIN_PASSWORD_RESET_TYPES = ["native", "ldap", "linotp"] as const;
type LoginPasswordResetType = (typeof LOGIN_PASSWORD_RESET_TYPES)[number];
type LoginPasswordResetApiType = "NATIVE" | "LDAP" | "LINOTP";

export const LoginPage = observer(() => {
	const { configStore } = useRootStore();
	const { resolvedTheme } = useTheme();
	const themeLogo = useThemeLogo();
	const location = useLocation();
	const uid = useId();

	const [forgotPassword, setForgotPassword] = useState(false);
	const [loginType, setLoginType] = useState<
		"native" | "ldap" | "linotp" | ""
	>("");
	const [register, setRegister] = useState(false);
	const [showOTPCodeField, setShowOTPCodeField] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [resetPasswordEmail, setResetPasswordEmail] = useState("");
	const [resetPasswordError, setResetPasswordError] = useState("");
	const [resetPasswordSuccess, setResetPasswordSuccess] = useState("");
	const [isResetPasswordSubmitting, setIsResetPasswordSubmitting] =
		useState(false);
	const [oauthProviderLogos, setOauthProviderLogos] = useState<
		Record<string, string>
	>({});
	const [heroImage, setHeroImage] = useState<string>(loginHero);
	const isDarkMode = resolvedTheme === "dark";
	const activeHeroImage = isDarkMode ? loginDarkHero : heroImage;

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
		acc[val.provider] = val;
		return acc;
	}, {});

	const hasOAuth = configStore.store.config.availableProviders.some(
		(val) => val.isOauth,
	);

	const oauthProvidersSignature = useMemo(() => {
		return configStore.store.config.availableProviders
			.filter((provider) => provider.isOauth)
			.map((provider) => provider.provider.trim().toLowerCase())
			.join("|");
	}, [configStore.store.config.availableProviders]);

	const isNative = Object.hasOwn(availableProvidersMap, "native"),
		isLdap = Object.hasOwn(availableProvidersMap, "ldap"),
		isLinOTP = Object.hasOwn(availableProvidersMap, "linotp");

	const hasUsernamePassword = isNative || isLdap || isLinOTP;

	const hasMoreThanOneUserNamePassword =
		(isNative && isLdap) || (isNative && isLinOTP) || (isLdap && isLinOTP);
	const canRequestPasswordReset = LOGIN_PASSWORD_RESET_TYPES.includes(
		loginType as LoginPasswordResetType,
	);

	useEffect(() => {
		if (isNative) {
			setLoginType("native");
		} else if (isLdap) {
			setLoginType("ldap");
		} else if (isLinOTP) {
			setLoginType("linotp");
		}
	}, [isNative, isLdap, isLinOTP]);

	useEffect(() => {
		if (!oauthProvidersSignature) return;

		const providers = oauthProvidersSignature.split("|").filter(Boolean);

		if (providers.length === 0) return;

		let isMounted = true;

		const loadProviderLogos = async () => {
			const loadedLogos = await loadLoginProviderLogos(providers);

			if (!isMounted) return;

			setOauthProviderLogos((previous) => {
				let hasChanged = false;
				const next = { ...previous };

				for (const [provider, src] of Object.entries(loadedLogos)) {
					if (next[provider] === src) continue;

					next[provider] = src;
					hasChanged = true;
				}

				return hasChanged ? next : previous;
			});
		};

		void loadProviderLogos();

		return () => {
			isMounted = false;
		};
	}, [oauthProvidersSignature]);

	useEffect(() => {
		if (isDarkMode) return;

		const timeoutId = window.setTimeout(() => {
			import("@/assets/img/login-gif.gif")
				.then((module) => setHeroImage(module.default))
				.catch(() => undefined);
		}, 1200);

		return () => window.clearTimeout(timeoutId);
	}, [isDarkMode]);

	const login = handleSubmit(async (data: TypeUserLogin): Promise<void> => {
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
					.catch((err) => {
						setError(err.message);
					})
					.finally(() => {
						setIsLoading(false);
					});
			}
			if (loginType === "ldap") {
				await configStore
					.loginLDAP(data.USERNAME, data.PASSWORD)
					.catch((err) => {
						setError(err.message);
					})
					.finally(() => {
						setIsLoading(false);
					});
			}
			if (loginType === "linotp") {
				await configStore
					.loginOTP(data.USERNAME, data.PASSWORD)
					.then(() => {
						setShowOTPCodeField(true);
					})
					.catch((err) => {
						setError(err.message);
					})
					.finally(() => {
						setIsLoading(false);
					});
			}
		}
		if (showOTPCodeField) {
			await configStore
				.confirmOTP(data.OTP_CONFIRM)
				.catch((err) => {
					setError(err.message);
				})
				.finally(() => {
					setIsLoading(false);
				});
			setShowOTPCodeField(true);
		}
	});

	const registerAccount = registerSubmit(
		async (data: TypeUserRegister): Promise<void> => {
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
				.catch((err) => {
					setIsLoading(false);
					setError(err.message);
				})
				.finally(() => {
					setIsLoading(false);
				});
		},
	);

	const oauth = async (provider: string) => {
		setIsLoading(true);

		await configStore
			.oauth(provider)
			.then(() => {
				setIsLoading(false);
				toast.success("Successfully logged in");
			})
			.catch((err) => {
				setIsLoading(false);
				setError(err.message);
				toast.error(err.message);
			});
	};

	const openForgotPasswordDialog = () => {
		setResetPasswordEmail("");
		setResetPasswordError("");
		setResetPasswordSuccess("");
		setForgotPassword(true);
	};

	const closeForgotPasswordDialog = () => {
		setForgotPassword(false);
		setResetPasswordEmail("");
		setResetPasswordError("");
		setResetPasswordSuccess("");
		setIsResetPasswordSubmitting(false);
	};

	const submitForgotPassword = async () => {
		const email = resetPasswordEmail.trim();
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		if (!email) {
			setResetPasswordError("Email is required.");
			return;
		}

		if (!emailRegex.test(email)) {
			setResetPasswordError("Please enter a valid email address.");
			return;
		}

		if (!canRequestPasswordReset) {
			setResetPasswordError(
				"Password reset is only available for Native, LDAP, and LinOTP logins.",
			);
			return;
		}

		const selectedLoginType =
			loginType.toUpperCase() as LoginPasswordResetApiType;
		const subjectPrefix = configStore.theme.name?.trim() || "SEMOSS";
		const subject = `${subjectPrefix} Reset Password Request`;

		setIsResetPasswordSubmitting(true);
		setResetPasswordError("");
		setResetPasswordSuccess("");

		try {
			const response = await setupResetPassword(
				email,
				selectedLoginType,
				subject,
			);
			const message =
				response.message || `Email has been sent to: ${email}`;

			setResetPasswordSuccess(message);
			toast.success(message);
		} catch (submissionError) {
			const message =
				submissionError instanceof Error
					? submissionError.message
					: "Unable to submit password reset request.";

			setResetPasswordError(message);
			toast.error(message);
		} finally {
			setIsResetPasswordSubmitting(false);
		}
	};

	const path = (location.state as { from: Location })?.from?.pathname || "/";

	if (configStore.store.status === "SUCCESS") {
		return <Navigate to={path} replace />;
	}

	return (
		<>
			<style>{`
				@media (min-width: 1024px) {
					.login-grid {
						grid-template-columns: 1fr clamp(512px, calc(100vw - 512px), 60vw);
					}
				}

				.dark .login-grid {
					background: linear-gradient(48deg, rgba(32, 39, 54, 0.50) 7.37%, rgba(30, 41, 75, 0.49) 39.18%, rgba(120, 133, 213, 0.00) 84.89%);
				}

				@keyframes loginFeaturePillFadeUp {
					from {
						opacity: 0;
						transform: translateY(10px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}

				@keyframes loginCardShimmer {
					from {
						transform: translateX(-180%);
					}
					to {
						transform: translateX(260%);
					}
				}
			`}</style>
			<div className="login-grid relative grid min-h-screen w-full bg-white">
				<div className="relative flex min-h-screen w-full flex-col overflow-hidden">
					<div className="relative z-10 flex w-full flex-1 items-center justify-center overflow-y-auto px-6 pt-4 pb-4 md:px-10 md:pt-8 md:pb-6">
						<div className="relative w-full max-w-[520px] overflow-hidden rounded-2xl p-6 md:p-8 dark:bg-background/95 dark:shadow-sm">
							<div className="mb-6">
								<div className="mb-2 flex flex-row items-center gap-2">
									{themeLogo ? (
										<img
											src={themeLogo}
											alt={
												configStore.theme.name || "logo"
											}
										/>
									) : null}
									<span className="font-bold text-xl">
										{configStore.theme.name}
									</span>
								</div>
								<h4 className="mb-2 min-h-[2.2rem] scroll-m-20 font-semibold text-2xl tracking-tight md:min-h-[2.6rem] md:text-3xl">
									{register
										? "Create your account"
										: "Welcome back"}
								</h4>
								<p className="min-h-[1.25rem] text-black text-sm md:text-base dark:text-muted-foreground">
									{register
										? "Register to access your workspace."
										: "Sign in to continue to your workspace."}
								</p>
							</div>

							{error && (
								<Alert variant="destructive">
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}

							{success && (
								<div className="rounded-lg border border-green-500 bg-green-50 px-4 py-3 text-green-700 text-sm dark:bg-green-950/30 dark:text-green-400">
									{success}
								</div>
							)}

							<form>
								<div className="flex flex-col gap-4 [&_input]:border-[#9ea5af] [&_input]:bg-white [&_input]:shadow-none [&_input]:focus-visible:border-[#0176d3] [&_input]:focus-visible:ring-[#0176d3]/35 dark:[&_input]:border-input dark:[&_input]:bg-background dark:[&_input]:focus-visible:border-primary dark:[&_input]:focus-visible:ring-primary/30 [&_label]:font-medium [&_label]:text-black dark:[&_label]:text-muted-foreground">
									{!register && hasOAuth && (
										<>
											{configStore.store.config.availableProviders.map(
												(p) => {
													if (!p.isOauth) return null;

													const providerKey =
														getLoginProviderKey(
															p.provider,
														);
													const providerLogo =
														oauthProviderLogos[
															providerKey
														];
													const providerInitials =
														getLoginProviderInitials(
															p.name ||
																p.provider,
														);

													return (
														<Button
															key={p.provider}
															type="button"
															variant="outline"
															className="w-full gap-2"
															onClick={() =>
																oauth(
																	p.provider,
																)
															}
														>
															{providerLogo ? (
																<img
																	src={
																		providerLogo
																	}
																	alt=""
																	aria-hidden="true"
																	className="h-4 w-4 shrink-0 object-contain"
																	loading="lazy"
																	decoding="async"
																/>
															) : (
																<span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-border/70 bg-muted/60 font-semibold text-[9px] text-muted-foreground">
																	{
																		providerInitials
																	}
																</span>
															)}
															{p.name}
														</Button>
													);
												},
											)}
											{hasUsernamePassword && (
												<div className="flex items-center gap-4 py-1">
													<Separator className="flex-1" />
													<span className="font-medium text-black text-sm dark:text-muted-foreground">
														or
													</span>
													<Separator className="flex-1" />
												</div>
											)}
										</>
									)}

									{hasUsernamePassword && (
										<>
											{!register &&
												hasMoreThanOneUserNamePassword && (
													<div className="flex overflow-hidden rounded-md border border-input">
														{isNative && (
															<button
																type="button"
																onClick={() => {
																	setLoginType(
																		"native",
																	);
																	setSuccess(
																		"",
																	);
																	setError(
																		"",
																	);
																}}
																className={cn(
																	"flex-1 px-4 py-2 font-medium text-sm transition-colors",
																	loginType ===
																		"native"
																		? "bg-primary text-primary-foreground"
																		: "bg-background text-primary hover:bg-muted",
																)}
																data-testid="loginPage-button-native"
															>
																Native
															</button>
														)}
														{isLdap && (
															<button
																type="button"
																onClick={() => {
																	setLoginType(
																		"ldap",
																	);
																	setSuccess(
																		"",
																	);
																	setError(
																		"",
																	);
																}}
																className={cn(
																	"flex-1 px-4 py-2 font-medium text-sm transition-colors",
																	loginType ===
																		"ldap"
																		? "bg-primary text-primary-foreground"
																		: "bg-background text-primary hover:bg-muted",
																)}
																data-testid="loginPage-button-ldap"
															>
																LDAP
															</button>
														)}
														{isLinOTP && (
															<button
																type="button"
																onClick={() => {
																	setLoginType(
																		"linotp",
																	);
																	setSuccess(
																		"",
																	);
																	setError(
																		"",
																	);
																}}
																className={cn(
																	"flex-1 px-4 py-2 font-medium text-sm transition-colors",
																	loginType ===
																		"linotp"
																		? "bg-primary text-primary-foreground"
																		: "bg-background text-primary hover:bg-muted",
																)}
																data-testid="loginPage-button-linotp"
															>
																LinOTP
															</button>
														)}
													</div>
												)}

											{!showOTPCodeField && register && (
												<>
													<div className="flex gap-3">
														<Controller
															name="FIRST_NAME"
															control={
																registerControl
															}
															rules={{
																required:
																	"First name is required",
															}}
															render={({
																field,
															}) => (
																<div className="flex flex-1 flex-col gap-1.5">
																	<Label
																		htmlFor={`${uid}-reg-firstName`}
																	>
																		First
																		Name *
																	</Label>
																	<Input
																		id={`${uid}-reg-firstName`}
																		value={
																			field.value ||
																			""
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
																		data-testid="loginPage-textField-firstNameRegister"
																		aria-invalid={
																			!!errors.FIRST_NAME
																		}
																	/>
																	{errors.FIRST_NAME && (
																		<p className="text-destructive text-sm">
																			{
																				errors
																					.FIRST_NAME
																					.message
																			}
																		</p>
																	)}
																</div>
															)}
														/>
														<Controller
															name="LAST_NAME"
															control={
																registerControl
															}
															rules={{
																required:
																	"Last name is required",
															}}
															render={({
																field,
															}) => (
																<div className="flex flex-1 flex-col gap-1.5">
																	<Label
																		htmlFor={`${uid}-reg-lastName`}
																	>
																		Last
																		Name *
																	</Label>
																	<Input
																		id={`${uid}-reg-lastName`}
																		value={
																			field.value ||
																			""
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
																		data-testid="loginPage-textField-lastNameRegister"
																		aria-invalid={
																			!!errors.LAST_NAME
																		}
																	/>
																	{errors.LAST_NAME && (
																		<p className="text-destructive text-sm">
																			{
																				errors
																					.LAST_NAME
																					.message
																			}
																		</p>
																	)}
																</div>
															)}
														/>
													</div>
													<div className="flex gap-3">
														<Controller
															name="USERNAME"
															control={
																registerControl
															}
															rules={{
																required:
																	"Username is required",
															}}
															render={({
																field,
															}) => (
																<div className="flex flex-1 flex-col gap-1.5">
																	<Label
																		htmlFor={`${uid}-reg-username`}
																	>
																		Username
																		*
																	</Label>
																	<Input
																		id={`${uid}-reg-username`}
																		value={
																			field.value ||
																			""
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
																		data-testid="loginPage-textField-usernameRegister"
																		aria-invalid={
																			!!errors.USERNAME
																		}
																	/>
																	{errors.USERNAME && (
																		<p className="text-destructive text-sm">
																			{
																				errors
																					.USERNAME
																					.message
																			}
																		</p>
																	)}
																</div>
															)}
														/>
														<Controller
															name="EMAIL"
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
															render={({
																field,
															}) => (
																<div className="flex flex-1 flex-col gap-1.5">
																	<Label
																		htmlFor={`${uid}-reg-email`}
																	>
																		Email *
																	</Label>
																	<Input
																		id={`${uid}-reg-email`}
																		value={
																			field.value ||
																			""
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
																		data-testid="loginPage-textField-emailRegister"
																		aria-invalid={
																			!!errors.EMAIL
																		}
																	/>
																	{errors.EMAIL && (
																		<p className="text-destructive text-sm">
																			{
																				errors
																					.EMAIL
																					.message
																			}
																		</p>
																	)}
																</div>
															)}
														/>
													</div>
													<div className="flex gap-3">
														<Controller
															name="PHONE"
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
															render={({
																field,
															}) => (
																<div className="flex flex-1 flex-col gap-1.5">
																	<Label
																		htmlFor={`${uid}-reg-phone`}
																	>
																		Phone
																		Number
																	</Label>
																	<Input
																		id={`${uid}-reg-phone`}
																		value={
																			field.value ||
																			""
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
																		data-testid="loginPage-textField-phone"
																		aria-invalid={
																			!!errors.PHONE
																		}
																	/>
																	{errors.PHONE && (
																		<p className="text-destructive text-sm">
																			{
																				errors
																					.PHONE
																					.message
																			}
																		</p>
																	)}
																</div>
															)}
														/>
														<Controller
															name="EXTENTION"
															control={
																registerControl
															}
															render={({
																field,
															}) => (
																<div className="flex flex-1 flex-col gap-1.5">
																	<Label
																		htmlFor={`${uid}-reg-extension`}
																	>
																		Phone
																		Extension
																	</Label>
																	<Input
																		id={`${uid}-reg-extension`}
																		value={
																			field.value ||
																			""
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
																		data-testid="loginPage-textField-extension"
																	/>
																</div>
															)}
														/>
														<Controller
															name="COUNTRY_CODE"
															control={
																registerControl
															}
															render={({
																field,
															}) => (
																<div className="flex flex-1 flex-col gap-1.5">
																	<Label
																		htmlFor={`${uid}-reg-countryCode`}
																	>
																		Country
																		Code
																	</Label>
																	<Input
																		id={`${uid}-reg-countryCode`}
																		value={
																			field.value ||
																			""
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
																		data-testid="loginPage-textField-countryCode"
																	/>
																</div>
															)}
														/>
													</div>
													<Controller
														name="PASSWORD"
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
														render={({ field }) => (
															<div className="flex flex-col gap-1.5">
																<Label
																	htmlFor={`${uid}-reg-password`}
																>
																	Password *
																</Label>
																<Tooltip>
																	<TooltipTrigger
																		asChild
																	>
																		<Input
																			id={`${uid}-reg-password`}
																			type="password"
																			value={
																				field.value ||
																				""
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
																			data-testid="loginPage-textField-passwordRegister"
																			aria-invalid={
																				!!errors.PASSWORD
																			}
																		/>
																	</TooltipTrigger>
																	<TooltipContent
																		side="right"
																		className="flex flex-col gap-0.5"
																	>
																		<p>
																			• At
																			least
																			8
																			characters
																		</p>
																		<p>
																			•
																			One
																			uppercase
																			letter
																		</p>
																		<p>
																			•
																			One
																			lowercase
																			letter
																		</p>
																		<p>
																			•
																			One
																			special
																			character
																			[!,
																			@,
																			#,
																			$,
																			%,
																			^,
																			&,
																			*]
																		</p>
																	</TooltipContent>
																</Tooltip>
																{errors.PASSWORD && (
																	<p className="text-destructive text-sm">
																		{
																			errors
																				.PASSWORD
																				.message
																		}
																	</p>
																)}
															</div>
														)}
													/>
													<Controller
														name="PASSWORD_CONFIRMATION"
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
														render={({ field }) => (
															<div className="flex flex-col gap-1.5">
																<Label
																	htmlFor={`${uid}-reg-passwordConfirm`}
																>
																	Password
																	Confirmation
																	*
																</Label>
																<Input
																	id={`${uid}-reg-passwordConfirm`}
																	type="password"
																	value={
																		field.value ||
																		""
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
																	data-testid="loginPage-textField-passwordConfirm"
																	aria-invalid={
																		!!errors.PASSWORD_CONFIRMATION
																	}
																/>
																{errors.PASSWORD_CONFIRMATION && (
																	<p className="text-destructive text-sm">
																		{
																			errors
																				.PASSWORD_CONFIRMATION
																				.message
																		}
																	</p>
																)}
															</div>
														)}
													/>
													<div className="flex flex-col gap-2">
														<Button
															type="button"
															className="w-full"
															onClick={
																registerAccount
															}
															data-testid="loginPage-button-register"
														>
															Register
														</Button>
														<div className="flex items-center justify-center gap-1 text-sm">
															Already have an
															account?{" "}
															<Button
																type="button"
																variant="link"
																className="h-auto p-0"
																onClick={() => {
																	setRegister(
																		false,
																	);
																	setError(
																		"",
																	);
																}}
																data-testid="loginPage-button-back"
															>
																Login Now
															</Button>
														</div>
													</div>
												</>
											)}

											{!showOTPCodeField && !register && (
												<>
													<Controller
														name="USERNAME"
														control={control}
														rules={{
															required:
																"Username is required",
														}}
														render={({ field }) => (
															<div className="flex flex-col gap-1.5">
																<Label
																	htmlFor={`${uid}-login-username`}
																>
																	Username
																</Label>
																<Input
																	id={`${uid}-login-username`}
																	value={
																		field.value ||
																		""
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
																	data-testid="loginPage-textField-username"
																	aria-invalid={
																		!!formErrors.USERNAME
																	}
																/>
																{formErrors.USERNAME && (
																	<p className="text-destructive text-sm">
																		{
																			formErrors
																				.USERNAME
																				.message
																		}
																	</p>
																)}
															</div>
														)}
													/>
													<Controller
														name="PASSWORD"
														control={control}
														rules={{
															required:
																"Password is required",
														}}
														render={({ field }) => (
															<div className="flex flex-col gap-1.5">
																<Label
																	htmlFor={`${uid}-login-password`}
																>
																	Password
																</Label>
																<div className="relative">
																	<Input
																		id={`${uid}-login-password`}
																		type={
																			showPassword
																				? "text"
																				: "password"
																		}
																		value={
																			field.value ||
																			""
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
																		data-testid="loginPage-textField-password"
																		aria-invalid={
																			!!formErrors.PASSWORD
																		}
																		className="pr-10"
																	/>
																	<Button
																		type="button"
																		variant="ghost"
																		size="icon-sm"
																		className="-translate-y-1/2 absolute top-1/2 right-1 h-8 w-8 text-muted-foreground hover:text-foreground"
																		onClick={() =>
																			setShowPassword(
																				(
																					prev,
																				) =>
																					!prev,
																			)
																		}
																		aria-label={
																			showPassword
																				? "Hide password"
																				: "Show password"
																		}
																	>
																		{showPassword ? (
																			<EyeOff className="h-4 w-4" />
																		) : (
																			<Eye className="h-4 w-4" />
																		)}
																	</Button>
																</div>
																{formErrors.PASSWORD && (
																	<p className="text-destructive text-sm">
																		{
																			formErrors
																				.PASSWORD
																				.message
																		}
																	</p>
																)}
															</div>
														)}
													/>
													{canRequestPasswordReset && (
														<div className="flex justify-end">
															<Button
																type="button"
																variant="link"
																className="h-auto px-0 py-0 text-sm"
																onClick={
																	openForgotPasswordDialog
																}
															>
																Forgot password?
															</Button>
														</div>
													)}
												</>
											)}

											{showOTPCodeField && (
												<Controller
													name="OTP_CONFIRM"
													control={control}
													rules={{ required: true }}
													render={({ field }) => (
														<div className="flex flex-col gap-1.5">
															<Label
																htmlFor={`${uid}-login-otp`}
															>
																OTP Confirmation
																Code
															</Label>
															<Input
																id={`${uid}-login-otp`}
																value={
																	field.value ||
																	""
																}
																onChange={(e) =>
																	field.onChange(
																		e.target
																			.value,
																	)
																}
																data-testid="loginPage-textField-otpCode"
															/>
														</div>
													)}
												/>
											)}

											{!register && (
												<>
													<Button
														type="button"
														className="w-full"
														onClick={login}
														data-testid="loginPage-button-login"
													>
														{isLoading ? (
															<span className="flex items-center gap-2">
																<Loader2 className="h-4 w-4 animate-spin" />
																Logging in...
															</span>
														) : (
															"Login"
														)}
													</Button>
													{configStore.store.config
														.nativeRegistration && (
														<div className="flex items-center justify-center gap-1 text-sm">
															Don&apos;t have an
															account?{" "}
															<Button
																type="button"
																variant="link"
																className="h-auto p-0"
																onClick={() => {
																	setRegister(
																		true,
																	);
																	setError(
																		"",
																	);
																}}
																data-testid="loginPage-button-registerPage"
															>
																Register Now
															</Button>
														</div>
													)}
												</>
											)}
										</>
									)}
								</div>
							</form>
							{isLoading && (
								<div
									aria-hidden
									className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
								>
									<div className="absolute inset-0 bg-white/35 dark:bg-background/25" />
									<div
										className="-left-1/3 -skew-x-12 absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/80 to-transparent"
										style={{
											animation:
												"loginCardShimmer 1200ms ease-out infinite",
										}}
									/>
								</div>
							)}
						</div>
					</div>
				</div>
				<aside className="relative hidden overflow-hidden lg:block">
					<img
						src={activeHeroImage}
						alt=""
						className="absolute inset-0 h-full w-full object-cover"
						loading="lazy"
						decoding="async"
					/>
					<div
						aria-hidden
						className="pointer-events-none absolute inset-y-0 left-0 z-10 w-96 bg-gradient-to-r from-white to-transparent dark:from-background"
					/>
				</aside>
			</div>

			<Dialog
				open={forgotPassword}
				onOpenChange={(isOpen) => {
					if (!isOpen) {
						closeForgotPasswordDialog();
						return;
					}

					setForgotPassword(true);
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Forgot your password?</DialogTitle>
					</DialogHeader>
					<div className="flex flex-col gap-3">
						<p className="text-muted-foreground text-sm">
							Enter the email associated with your{" "}
							{loginType.toUpperCase()} login.
						</p>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor={`${uid}-forgot-password-email`}>
								Email
							</Label>
							<Input
								id={`${uid}-forgot-password-email`}
								type="email"
								value={resetPasswordEmail}
								onChange={(event) =>
									setResetPasswordEmail(event.target.value)
								}
								placeholder="name@company.com"
								autoFocus
							/>
						</div>
						{resetPasswordError ? (
							<Alert variant="destructive">
								<AlertDescription>
									{resetPasswordError}
								</AlertDescription>
							</Alert>
						) : null}
						{resetPasswordSuccess ? (
							<div className="rounded-md border border-green-500 bg-green-50 px-3 py-2 text-green-700 text-sm dark:bg-green-950/30 dark:text-green-400">
								{resetPasswordSuccess}
							</div>
						) : null}
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={closeForgotPasswordDialog}
						>
							Cancel
						</Button>
						<Button
							onClick={submitForgotPassword}
							disabled={isResetPasswordSubmitting}
						>
							{isResetPasswordSubmitting ? (
								<span className="flex items-center gap-2">
									<Loader2 className="h-4 w-4 animate-spin" />
									Sending...
								</span>
							) : (
								"Send reset link"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
});
