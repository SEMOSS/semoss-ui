import { useState } from "react";
import { useSession } from "@semoss/sdk/react";

/**
 * Read the SDK's session again from a Retry button, such as on the error a
 * signed in layout shows when the config or the user could not be read.
 *
 * @returns Whether a retry is running, to disable the button, and the retry.
 * The retry never rejects: a failure shows as the session's `ERROR` status
 * again.
 */
export const useSessionRetry = (): {
	isRetrying: boolean;
	retry: () => Promise<void>;
} => {
	const refresh = useSession((state) => state.refresh);
	const [isRetrying, setIsRetrying] = useState(false);

	const retry = async () => {
		setIsRetrying(true);
		try {
			await refresh();
		} finally {
			setIsRetrying(false);
		}
	};

	return { isRetrying, retry };
};
