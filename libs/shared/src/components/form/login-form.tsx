import { useId, useState } from "react";
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
	toast,
} from "@semoss/ui/next";
import { LoginProviderIcon } from "../login-provider-icon";

export function LoginForm() {
	const usernameId = useId();
	const passwordId = useId();

	const { system, actions } = useInsight();

	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");

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

	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	if (isLoading) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	return (
		<form className="flex flex-col gap-6">
			<FieldGroup>
				<div className="flex flex-col items-center gap-1 text-center">
					<h1 className="font-bold text-2xl">Sign In</h1>
					<p className="text-balance text-muted-foreground text-sm">
						Log in to unlock your access
					</p>
				</div>
				{isNative && (
					<>
						<Field>
							<FieldLabel htmlFor="username">Username</FieldLabel>
							<Input
								id={usernameId}
								type="text"
								placeholder="Username"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								required
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor="password">Password</FieldLabel>
							<Input
								id={passwordId}
								value={password}
								placeholder="Password"
								onChange={(e) => setPassword(e.target.value)}
								type="password"
								required
							/>
						</Field>
						<Field>
							<Button
								type="submit"
								onClick={() => {
									// turn on loading
									setIsLoading(true);

									if (!username || !password) {
										setError(
											"Username and Password is Required",
										);
										return;
									}

									actions
										.login({
											type: "native",
											username: username,
											password: password,
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
								}}
							>
								Login
							</Button>
						</Field>
					</>
				)}
				{isNative && hasOAuth && <FieldSeparator>or</FieldSeparator>}

				{system.config.availableProviders.map((p) => {
					// skip ones that aren't oauth
					if (!p.isOauth) {
						return null;
					}

					return (
						<Field key={p.provider}>
							<Button
								key={p.provider}
								variant="outline"
								onClick={async () => {
									// turn on loading
									setIsLoading(true);

									await actions
										.login({
											type: "oauth",
											provider: p.provider,
										})
										.then(() => {
											// turn off loading
											setIsLoading(false);

											toast.success(
												`Successfully logged in`,
											);
										})
										.catch((e) => {
											// turn off loading
											setIsLoading(false);

											setError(e.message);

											toast.error(e.message);
										});
								}}
								className="w-full gap-2"
							>
								<LoginProviderIcon
									provider={p.provider}
									className="h-4 w-4 shrink-0 object-contain"
								/>
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
