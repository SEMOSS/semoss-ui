import { useEffect, useId, useMemo, useState } from "react";
import loginHero from "@semoss/shared/assets/img/login-gif.gif";
import {
	getLoginProviderInitials,
	getLoginProviderKey,
	loadLoginProviderLogos,
} from "@semoss/shared/login-provider";
import {
	Alert,
	AlertDescription,
	Button,
	H1,
	Input,
	Label,
	Muted,
	Separator,
	Spinner,
} from "@semoss/ui/next";
import type { InstanceConfig, InstanceTheme } from "@/types";

interface LoginViewProps {
	config: InstanceConfig;
	theme: InstanceTheme;
	isAuthenticating: boolean;
	error: string;
	onPasswordLogin: (
		provider: "native" | "ldap",
		username: string,
		password: string,
	) => Promise<void>;
	onOauthLogin: (provider: string) => Promise<void>;
}

export const LoginView = ({
	config,
	theme,
	isAuthenticating,
	error,
	onPasswordLogin,
	onOauthLogin,
}: LoginViewProps) => {
	const providers = config.availableProviders || [];
	const passwordProviders = providers.filter(
		(provider) =>
			!provider.isOauth &&
			(provider.provider.toLowerCase() === "native" ||
				provider.provider.toLowerCase() === "ldap"),
	);
	const oauthProviders = providers.filter((provider) => provider.isOauth);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [oauthProviderLogos, setOauthProviderLogos] = useState<
		Record<string, string>
	>({});
	const [passwordProvider, setPasswordProvider] = useState<"native" | "ldap">(
		passwordProviders.some(
			(provider) => provider.provider.toLowerCase() === "native",
		)
			? "native"
			: "ldap",
	);
	const usernameId = useId();
	const passwordId = useId();
	const activeHeroImage = theme.loginHeroImage.trim() || loginHero;
	const oauthProvidersSignature = useMemo(
		() =>
			oauthProviders
				.map((provider) => getLoginProviderKey(provider.provider))
				.sort()
				.join("|"),
		[oauthProviders],
	);

	useEffect(() => {
		const providerKeys = oauthProvidersSignature.split("|").filter(Boolean);
		if (providerKeys.length === 0) return;

		let isActive = true;
		void loadLoginProviderLogos(providerKeys).then((logos) => {
			if (isActive) setOauthProviderLogos(logos);
		});
		return () => {
			isActive = false;
		};
	}, [oauthProvidersSignature]);

	const handlePasswordSubmit = async (
		event: React.FormEvent<HTMLFormElement>,
	): Promise<void> => {
		event.preventDefault();
		await onPasswordLogin(passwordProvider, username, password);
	};

	return (
		<main className="desktop-login-grid grid min-h-0 flex-1 overflow-hidden bg-background">
			<section className="flex min-h-0 items-center justify-center overflow-auto px-6 py-8">
				<div className="w-full max-w-[520px] p-6 md:p-8">
					<header className="mb-8 flex flex-col gap-5">
						<div className="flex min-h-10 items-center gap-3">
							{theme.logo ? (
								<img
									src={theme.logo}
									alt=""
									className="max-h-10 max-w-44 object-contain"
								/>
							) : null}
							{theme.includeNameWithLogo ? (
								<span className="font-bold text-xl">
									{theme.name}
								</span>
							) : null}
						</div>
						<div>
							<H1 className="text-3xl">Welcome back</H1>
							<Muted className="mt-2">
								Sign in to continue to your workspace.
							</Muted>
						</div>
					</header>

					{error ? (
						<Alert variant="destructive" className="mb-5">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					) : null}

					{oauthProviders.length > 0 ? (
						<div className="flex flex-col gap-3">
							{oauthProviders.map((provider) => {
								const providerName =
									provider.name ||
									provider.label ||
									provider.provider;
								const providerKey = getLoginProviderKey(
									provider.provider,
								);
								const providerLogo =
									oauthProviderLogos[providerKey];

								return (
									<Button
										key={provider.provider}
										type="button"
										size="lg"
										variant="outline"
										disabled={isAuthenticating}
										onClick={() =>
											onOauthLogin(provider.provider)
										}
									>
										{isAuthenticating ? (
											<Spinner className="size-4" />
										) : providerLogo ? (
											<img
												src={providerLogo}
												alt=""
												aria-hidden="true"
												className="size-4 shrink-0 object-contain"
											/>
										) : (
											<span className="inline-flex size-4 items-center justify-center rounded-sm border border-border/70 bg-muted text-[9px] text-muted-foreground">
												{getLoginProviderInitials(
													providerName,
												)}
											</span>
										)}
										{providerName}
									</Button>
								);
							})}
							{passwordProviders.length > 0 ? (
								<div className="flex items-center gap-4 py-1">
									<Separator className="flex-1" />
									<span className="text-muted-foreground text-sm">
										or
									</span>
									<Separator className="flex-1" />
								</div>
							) : null}
						</div>
					) : null}

					{passwordProviders.length > 0 ? (
						<form
							className="mt-4 flex flex-col gap-4"
							onSubmit={handlePasswordSubmit}
						>
							{passwordProviders.length > 1 ? (
								<fieldset className="flex gap-2">
									<legend className="sr-only">
										Sign-in method
									</legend>
									{passwordProviders.map((provider) => {
										const value =
											provider.provider.toLowerCase() as
												| "native"
												| "ldap";
										return (
											<Button
												key={provider.provider}
												type="button"
												size="sm"
												variant={
													passwordProvider === value
														? "secondary"
														: "ghost"
												}
												onClick={() =>
													setPasswordProvider(value)
												}
											>
												{provider.name ||
													provider.label ||
													provider.provider}
											</Button>
										);
									})}
								</fieldset>
							) : null}
							<div className="flex flex-col gap-2">
								<Label htmlFor={usernameId}>Username</Label>
								<Input
									id={usernameId}
									name="username"
									autoComplete="username"
									required
									value={username}
									onChange={(event) =>
										setUsername(event.target.value)
									}
								/>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor={passwordId}>Password</Label>
								<Input
									id={passwordId}
									name="password"
									type="password"
									autoComplete="current-password"
									required
									value={password}
									onChange={(event) =>
										setPassword(event.target.value)
									}
								/>
							</div>
							<Button type="submit" disabled={isAuthenticating}>
								{isAuthenticating ? (
									<Spinner className="size-4" />
								) : null}
								Sign in
							</Button>
						</form>
					) : null}

					{providers.length === 0 ? (
						<Alert>
							<AlertDescription>
								This instance did not advertise an
								authentication provider.
							</AlertDescription>
						</Alert>
					) : null}
				</div>
			</section>
			<aside className="relative hidden overflow-hidden lg:block">
				<img
					src={activeHeroImage}
					alt=""
					className="absolute inset-0 h-full w-full object-cover"
				/>
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-y-0 left-0 w-72 bg-gradient-to-r from-background to-transparent"
				/>
			</aside>
		</main>
	);
};
