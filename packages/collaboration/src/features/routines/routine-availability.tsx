import { Link } from "react-router";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	cn,
} from "@semoss/ui/next";
import type { RoutineStatus } from "./routine-schema";

interface RoutineAvailabilityProps {
	/** Saved state and the server's availability report. */
	routine: Pick<RoutineStatus, "mailboxAvailable" | "availabilityMessage">;
	/** Whether the scheduler, mailbox, and assistant are all ready. */
	isAvailable: boolean;
	/** Replaces the card-bottom padding, such as for a place near the top. */
	className?: string;
}

/** Keep connection and scheduler warnings visible beside an autosaving form. */
export function RoutineAvailability({
	routine,
	isAvailable,
	className,
}: RoutineAvailabilityProps) {
	return (
		<>
			{!isAvailable && (
				<div className={cn("px-6 pb-6", className)}>
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
