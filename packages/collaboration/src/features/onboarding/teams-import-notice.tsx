import { TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle, P } from "@semoss/ui/next";
import { formatCount } from "./onboarding-ui";

interface TeamsImportNoticeProps {
	/** Import job counts, including partial Teams results and explicit reconnect status. */
	counts: Record<string, unknown>;
}

/** Keep readable chat results visible without presenting a chat access failure as an expired login. */
export function TeamsImportNotice({ counts }: TeamsImportNoticeProps) {
	const error =
		typeof counts.teamsError === "string" ? counts.teamsError : "";
	const skipped =
		typeof counts.teamsChatsSkipped === "number" &&
		Number.isInteger(counts.teamsChatsSkipped) &&
		counts.teamsChatsSkipped > 0
			? counts.teamsChatsSkipped
			: 0;
	if (!error && skipped === 0) return null;
	const partialSummary = `${skipped} Teams chat${skipped === 1 ? "" : "s"} could not be read.`;
	// Hide only known summary text; keep unfamiliar provider errors available.
	const isSummaryOnly =
		skipped > 0 &&
		(error === partialSummary ||
			error ===
				`${partialSummary} Readable chats were kept; failed chats will be retried on the next import.`);

	return (
		<Alert className="border-warning/30 bg-warning/10">
			<TriangleAlert aria-hidden="true" />
			<AlertTitle className="line-clamp-none">
				{skipped > 0
					? `Read ${formatCount(counts.teamsMessages ?? 0)} Teams messages. Skipped ${formatCount(skipped)} chat${skipped === 1 ? "" : "s"}.`
					: "Teams chats could not be read. Mail import can continue."}
			</AlertTitle>
			<AlertDescription>
				<P className="text-sm">
					{counts.teamsReauthNeeded === true
						? "Sign out of SEMOSS and back in, then import again."
						: skipped > 0
							? "Skipped chats will be retried on your next import."
							: "Check your Teams access and import again."}
				</P>
				{error && !isSummaryOnly && (
					<details className="w-full">
						<summary className="cursor-pointer rounded-sm focus-visible:outline-2 focus-visible:outline-ring">
							Teams import details
						</summary>
						<P className="mt-1 break-words text-sm">{error}</P>
					</details>
				)}
			</AlertDescription>
		</Alert>
	);
}
