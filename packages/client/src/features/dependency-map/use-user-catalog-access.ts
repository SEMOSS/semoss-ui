import { useMemo } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
	buildUserCatalogAccessPixel,
	parseUserCatalogAccess,
	type UserCatalogAccess,
} from "@/api/dependency-map";

export interface UseUserCatalogAccessResult {
	/** The user's access by item id, or null when no user is picked or it is being read */
	access: ReadonlyMap<string, UserCatalogAccess> | null;
	/** Whether it is being read */
	isLoading: boolean;
	/** Why it could not be read, or null */
	error: string | null;
}

/**
 * Reads what one user can use, for the User Access lens. Nothing is read
 * until a user is picked.
 *
 * @param userId - The user, or empty.
 * @returns Their access by item id.
 */
export const useUserCatalogAccess = (
	userId: string,
): UseUserCatalogAccessResult => {
	const result = usePixel<unknown>(buildUserCatalogAccessPixel(userId), {
		data: null,
	});
	const data = result.status === "SUCCESS" ? result.data : null;
	const parsed = useMemo((): {
		access: ReadonlyMap<string, UserCatalogAccess> | null;
		error: string | null;
	} => {
		if (data === null) {
			return { access: null, error: null };
		}
		try {
			return {
				access: new Map(
					parseUserCatalogAccess(data).map((entry) => [
						entry.id,
						entry,
					]),
				),
				error: null,
			};
		} catch (cause: unknown) {
			return {
				access: null,
				error:
					cause instanceof Error
						? cause.message
						: "The user's access could not be read.",
			};
		}
	}, [data]);
	return {
		access: parsed.access,
		isLoading: !!userId && result.status === "LOADING",
		error: result.error?.message ?? parsed.error,
	};
};
