import { useEffect, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import { getConnection } from "@/features/connectors/api/connection";

/** True once the server says this user has no finished import yet, so they start in onboarding. */
export function useNeedsOnboarding(): boolean {
	const { actions } = useInsight();
	const [needs, setNeeds] = useState(false);

	useEffect(() => {
		let live = true;
		getConnection(actions)
			.then((connection) => {
				// only an explicit false; an older server without the flag keeps Today
				if (live) setNeeds(connection.imported === false);
			})
			.catch(() => {
				// could not tell: stay on Today rather than block it
			});
		return () => {
			live = false;
		};
	}, [actions]);

	return needs;
}
