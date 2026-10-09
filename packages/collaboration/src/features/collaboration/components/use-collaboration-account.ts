import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import type { CollaborationAccount } from "./collaboration-account.context";

/** Share logout progress and retryable errors between desktop and mobile navigation. */
export function useCollaborationAccount(): CollaborationAccount {
	const { actions } = useInsight();
	const navigate = useNavigate();
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const [error, setError] = useState("");
	const isLogoutPending = useRef(false);

	/** End the SDK session before replacing the current location. */
	async function logout(): Promise<void> {
		if (isLogoutPending.current) return;
		isLogoutPending.current = true;
		setIsLoggingOut(true);
		setError("");
		try {
			if (!(await actions.logout())) throw new Error("Logout failed");
			await navigate("/login", { replace: true });
		} catch {
			setError("Could not log out. Please try again.");
		} finally {
			isLogoutPending.current = false;
			setIsLoggingOut(false);
		}
	}

	return { isLoggingOut, error, isLogoutPending, logout };
}
