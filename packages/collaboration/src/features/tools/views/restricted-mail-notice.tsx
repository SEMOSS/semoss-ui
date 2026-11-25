import { AlertCircle } from "lucide-react";
import {
	Alert,
	AlertDescription,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Muted,
	P,
	z,
} from "@semoss/ui/next";
import { parseToolResult, resultRecord } from "./tool-result-data";

const diagnosticSchema = z.object({
	status: z.enum(["searched", "partial", "unavailable", "not_searched"]),
	note: z.string().nullish(),
	items: z.array(
		z.object({
			messageId: z.string().min(1),
			subject: z.string().nullish(),
			code: z.string().min(1),
			message: z.string().min(1),
			topicMatch: z.enum(["linked", "unknown", "not_scoped"]),
		}),
	),
});

/** Show only the restricted-mail fields intended for display, not source content. */
export function RestrictedMailNotice({ output }: { output?: string }) {
	const result = resultRecord(parseToolResult(output));
	const diagnostic = diagnosticSchema.safeParse(result?.restrictedMail);
	if (!diagnostic.success) {
		return (
			<Alert>
				<AlertCircle aria-hidden="true" />
				<AlertDescription>
					Restricted-mail details are unavailable. The search result
					may be incomplete or the server may not have supplied them.
				</AlertDescription>
			</Alert>
		);
	}

	const { status, note, items } = diagnostic.data;
	const coverage = {
		searched:
			"The restriction check is best-effort and may miss some emails.",
		partial:
			"The restriction check was incomplete and may have missed emails.",
		unavailable: "The restriction check was unavailable.",
		not_searched: "The restriction check was not performed.",
	}[status];
	return (
		<Alert>
			<AlertCircle aria-hidden="true" />
			<AlertDescription className="min-w-0 space-y-2">
				<P className="text-sm">
					{items.length
						? `${items.length} restricted ${items.length === 1 ? "email was" : "emails were"} reported.`
						: "No restricted emails were reported."}
				</P>
				<P className="text-sm">{coverage}</P>
				{note?.trim() && (
					<P className="wrap-anywhere text-sm">{note}</P>
				)}
				{items.length > 0 && (
					<Dialog>
						<DialogTrigger asChild>
							<Button type="button" size="sm" variant="outline">
								View Restrictions
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Restricted Mail</DialogTitle>
								<DialogDescription>
									These are the restricted matches reported by
									this search. {coverage}
								</DialogDescription>
							</DialogHeader>
							<ul className="min-w-0 space-y-3">
								{items.map((item, index) => (
									<li
										// A message can have more than one reported restriction.
										key={`${item.messageId}-${item.code}-${index}`}
										className="min-w-0 border-border border-b pb-3 last:border-0"
									>
										<P className="wrap-anywhere font-medium text-sm">
											{item.code !== "NEVER_INGEST" &&
											item.subject?.trim()
												? item.subject
												: "Restricted email"}
										</P>
										<P className="wrap-anywhere text-sm">
											{item.message}
										</P>
										<Muted className="block text-sm">
											{item.topicMatch === "linked"
												? "Linked to the searched topic."
												: item.topicMatch === "unknown"
													? "Its connection to the searched topic is unknown."
													: "This search was not scoped to a topic."}
										</Muted>
									</li>
								))}
							</ul>
						</DialogContent>
					</Dialog>
				)}
			</AlertDescription>
		</Alert>
	);
}
