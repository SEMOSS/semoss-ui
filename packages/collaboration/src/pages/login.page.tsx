import { Navigate, useLocation } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import { LoginForm } from "@semoss/shared";
import { Spinner } from "@semoss/ui/next";

function getReturnTarget(state: unknown): string {
	if (
		typeof state === "object" &&
		state !== null &&
		"target" in state &&
		typeof state.target === "string"
	) {
		return state.target;
	}

	return "/";
}

/**
 * The platform login: offers whatever the server's config turns on (native, LDAP, OAuth such as
 * Microsoft), then sends the user back to where they were going.
 */
export const LoginPage = () => {
	const { isInitialized, isAuthorized } = useInsight();
	const { state } = useLocation();
	const target = getReturnTarget(state);

	// the providers come from the config call; wait for it so the form does not flash empty
	if (!isInitialized) {
		return (
			<main className="flex min-h-svh items-center justify-center">
				<Spinner />
			</main>
		);
	}

	if (isAuthorized) {
		return <Navigate to={target} replace />;
	}

	return (
		<main className="flex min-h-svh items-center justify-center p-6">
			<div className="w-full max-w-xs space-y-6">
				<h1 className="text-center font-semibold text-xl">
					Collaboration
				</h1>
				<LoginForm />
			</div>
		</main>
	);
};
