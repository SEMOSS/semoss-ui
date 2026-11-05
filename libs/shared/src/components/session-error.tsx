import { useState } from "react";
import { Session } from "@semoss/sdk";
import { useSession } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Spinner,
} from "@semoss/ui/next";

/**
 * Shown when the session could not be read, as when the server is down or
 * the user's details failed to load. The user may still be signed in, so it
 * offers to read the session again rather than to sign in.
 */
export const SessionError = () => {
	const error = useSession((state) => state.error);
	const [isRetrying, setIsRetrying] = useState(false);

	/** Read the session again; a failure shows here once more. */
	const handleRetry = async () => {
		setIsRetrying(true);
		try {
			await Session.refresh();
		} finally {
			setIsRetrying(false);
		}
	};

	return (
		<div className="flex h-svh w-full items-center justify-center p-4">
			<Alert variant="destructive" className="max-w-md">
				<AlertTitle>Unable to load your session</AlertTitle>
				<AlertDescription className="flex flex-col items-start gap-3">
					<span>
						{error?.message ||
							"The server could not be reached. Try again in a moment."}
					</span>
					<Button
						variant="outline"
						size="sm"
						disabled={isRetrying}
						onClick={() => void handleRetry()}
						data-testid="sessionError-button-retry"
					>
						{isRetrying && <Spinner className="size-4" />}
						Try again
					</Button>
				</AlertDescription>
			</Alert>
		</div>
	);
};
