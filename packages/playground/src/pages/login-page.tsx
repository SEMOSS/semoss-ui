import { observer } from "mobx-react-lite";
import { useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { type Location, Navigate, useLocation } from "react-router-dom";
import { useInsight } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Input,
	Label,
	Progress,
	toast,
} from "@semoss/ui/next";
import { AppLogo } from "@/components/app-logo";

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

	const usernameId = useId();
	const passwordId = useId();

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

				toast.success(`Successfully logged in`);
			})
			.catch((e) => {
				// turn off loading
				setIsLoading(false);

				setError(e.message);

				toast.success(e.message);
			});
	};

	// get the path the user is coming from
	const path = (location.state as { from: Location })?.from?.pathname || "/";

	// navigate if already logged in
	if (isAuthorized) {
		return <Navigate to={path} replace />;
	}

	return (
		<div className="flex h-screen w-screen flex-col bg-background">
			<div className="relative flex w-full flex-1 flex-row overflow-hidden">
				<div className="relative z-10 flex flex-shrink-0 flex-col items-center overflow-y-auto overflow-x-hidden bg-background md:h-full md:w-full">
					<div className="mx-[108px] mt-[144px] mb-4 flex w-[610px] flex-col gap-6 md:m-0 md:w-full md:max-w-[610px] md:p-8">
						<div>
							<div className="mb-2 flex flex-row items-center gap-2">
								<AppLogo />
							</div>
							<h1 className="mb-2 font-bold text-3xl">
								Welcome!
							</h1>
							<p className="mb-8 text-base">Log in below</p>
						</div>
						{error && (
							<Alert variant="destructive">
								<AlertTitle>Error</AlertTitle>
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}
						<form>
							<div className="flex flex-col gap-4">
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
													<div className="space-y-2">
														<Label
															htmlFor={usernameId}
														>
															Username
														</Label>
														<Input
															id={usernameId}
															type="text"
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
															data-testid="loginPage-textField-username"
														/>
													</div>
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
													<div className="space-y-2">
														<Label
															htmlFor={passwordId}
														>
															Password
														</Label>
														<Input
															id={passwordId}
															type="password"
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
															data-testid="loginPage-textField-password"
														/>
													</div>
												);
											}}
										/>
										<Button
											className="w-full"
											variant="default"
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
									<div className="relative">
										<div className="absolute inset-0 flex items-center">
											<span className="w-full border-t" />
										</div>
										<div className="relative flex justify-center text-xs uppercase">
											<span className="bg-background px-2 font-bold text-black">
												or
											</span>
										</div>
									</div>
								)}
								{system.config.availableProviders.map((p) => {
									// skip ones that aren't oauth
									if (!p.isOauth) {
										return null;
									}

									return (
										<Button
											key={p.provider}
											variant="outline"
											onClick={() => {
												oauth(p.provider);
											}}
											className="w-full"
										>
											<div className="flex items-center gap-4 p-1">
												<span className="font-medium text-black">
													{p.name}
												</span>
											</div>
										</Button>
									);
								})}
							</div>
						</form>
					</div>
				</div>
				<div className="z-10 h-full w-[336px] bg-gradient-to-r from-white to-white/0" />
				<div className="absolute top-0 right-0 bottom-0 z-0 overflow-hidden">
					&nbsp;
				</div>
			</div>
			{isLoading && <Progress className="w-full" />}
		</div>
	);
});
