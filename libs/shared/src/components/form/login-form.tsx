import { useEffect, useId, useMemo, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Field,
	FieldGroup,
	FieldLabel,
	FieldSeparator,
	Input,
	Spinner,
	Tabs,
	TabsList,
	TabsTrigger,
	toast,
} from "@semoss/ui/next";
import { LoginProviderIcon } from "../login-provider-icon";

/**
 * Username / password providers, in the order they are offered to the user.
 * Anything else the backend reports as a non oauth provider is ignored because
 * it needs its own flow.
 */
const CREDENTIAL_PROVIDERS = [
	{ provider: "native", label: "Native" },
	{ provider: "ldap", label: "Active Directory" },
	{ provider: "linotp", label: "LinOTP" },
] as const;

type CredentialProvider = (typeof CREDENTIAL_PROVIDERS)[number]["provider"];

/** Shown when the backend rejects the login without an error message */
const UNABLE_TO_LOGIN =
	"Unable to login. Check your credentials and try again.";

export function LoginForm() {
	const usernameId = useId();
	const passwordId = useId();
	const otpId = useId();

	const { system, actions } = useInsight();

	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [otp, setOtp] = useState("");

	// linotp verifies the pin first and then challenges for the otp
	const [showOTPField, setShowOTPField] = useState(false);

	const [error, setError] = useState("");
	const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
	const isLoading = loadingProvider !== null;

	const availableProviders = system.config.availableProviders;

	// the username / password providers the backend has turned on
	const credentialProviders = useMemo(() => {
		const enabled = new Set(
			availableProviders
				.filter((val) => !val.isOauth)
				.map((val) => val.provider),
		);

		return CREDENTIAL_PROVIDERS.filter((val) =>
			enabled.has(val.provider),
		).map((val) => ({
			provider: val.provider,
			// respect <provider>_display_name when the backend sends one
			label:
				availableProviders.find((p) => p.provider === val.provider)
					?.name || val.label,
		}));
	}, [availableProviders]);

	const hasOAuth = availableProviders.some((val) => val.isOauth);
	const hasCredentials = credentialProviders.length > 0;

	const [loginType, setLoginType] = useState<CredentialProvider | "">(
		() => credentialProviders[0]?.provider ?? "",
	);

	// default to the first available credential provider
	useEffect(() => {
		setLoginType((previous) => {
			if (
				previous &&
				credentialProviders.some((val) => val.provider === previous)
			) {
				return previous;
			}

			return credentialProviders.length > 0
				? credentialProviders[0].provider
				: "";
		});
	}, [credentialProviders]);

	/**
	 * Submit the username / password form for the selected provider
	 */
	const submitCredentials = async () => {
		if (!loginType) {
			return;
		}

		if (showOTPField) {
			if (!otp) {
				setError("OTP is Required");
				return;
			}
		} else if (!username || !password) {
			setError("Username and Password is Required");
			return;
		}

		setError("");
		setLoadingProvider(loginType);

		try {
			if (loginType === "linotp") {
				// step one, verify the pin and trigger the otp challenge
				if (!showOTPField) {
					if (await actions.requestOTP(username, password)) {
						setShowOTPField(true);
					} else {
						setError(UNABLE_TO_LOGIN);
					}

					return;
				}

				// step two, confirm the otp to create the session
				if (!(await actions.login({ type: "linotp", otp: otp }))) {
					setError(UNABLE_TO_LOGIN);
				}

				return;
			}

			const loggedIn =
				loginType === "ldap"
					? await actions.login({
							type: "ldap",
							username: username,
							password: password,
						})
					: await actions.login({
							type: "native",
							username: username,
							password: password,
						});

			if (!loggedIn) {
				setError(UNABLE_TO_LOGIN);
			}
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setLoadingProvider(null);
		}
	};

	return (
		<form
			className="flex flex-col gap-6"
			onSubmit={(e) => {
				e.preventDefault();
				void submitCredentials();
			}}
		>
			<FieldGroup>
				<div className="flex flex-col items-center gap-1 text-center">
					<h1 className="font-bold text-2xl">Sign In</h1>
					<p className="text-balance text-muted-foreground text-sm">
						Log in to unlock your access
					</p>
				</div>
				{hasCredentials && (
					<>
						{credentialProviders.length > 1 && !showOTPField && (
							<Tabs
								value={loginType}
								onValueChange={(value) => {
									setLoginType(value as CredentialProvider);
									setError("");
								}}
							>
								<TabsList className="w-full">
									{credentialProviders.map((p) => (
										<TabsTrigger
											key={p.provider}
											value={p.provider}
											disabled={isLoading}
											data-testid={`loginForm-tab-${p.provider}`}
										>
											{p.label}
										</TabsTrigger>
									))}
								</TabsList>
							</Tabs>
						)}
						{showOTPField ? (
							<Field>
								<FieldLabel htmlFor={otpId}>
									OTP Confirmation Code
								</FieldLabel>
								<Input
									id={otpId}
									type="text"
									placeholder="OTP Confirmation Code"
									value={otp}
									onChange={(e) => setOtp(e.target.value)}
									disabled={isLoading}
									data-testid="loginForm-input-otp"
									required
								/>
							</Field>
						) : (
							<>
								<Field>
									<FieldLabel htmlFor={usernameId}>
										Username
									</FieldLabel>
									<Input
										id={usernameId}
										type="text"
										placeholder="Username"
										value={username}
										onChange={(e) =>
											setUsername(e.target.value)
										}
										disabled={isLoading}
										data-testid="loginForm-input-username"
										required
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor={passwordId}>
										{loginType === "linotp"
											? "Pin"
											: "Password"}
									</FieldLabel>
									<Input
										id={passwordId}
										value={password}
										placeholder={
											loginType === "linotp"
												? "Pin"
												: "Password"
										}
										onChange={(e) =>
											setPassword(e.target.value)
										}
										type="password"
										disabled={isLoading}
										data-testid="loginForm-input-password"
										required
									/>
								</Field>
							</>
						)}
						<Field>
							<Button
								type="submit"
								disabled={isLoading}
								data-testid="loginForm-button-login"
							>
								{loadingProvider === loginType && (
									<Spinner className="size-4" />
								)}
								{showOTPField ? "Confirm" : "Login"}
							</Button>
						</Field>
					</>
				)}
				{hasCredentials && hasOAuth && !showOTPField && (
					<FieldSeparator>or</FieldSeparator>
				)}

				{!showOTPField &&
					availableProviders.map((p) => {
						// skip ones that aren't oauth
						if (!p.isOauth) {
							return null;
						}

						return (
							<Field key={p.provider}>
								<Button
									key={p.provider}
									type="button"
									variant="outline"
									disabled={isLoading}
									onClick={async () => {
										setLoadingProvider(p.provider);

										await actions
											.login({
												type: "oauth",
												provider: p.provider,
											})
											.then(() => {
												setLoadingProvider(null);

												toast.success(
													`Successfully logged in`,
												);
											})
											.catch((e) => {
												setLoadingProvider(null);

												setError(e.message);

												toast.error(e.message);
											});
									}}
									className="w-full gap-2"
								>
									{loadingProvider === p.provider ? (
										<Spinner className="size-4" />
									) : (
										<LoginProviderIcon
											provider={p.provider}
											className="h-4 w-4 shrink-0 object-contain"
										/>
									)}
									{p.name}
								</Button>
							</Field>
						);
					})}
			</FieldGroup>
			{error && (
				<Alert variant="destructive">
					<AlertTitle>Error</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
		</form>
	);
}
