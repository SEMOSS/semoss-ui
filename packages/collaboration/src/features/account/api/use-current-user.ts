import { usePixel } from "@semoss/sdk/react";
import { z } from "@semoss/ui/next";

// GetUserInfo uses the literal string "null" for unset provider fields.
const profileField = z
	.string()
	.nullish()
	.transform((value) => {
		const text = value?.trim() ?? "";
		return text.toLowerCase() === "null" ? "" : text;
	});
const userInfoSchema = z.record(
	z.string(),
	z.object({
		name: profileField,
		username: profileField,
		email: profileField,
	}),
);

/** Read the signed-in account using the same provider priority as the main app. */
export function useCurrentUser(): {
	name: string;
	email: string;
	isLoading: boolean;
	error: Error | null;
	refresh: () => void;
} {
	const query = usePixel<unknown>("META | GetUserInfo();");
	const parsed = userInfoSchema.safeParse(query.data);
	const providers =
		query.status === "SUCCESS" && parsed.success ? parsed.data : {};
	const user =
		providers.SAML ?? providers.NATIVE ?? Object.values(providers)[0];

	return {
		name: user?.name || user?.username || user?.email || "",
		email: user?.email ?? "",
		isLoading: query.status === "INITIAL" || query.status === "LOADING",
		error:
			query.error ??
			(query.status === "SUCCESS" && !user
				? new Error("Your account profile could not be loaded.")
				: null),
		refresh: query.refresh,
	};
}
