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
