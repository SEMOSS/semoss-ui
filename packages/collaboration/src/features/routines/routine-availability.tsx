import { Link } from "react-router";
import { Alert, AlertDescription, AlertTitle, Button } from "@semoss/ui/next";
import type { RoutineStatus } from "./routine-schema";

interface RoutineAvailabilityProps {
	/** Saved state and the server's availability report. */
	routine: Pick<RoutineStatus, "mailboxAvailable" | "availabilityMessage">;
	/** Whether the scheduler, mailbox, and assistant are all ready. */
	isAvailable: boolean;
}

/** Keep connection and scheduler warnings visible beside an autosaving form. */
export function RoutineAvailability({
	routine,
	isAvailable,
}: RoutineAvailabilityProps) {
	return (
		<>
			{!isAvailable && (
				<div className="px-6 pb-6">
					<Alert>
						<AlertTitle>Setup needs attention</AlertTitle>
						<AlertDescription>
							{routine.availabilityMessage?.replace(
								/\bBrain\b/g,
								"Settings",
							) ||
								"Your inbox connection, scheduler, or assistant is unavailable. Check your connection or contact your administrator."}
							{!routine.mailboxAvailable && (
								<Button
									asChild
									variant="link"
									className="h-auto self-start p-0"
								>
									<Link to="/brain/sources">
										Manage inbox connection
									</Link>
								</Button>
							)}
						</AlertDescription>
					</Alert>
				</div>
			)}
		</>
	);
}
