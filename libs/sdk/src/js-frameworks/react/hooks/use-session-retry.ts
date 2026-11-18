import type { SessionStore } from "../../../stores/session/session.store";
import { useSession } from "./use-session";

/**
 * Retry reading the view's session, such as from the error a signed in
 * layout shows on the `ERROR` status. `isRetrying` comes from the session
 * itself, so every view agrees while it reads again.
 *
 * @returns Whether the session is being read, to disable the Retry, and the
 * retry, `refresh`, which never rejects: a failure shows as `ERROR` again.
 *
 * @example
 * ```tsx
 * const { isRetrying, retry } = useSessionRetry();
 * <Button disabled={isRetrying} onClick={retry}>Retry</Button>
 * ```
 */
export const useSessionRetry = (): {
	isRetrying: boolean;
	retry: SessionStore["refresh"];
} =>
	useSession((state) => ({
		isRetrying: state.isChecking,
		retry: state.refresh,
	}));
