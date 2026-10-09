import { createContext, type RefObject } from "react";

export interface CollaborationAccount {
	/** Keeps every account menu disabled while the shared request is pending. */
	isLoggingOut: boolean;
	/** Retains a retryable failure when mobile navigation unmounts. */
	error: string;
	/** Synchronous guard for navigation and repeated logout activation. */
	isLogoutPending: RefObject<boolean>;
	/** Ends the session before navigating to the sign-in page. */
	logout: () => Promise<void>;
}

/** Account request state belongs to the persistent shell, outside navigation drawers. */
export const CollaborationAccountContext =
	createContext<CollaborationAccount | null>(null);
