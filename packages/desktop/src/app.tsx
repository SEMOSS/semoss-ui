import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, Button, Spinner } from "@semoss/ui/next";
import {
	fetchInstanceConfig,
	loginWithPassword,
	readInstanceTheme,
} from "@/api/instance";
import { fetchCurrentUser } from "@/api/user";
import { DesktopShell } from "@/components/desktop-shell";
import { LoginView } from "@/components/login-view";
import { readCompiledProfiles, readDefaultProfileId } from "@/config/profiles";
import { openAuthWindow } from "@/platform/auth-window";
import { getDesktopLogPath, logError, logInfo } from "@/platform/logger";
import { configureSdkHost, updateSdkHostConfig } from "@/platform/sdk-host";
import type {
	ConnectionStatus,
	DesktopInstanceProfile,
	DesktopUser,
	InstanceConfig,
} from "@/types";

export const App = () => {
	const profiles = useMemo(readCompiledProfiles, []);
	const defaultProfileId = readDefaultProfileId();
	const [profile] = useState<DesktopInstanceProfile>(
		profiles.find((candidate) => candidate.id === defaultProfileId) ||
			profiles[0],
	);
	const [config, setConfig] = useState<InstanceConfig | null>(null);
	const [status, setStatus] = useState<ConnectionStatus>("idle");
	const [error, setError] = useState("");
	const [isAuthenticating, setIsAuthenticating] = useState(false);
	const [user, setUser] = useState<DesktopUser | null>(null);
	const [userError, setUserError] = useState("");
	const [logPath, setLogPath] = useState("");

	useEffect(() => {
		const uninstallSdkHost = configureSdkHost(profile);
		logInfo(
			`Startup profile=${profile.id} endpoint=${profile.endpoint || "local"} module=${profile.module}`,
		);
		void getDesktopLogPath().then(setLogPath);
		return uninstallSdkHost;
	}, [profile]);

	const loadConfig = useCallback(async (): Promise<InstanceConfig> => {
		const nextConfig = await fetchInstanceConfig(profile);
		updateSdkHostConfig(nextConfig);
		setConfig(nextConfig);
		setStatus(
			Object.keys(nextConfig.logins || {}).length > 0
				? "authenticated"
				: "connected",
		);
		return nextConfig;
	}, [profile]);

	useEffect(() => {
		let isActive = true;
		setStatus("loading");
		setError("");
		setConfig(null);
		setUser(null);
		setUserError("");

		fetchInstanceConfig(profile)
			.then((nextConfig) => {
				if (!isActive) return;
				updateSdkHostConfig(nextConfig);
				setConfig(nextConfig);
				setStatus(
					Object.keys(nextConfig.logins || {}).length > 0
						? "authenticated"
						: "connected",
				);
			})
			.catch((loadError: unknown) => {
				if (!isActive) return;
				logError(
					`Instance configuration failed profile=${profile.id}: ${
						loadError instanceof Error
							? loadError.message
							: "Unknown error"
					}`,
				);
				setStatus("error");
				setError(
					loadError instanceof Error
						? loadError.message
						: "Unable to connect to this SEMOSS instance.",
				);
			});

		return () => {
			isActive = false;
		};
	}, [profile]);

	useEffect(() => {
		if (status !== "authenticated" || !config) return;

		let isActive = true;
		setUserError("");
		void fetchCurrentUser(profile, config)
			.then((nextUser) => {
				if (isActive) setUser(nextUser);
			})
			.catch((loadError: unknown) => {
				if (!isActive) return;
				logError(
					`Current user failed: ${
						loadError instanceof Error
							? loadError.message
							: "Unknown error"
					}`,
				);
				setUserError(
					loadError instanceof Error
						? loadError.message
						: "Unable to load the authenticated user.",
				);
			});

		return () => {
			isActive = false;
		};
	}, [config, profile, status]);

	const handleOauthLogin = async (provider: string): Promise<void> => {
		setIsAuthenticating(true);
		setError("");
		try {
			await openAuthWindow({
				profile,
				provider,
				readConfig: loadConfig,
			});
			await loadConfig();
		} catch (authError: unknown) {
			logError(
				`OAuth login failed provider=${provider}: ${
					authError instanceof Error
						? authError.message
						: "Unknown error"
				}`,
			);
			setError(
				authError instanceof Error
					? authError.message
					: "Unable to complete authentication.",
			);
		} finally {
			setIsAuthenticating(false);
		}
	};

	const handlePasswordLogin = async (
		provider: "native" | "ldap",
		username: string,
		password: string,
	): Promise<void> => {
		setIsAuthenticating(true);
		setError("");
		try {
			await loginWithPassword(profile, provider, username, password);
			await loadConfig();
		} catch (authError: unknown) {
			logError(
				`Password login failed provider=${provider}: ${
					authError instanceof Error
						? authError.message
						: "Unknown error"
				}`,
			);
			setError(
				authError instanceof Error
					? authError.message
					: "Unable to complete authentication.",
			);
		} finally {
			setIsAuthenticating(false);
		}
	};

	const theme = readInstanceTheme(config || {});

	useEffect(() => {
		document.title = theme.name || "AI Core";
	}, [theme.name]);

	return (
		<div className="desktop-root flex h-dvh min-h-[32rem] flex-col overflow-hidden">
			{status === "loading" || status === "idle" ? (
				<main className="flex flex-1 items-center justify-center">
					<output
						className="flex items-center gap-3"
						aria-live="polite"
					>
						<Spinner />
						<span>Connecting to {profile.displayName}...</span>
					</output>
				</main>
			) : null}

			{status === "error" ? (
				<main className="flex flex-1 items-center justify-center p-6">
					<Alert variant="destructive" className="max-w-xl">
						<AlertDescription className="flex flex-col gap-4">
							<span>{error}</span>
							{logPath ? (
								<code className="break-all rounded bg-muted px-2 py-1 text-xs">
									Log: {logPath}
								</code>
							) : null}
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setStatus("loading");
									void loadConfig().catch(
										(retryError: unknown) => {
											setStatus("error");
											setError(
												retryError instanceof Error
													? retryError.message
													: "Unable to connect.",
											);
										},
									);
								}}
							>
								Retry connection
							</Button>
						</AlertDescription>
					</Alert>
				</main>
			) : null}

			{status === "connected" && config ? (
				<LoginView
					config={config}
					theme={theme}
					isAuthenticating={isAuthenticating}
					error={error}
					onPasswordLogin={handlePasswordLogin}
					onOauthLogin={handleOauthLogin}
				/>
			) : null}

			{status === "authenticated" && config ? (
				<DesktopShell
					profile={profile}
					config={config}
					theme={theme}
					user={user}
					userError={userError}
				/>
			) : null}
		</div>
	);
};
