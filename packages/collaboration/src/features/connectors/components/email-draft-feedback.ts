import { toast } from "@semoss/ui/next";
import { safeSourceUrl } from "../api/microsoft";
import type { SavedEmailDraft } from "../types";

const OUTLOOK_DRAFTS_URL = "https://outlook.office.com/mail/drafts";

type EmailDraftFailureToastOptions =
	| { isUncertain: false }
	| { isUncertain: true; onConfirmRetry: () => void };

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

/** Announces a failed save and requires confirmation before an uncertain retry. */
export function showEmailDraftFailureToast(
	message: string,
	options: EmailDraftFailureToastOptions,
): void {
	if (!options.isUncertain) {
		toast.error(message);
		return;
	}
	let toastId: string | number;
	toastId = toast.warning("The draft save could not be confirmed", {
		description: `${message} Check Outlook before retrying.`,
		duration: Number.POSITIVE_INFINITY,
		dismissible: false,
		action: {
			label: "I checked Outlook—retry",
			onClick: () => {
				toast.dismiss(toastId);
				options.onConfirmRetry();
			},
		},
	});
}
