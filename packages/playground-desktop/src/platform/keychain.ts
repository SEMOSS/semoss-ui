import { invokeCommand, isTauriRuntime } from "./tauri";

/**
 * Secrets in the system keychain (service `semoss-desktop`, one account per
 * instance and secret), never in the preferences file or web storage.
 * Outside the desktop shell there is no keychain: nothing is remembered.
 */

/**
 * The keychain account a secret of an instance is kept under.
 *
 * @param instanceId - The instance.
 * @param secret - Which secret, such as `bearer-token`.
 * @returns The account.
 */
const toAccount = (instanceId: string, secret: string): string =>
	`${instanceId}:${secret}`;

/**
 * Read a secret.
 *
 * @param instanceId - The instance.
 * @param secret - Which secret.
 * @returns The secret, or null when none is kept.
 */
export const readSecret = async (
	instanceId: string,
	secret: string,
): Promise<string | null> =>
	isTauriRuntime()
		? invokeCommand<string | null>("secret_get", {
				account: toAccount(instanceId, secret),
			})
		: null;

/**
 * Keep a secret.
 *
 * @param instanceId - The instance.
 * @param secret - Which secret.
 * @param value - The secret.
 */
export const writeSecret = async (
	instanceId: string,
	secret: string,
	value: string,
): Promise<void> => {
	if (isTauriRuntime()) {
		await invokeCommand("secret_set", {
			account: toAccount(instanceId, secret),
			value: value,
		});
	}
};

/**
 * Forget a secret; none kept is not an error.
 *
 * @param instanceId - The instance.
 * @param secret - Which secret.
 */
export const deleteSecret = async (
	instanceId: string,
	secret: string,
): Promise<void> => {
	if (isTauriRuntime()) {
		await invokeCommand("secret_delete", {
			account: toAccount(instanceId, secret),
		});
	}
};

/** The bearer token secret's name. */
export const BEARER_TOKEN_SECRET = "bearer-token";
