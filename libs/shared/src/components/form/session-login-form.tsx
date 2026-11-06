import { useConfig, useSession } from "@semoss/sdk/react";
import { LoginFormFields } from "./login-form-fields";

/**
 * The sign in form for an app gated on `Session` (`useSession((s) => s.status)`):
 * the providers come from the server config and every sign in goes through
 * the page's session, so the whole page signs in together.
 */
export function SessionLoginForm() {
	const availableProviders = useConfig(
		(state) => state.config?.availableProviders ?? [],
	);
	const login = useSession((state) => state.login);
	const requestOTP = useSession((state) => state.requestOTP);

	return (
		<LoginFormFields
			availableProviders={availableProviders}
			login={login}
			requestOTP={requestOTP}
		/>
	);
}
