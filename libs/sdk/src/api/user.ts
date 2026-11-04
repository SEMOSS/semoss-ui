import { isRecord } from "@semoss/utility/object";
import { asString } from "@semoss/utility/string";
import { Env } from "../env";
import { post } from "../utility";
import { runPixel } from "./base";

/**
 * Read a text field from `GetUserInfo`, which sends a missing value as the
 * string `"null"`.
 *
 * @param value - The field as the backend sent it.
 * @returns The text, or empty when missing.
 */
const readText = (value: unknown): string => {
	const text = asString(value);
	return text === "null" ? "" : text;
};

/**
 * Flatten the user's metadata. The backend keeps every key as a list of
 * values, in order; the user's settings, such as their default models, are
 * each one value, so each list is read as its first entry.
 *
 * @param value - The metadata as the backend sent it, by key.
 * @returns Each key's first value.
 */
const flattenMeta = (value: unknown): Record<string, unknown> =>
	isRecord(value)
		? Object.fromEntries(
				Object.entries(value).map(([key, entry]) => [
					key,
					Array.isArray(entry) ? entry[0] : entry,
				]),
			)
		: {};

/**
 * Read one login's record from `GetUserInfo`, keeping only well formed
 * fields.
 *
 * @param record - The record as the backend sent it.
 * @returns The login's user.
 */
const parseLoginInfo = (
	record: Record<string, unknown>,
): {
	id: string;
	name: string;
	username: string;
	email: string;
	/** Changes whenever the user's sessions are revoked. */
	userEpoch: string;
	/** When the user last signed in, as the backend formats it; absent when not known. */
	lastLogin?: string;
	/** The directory groups the login belongs to; absent when the provider sends none. */
	groupInfo?: { groupType?: string; groups: string[] };
	/** The user's metadata, each value as one entry rather than a list. */
	meta: Record<string, unknown>;
} => {
	const groupInfo = record.groupInfo;
	return {
		id: readText(record.id),
		name: readText(record.name),
		username: readText(record.username),
		email: readText(record.email),
		userEpoch: readText(record.userEpoch),
		lastLogin: readText(record.lastLogin) || undefined,
		groupInfo:
			isRecord(groupInfo) && Array.isArray(groupInfo.groups)
				? (groupInfo as { groupType?: string; groups: string[] })
				: undefined,
		meta: flattenMeta(record.meta),
	};
};

/**
 * Read the signed in user, as each of the session's logins describes them.
 * Running it in `"new"` creates an insight, which a session can keep as its
 * own. It runs as `META`, so it is not kept in the insight's recipe.
 *
 * @param insightId - The insight to run in. Defaults to a new one.
 * @returns The insight it ran in, and each login's user keyed by its upper
 * case provider, such as `NATIVE` or `MICROSOFT`. Empty when signed out.
 * @throws When the backend returns an error.
 */
export const getUserInfo = async (insightId = "new") => {
	const response = await runPixel<[Record<string, unknown>]>(
		"META | GetUserInfo();",
		insightId,
	);
	if (response.errors.length > 0) {
		throw new Error(response.errors.join(""));
	}

	const output = response.pixelReturn[0]?.output;
	const logins: Record<string, ReturnType<typeof parseLoginInfo>> = {};
	if (isRecord(output)) {
		for (const [provider, record] of Object.entries(output)) {
			// signed out, the backend answers `{"No User": "User is not logged in"}`
			if (isRecord(record)) {
				logins[provider] = parseLoginInfo(record);
			}
		}
	}
	return { insightId: response.insightId, logins: logins };
};

/**
 * Set or remove one of the user's default models. The backend replaces the
 * key's values with the list sent, so an empty list deletes it, and a removed
 * default is gone rather than blank.
 *
 * @param metaKey - Which default.
 * @param engineId - The model's engine id, or empty to remove the default.
 * @param insightId - The insight to run in. Defaults to a new one.
 * @throws When the backend refuses the change.
 */
export const setUserDefaultModel = async (
	metaKey: "text-generation-model" | "code-generation-model",
	engineId: string,
	insightId = "new",
): Promise<void> => {
	// `<` is escaped so a value cannot open Pixel preprocessor markup
	const literal = (text: string) =>
		JSON.stringify(text).replace(/</g, "\\u003c");
	const value = engineId ? literal(engineId) : "";

	const response = await runPixel(
		`META | SetUserMetadata(meta=[{${literal(metaKey)}:[${value}]}]);`,
		insightId,
	);
	if (response.errors.length > 0) {
		throw new Error(response.errors.join(""));
	}
};

/**
 * Upload file(s) to the current user's user space
 * @param path
 * @param files
 * @param insightId
 * @returns
 */
export const uploadUser = async (
	path: string,
	files: File | File[],
	insightId: string | null,
) => {
	const fd: FormData = new FormData();
	if (Array.isArray(files)) {
		for (let i = 0; i < files.length; i++) {
			fd.append("file", files[i]);
		}
	} else {
		// pasted data
		fd.append("file", files);
	}

	return await post<
		{
			fileName: string;
			fileLocation: string;
		}[]
	>(
		`${Env.MODULE}/api/uploadFile/userAssetsUpload?insightId=${insightId}&path=${encodeURIComponent(path)}`,
		fd,
		{},
	);
};
