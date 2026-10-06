import { Button } from "@semoss/ui/next";
import { safeSourceUrl } from "../api/microsoft";

interface OutlookDraftLinkProps {
	/** The saved draft's provider URL, never the original email's URL. */
	webLink?: string;
}

/** Opens an existing draft, or its Outlook folder when no usable link was returned. */
export function OutlookDraftLink({ webLink }: OutlookDraftLinkProps) {
	const href = safeSourceUrl(webLink);
	return (
		<Button
			asChild
			variant="link"
			size="sm"
			className="h-auto min-h-8 max-w-full whitespace-normal text-left"
		>
			<a
				href={href ?? "https://outlook.office.com/mail/drafts"}
				target="_blank"
				rel="noopener noreferrer"
			>
				{href ? "Open draft in Outlook" : "Open Outlook drafts folder"}
			</a>
		</Button>
	);
}
