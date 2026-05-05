import { observer } from "mobx-react-lite";
import { useEffect, useId, useState } from "react";
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
import LOGIN_DARK_HERO from "@/assets/img/login-dark.gif";
import LOGIN_HERO from "@/assets/img/login-hero.jpeg";
import { useRootStore, useThemeLogo } from "@/hooks";

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
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [lightLoginHeroImage, setLightLoginHeroImage] = useState(LOGIN_HERO);

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
		acc[val.provider] = acc;
		return acc;
	}, {});

	const hasOAuth = configStore.store.config.availableProviders.some(
		(val) => val.isOauth,
	);

	const isNative = Object.hasOwn(availableProvidersMap, "native"),
		isLdap = Object.hasOwn(availableProvidersMap, "ldap"),
		isLinOTP = Object.hasOwn(availableProvidersMap, "linotp");

	const hasUsernamePassword = isNative || isLdap || isLinOTP;

	const hasMoreThanOneUserNamePassword =
		(isNative && isLdap) || (isNative && isLinOTP) || (isLdap && isLinOTP);

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
		if (resolvedTheme === "dark") {
			return;
		}

		const timeoutId = window.setTimeout(() => {
			import("@/assets/img/login-gif.gif")
				.then((module) => {
					setLightLoginHeroImage(module.default);
				})
				.catch(() => undefined);
		}, 1200);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [resolvedTheme]);

	const login = handleSubmit(
		async (data: TypeUserLogin): Promise<TypeUserLogin> => {
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
		},
	);

	const registerAccount = registerSubmit(
		async (data: TypeUserRegister): Promise<TypeUserRegister> => {
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

	const path = (location.state as { from: Location })?.from?.pathname || "/";

	if (configStore.store.status === "SUCCESS") {
		return <Navigate to={path} replace />;
	}

	return (
		<>
			<div className="semoss-login-page flex h-screen w-screen flex-col bg-background">
				<div className="relative flex w-full flex-1 flex-row overflow-hidden">
					<div className="relative z-10 flex w-[46vw] shrink-0 flex-col items-start overflow-y-auto overflow-x-hidden bg-background max-md:h-full max-md:w-full max-md:items-center max-xl:bg-transparent dark:bg-transparent">
						<div className="mt-[30vh] mb-4 ml-[10vw] flex w-[410px] flex-col gap-5 max-md:m-0 max-md:w-full max-md:max-w-[410px] max-md:p-8">
							<div>
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
								<h4 className="mb-2 scroll-m-20 font-semibold text-3xl tracking-tight">
									Welcome!
								</h4>
								<p className="mb-4 text-xs">
									{register
										? "Register below"
										: "Log in below"}
								</p>
							</div>

							{!register && hasMoreThanOneUserNamePassword && (
								<div className="flex overflow-hidden rounded-md border border-input">
									{isNative && (
										<button
											type="button"
											onClick={() => {
												setLoginType("native");
												setSuccess("");
												setError("");
											}}
											className={cn(
												"flex-1 px-4 py-2 font-medium text-sm transition-colors",
												loginType === "native"
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
												setLoginType("ldap");
												setSuccess("");
												setError("");
											}}
											className={cn(
												"flex-1 px-4 py-2 font-medium text-sm transition-colors",
												loginType === "ldap"
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
												setLoginType("linotp");
												setSuccess("");
												setError("");
											}}
											className={cn(
												"flex-1 px-4 py-2 font-medium text-sm transition-colors",
												loginType === "linotp"
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

							<form className="semoss-login-form">
								<div className="flex flex-col gap-4">
									{hasUsernamePassword && (
										<>
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
													<div className="flex justify-between gap-2">
														<Button
															type="button"
															variant="ghost"
															className="flex-1"
															onClick={() =>
																setRegister(
																	false,
																)
															}
															data-testid="loginPage-button-back"
														>
															Go Back
														</Button>
														<Button
															type="button"
															className="flex-1"
															onClick={
																registerAccount
															}
															data-testid="loginPage-button-register"
														>
															Register
														</Button>
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
																<Input
																	id={`${uid}-login-password`}
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
																	data-testid="loginPage-textField-password"
																	aria-invalid={
																		!!formErrors.PASSWORD
																	}
																/>
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
														Login
													</Button>
													{configStore.store.config
														.nativeRegistration && (
														<div className="flex items-center justify-center gap-1">
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

									{!register && (
										<>
											{hasUsernamePassword &&
												hasOAuth && (
													<div className="flex items-center gap-4">
														<Separator className="flex-1" />
														<span className="font-bold text-base">
															or
														</span>
														<Separator className="flex-1" />
													</div>
												)}
											{configStore.store.config.availableProviders.map(
												(p) => {
													if (!p.isOauth) return null;
													return (
														<Button
															key={p.provider}
															type="button"
															variant="outline"
															className="w-full"
															onClick={() =>
																oauth(
																	p.provider,
																)
															}
														>
															{p.name}
														</Button>
													);
												},
											)}
										</>
									)}
								</div>
							</form>
						</div>
					</div>
					<div className="z-10 h-full w-0 shrink-0 bg-gradient-to-r from-background to-transparent dark:hidden" />
					<div className="absolute inset-y-0 right-0 left-[46vw] z-0 overflow-hidden bg-background max-sm:hidden max-xl:inset-0 max-xl:bg-transparent dark:bg-transparent">
						<img
							src={lightLoginHeroImage}
							alt=""
							className="h-full w-full object-cover object-right dark:hidden"
							loading="lazy"
							decoding="async"
						/>
						<img
							src={LOGIN_DARK_HERO}
							alt=""
							className="hidden h-full w-full object-contain object-right mix-blend-lighten dark:block"
							loading="lazy"
							decoding="async"
						/>
					</div>
				</div>
				{isLoading && (
					<div className="h-1 w-full overflow-hidden bg-primary/20">
						<div className="h-full animate-pulse bg-primary" />
					</div>
				)}
			</div>

			<Dialog open={forgotPassword} onOpenChange={setForgotPassword}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Forgot your password?</DialogTitle>
					</DialogHeader>
					<p>Please contact your administrator to reset password.</p>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setForgotPassword(false)}
						>
							Ok
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
});
