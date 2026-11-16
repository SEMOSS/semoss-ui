import { Navigate, useLocation } from "react-router";
import { useSession } from "@semoss/sdk/react";
import { LoginForm } from "@semoss/shared";
import { H1, Spinner } from "@semoss/ui/next";
import semossLogo from "@/assets/img/semoss-logo.svg";

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
	const status = useSession((state) => state.status);
	const { state } = useLocation();
	const target = getReturnTarget(state);

	// the providers come from the session's config read; wait for it so the form does not flash empty
	if (status === "INITIALIZING") {
		return (
			<main className="flex min-h-svh items-center justify-center">
				<Spinner />
			</main>
		);
	}

	if (status === "AUTHENTICATED") {
		return <Navigate to={target} replace />;
	}

	return (
		<main className="flex min-h-svh items-center justify-center p-6">
			<div className="w-full max-w-xs space-y-6">
				<div className="flex items-center justify-center gap-3">
					<img
						src={semossLogo}
						alt=""
						width={24}
						height={28}
						className="h-7 w-6 shrink-0 dark:invert"
					/>
					<H1 className="font-medium text-xl">Collaboration</H1>
				</div>
				<LoginForm />
			</div>
		</main>
	);
};
