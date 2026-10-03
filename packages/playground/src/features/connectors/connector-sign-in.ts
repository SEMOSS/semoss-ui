import { Logins } from "@semoss/sdk";
import {
	type ConnectorProviderId,
	getConnectorProvider,
} from "./connector.catalog";

/**
 * How the backend says a connector call needs its account signed in: the
 * login required error for Microsoft and Google, or Graph refusing a token
 * that has expired.
 */
const SIGN_IN_FAILURE =
	/please log ?in to your (?:microsoft|google) account|LOGG?IN_REQUIRED_ERROR|returned HTTP 401/i;

/**
 * Whether a connector call failed because its account is not signed in, as
 * its saved response tells.
 *
 * @param response - The call's saved response or error.
 * @return True when signing in again is what the call needs.
 */
export const isSignInFailure = (response: string | undefined): boolean =>
	!!response && SIGN_IN_FAILURE.test(response);

/**
 * Sign the session in to a connector's provider through the SDK, which keeps
 * every view's logins current. Must be called straight from a click: the sign
 * in popup opens before anything is awaited.
 *
 * @param providerId - The provider.
 * @return Whether the session holds the provider's login afterwards.
 * @throws PopupBlockedError when the browser blocks the sign in window.
 */
export const signInToProvider = (
	providerId: ConnectorProviderId,
): Promise<boolean> => {
	const provider = getConnectorProvider(providerId);
	return Logins.connect(provider.loginKey, provider.loginPath);
};
