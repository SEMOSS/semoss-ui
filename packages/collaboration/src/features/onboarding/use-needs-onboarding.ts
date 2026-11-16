import { useEffect, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import { getSetupState } from "./onboarding-api";

const ENDED_KEY = "collaboration-setup-ended";

/** Setup ended though the server could not record it: Today leaves the owner alone for this browser session. */
export function rememberSetupEnded(): void {
	try {
		sessionStorage.setItem(ENDED_KEY, "1");
	} catch {
		// no session storage: Today may offer setup again after a reload
	}
}

/** True after {@link rememberSetupEnded} in this browser session. */
function endedThisSession(): boolean {
	try {
		return sessionStorage.getItem(ENDED_KEY) === "1";
	} catch {
		return false;
	}
}

/** True once the server says this owner has not finished or skipped setup, so Today sends them back to it. */
export function useNeedsOnboarding(): boolean {
	const { actions } = useInsight();
	const [needs, setNeeds] = useState(false);

	useEffect(() => {
		if (endedThisSession()) return;
		let live = true;
		getSetupState(actions)
			.then(({ imported, setupDone }) => {
				// an older server without setupDone keeps Today unless nothing was imported
				if (live)
					setNeeds(
						setupDone === false ||
							(setupDone === undefined && imported === false),
					);
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
