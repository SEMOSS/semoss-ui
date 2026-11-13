import { useContext, useEffect } from "react";
import { useStoreSelector } from "@semoss/utility/react/use-store-selector";
import {
	Session,
	type SessionStore,
} from "../../../stores/session/session.store";
import { SessionContext } from "../contexts/session.context";
import { pickActions } from "../utility/pick-actions";

/** The session's actions, handed to selectors beside its state. */
const SESSION_ACTIONS = [
	"initialize",
	"refresh",
	"login",
	"requestOTP",
	"register",
	"logout",
	"canPerform",
	"setMetadata",
] as const;

/** The session's state, with the actions that change it. */
type SessionState = ReturnType<SessionStore["getSnapshot"]> &
	Pick<SessionStore, (typeof SESSION_ACTIONS)[number]>;

/**
 * The session the view belongs to: the nearest `SessionProvider`'s, or the
 * page's {@link Session} when there is none. Every session hook finds its
 * session here, so they all agree.
 *
 * Internal to the SDK's hooks: apps read the session through `useSession`,
 * `useConfig`, `useLogins` and `useSessionPermissions`.
 *
 * @returns The session.
 */
export const useSessionStore = (): SessionStore =>
	useContext(SessionContext) ?? Session;

/**
 * Read the session the view belongs to, rendering again only when the
 * selected part changes. The session is read on first use; every view shares
 * that one read.
 *
 * Read the session's logins with `useLogins`, its config with `useConfig`,
 * a resource's permission with `useSessionPermissions`, and its own insight
 * with `useSessionInsight`.
 *
 * @param selector - Picks the part to read. Defaults to all of it, which
 * renders on every change.
 * @returns The selected part.
 *
 * @example
 * ```tsx
 * const status = useSession((state) => state.status);
 * const isAdmin = useSession((state) => state.user?.isAdmin === true);
 * const logout = useSession((state) => state.logout);
 * ```
 */
export const useSession = <T = SessionState>(
	selector: (state: SessionState) => T = (state) => state as T,
): T => {
	const session = useSessionStore();

	// guarded inside the session: every view shares the first read
	useEffect(() => {
		void session.initialize();
	}, [session]);

	return useStoreSelector(session, (snapshot) =>
		selector({ ...snapshot, ...pickActions(session, SESSION_ACTIONS) }),
	);
};
