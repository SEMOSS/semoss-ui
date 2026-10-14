import { toast } from "@semoss/ui/next";
import { safeSourceUrl } from "../api/microsoft";
import type { SavedEmailDraft } from "../types";

const OUTLOOK_DRAFTS_URL = "https://outlook.office.com/mail/drafts";

/** Announces a successful draft save while retaining quick Outlook access. */
export function showEmailDraftSavedToast(saved: SavedEmailDraft): void {
	const href = safeSourceUrl(saved.webLink) ?? OUTLOOK_DRAFTS_URL;
	toast.success("Draft saved to Outlook", {
		description: "Nothing was sent.",
		action: {
			label: "Open in Outlook",
			onClick: () => {
				window.open(href, "_blank", "noopener,noreferrer");
			},
		},
	});
}
