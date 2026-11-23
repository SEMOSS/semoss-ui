import { useMemo } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
	buildUserCatalogAccessPixel,
	parseUserCatalogAccess,
	readReply,
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
	const parsed = useMemo(
		() =>
			readReply(
				data,
				(output): ReadonlyMap<string, UserCatalogAccess> =>
					new Map(
						parseUserCatalogAccess(output).map((entry) => [
							entry.id,
							entry,
						]),
					),
				"The user's access could not be read.",
			),
		[data],
	);
	return {
		access: parsed.value,
		isLoading: !!userId && result.status === "LOADING",
		error: result.error?.message ?? parsed.error,
	};
};
