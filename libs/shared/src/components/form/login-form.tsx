import { useInsight } from "@semoss/sdk/react";
import { LoginFormFields } from "./login-form-fields";

/**
 * The sign in form for an app gated on its insight (`useInsight().isAuthorized`).
 * Must be mounted inside an `<InsightProvider>`. Apps gated on `Session` use
 * `SessionLoginForm` instead.
 */
export function LoginForm() {
	const { system, actions } = useInsight();

	return (
		<LoginFormFields
			availableProviders={system.config.availableProviders}
			login={actions.login}
			requestOTP={actions.requestOTP}
		/>
	);
}
