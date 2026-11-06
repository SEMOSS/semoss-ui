import { type Context, createContext, type ReactNode } from "react";
import {
	Session,
	type SessionStore,
} from "../../../stores/session/session.store";

/**
 * The session the views below read. Null outside a {@link SessionProvider},
 * where `useSessionStore` falls back to the page's {@link Session}.
 * Internal: not in the public barrel; apps give views a session with
 * {@link SessionProvider}.
 */
// typed out so the published type keeps its null under non-strict builds
export const SessionContext: Context<SessionStore | null> =
	createContext<SessionStore | null>(null);

/**
 * Give the views below a session. A page normally needs none: every hook
 * falls back to the page's own {@link Session}. Use it to hand views a
 * different session, such as a test's.
 *
 * @param props - The provider's props.
 * @param props.session - The session. Defaults to the page's {@link Session}.
 * @param props.children - The views that read it.
 *
 * @example
 * ```tsx
 * const session = new SessionStore({ config: new ConfigStore() });
 *
 * <SessionProvider session={session}>
 *     <App />
 * </SessionProvider>
 * ```
 */
export const SessionProvider = ({
	session = Session,
	children,
}: {
	session?: SessionStore;
	children: ReactNode;
}) => (
	<SessionContext.Provider value={session}>
		{children}
	</SessionContext.Provider>
);
