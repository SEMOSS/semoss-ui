import { useEffect, useState } from "react";
import { getResourcePermissions } from "@semoss/sdk";

/**
 * Whether a model has known prices, so its usage limits can have cost rules,
 * read from the model's permissions. Until it is known, or when it cannot be
 * read, Cost is offered and the backend checks it when the limit is saved.
 *
 * @param engineId - the model, or null for anything else
 * @param admin - whether to read in admin mode; outside it an admin has only
 * their own permissions
 * @returns whether cost rules can be added
 */
export const useCostLimitsAvailable = (
	engineId: string | null,
	admin = false,
): boolean => {
	const [read, setRead] = useState<{
		engineId: string;
		value: boolean;
	} | null>(null);

	useEffect(() => {
		if (!engineId) {
			return;
		}
		let isStale = false;
		getResourcePermissions({ resourceType: "ENGINE", id: engineId }, admin)
			.then((access) => {
				if (!isStale) {
					setRead({ engineId, value: access.costLimitsAvailable });
				}
			})
			.catch(() => {
				// the backend still refuses cost rules on a model without prices
				if (!isStale) {
					setRead({ engineId, value: true });
				}
			});
		return () => {
			isStale = true;
		};
	}, [engineId, admin]);

	return read !== null && read.engineId === engineId ? read.value : true;
};
