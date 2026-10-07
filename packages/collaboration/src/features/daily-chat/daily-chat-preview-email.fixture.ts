import type { OutlookMail } from "@/features/connectors/api/microsoft-schemas";
import type { ReplyRecipients } from "@/features/connectors/api/reply-recipients";
import type { RoomSource } from "@/features/rooms/source-import/room-source";

const PREVIEW_EMAIL_UID = "preview-source-email";
const PREVIEW_EMAIL_SUBJECT = "Northwind renewal — pricing and review";
const PREVIEW_EMAIL_DATE = "2026-10-07T13:30:00Z";

/** Synthetic Outlook response, including the separate reply-envelope read. */
export const previewSourceEmail: OutlookMail & {
	replyRecipients: ReplyRecipients;
} = {
	uid: PREVIEW_EMAIL_UID,
	messageId: "preview-source-email@example.invalid",
	from: "Carla Jimenez <carla.jimenez@example.invalid>",
	to: "Riley Warren <fixture@example.invalid>",
	cc: "Dana Osei <dana.osei@example.invalid>",
	subject: PREVIEW_EMAIL_SUBJECT,
	sentDate: PREVIEW_EMAIL_DATE,
	receivedDate: PREVIEW_EMAIL_DATE,
	unread: false,
	hasAttachments: false,
	attachments: [],
	body: "Hi Riley,\n\nAhead of the Northwind renewal call, please confirm the pricing options and who will lead the architecture review.\n\nPricing options: ready for review.\nArchitecture review: owner needed.\n\nCould you send your recommendation by Thursday?\n\nThanks,\nCarla",
	displayBody: {
		contentType: "html",
		content:
			"<p>Hi Riley,</p><p>Ahead of the <strong>Northwind renewal call</strong>, please confirm the pricing options and who will lead the architecture review.</p><table><thead><tr><th>Topic</th><th>Status</th></tr></thead><tbody><tr><td>Pricing options</td><td>Ready for review</td></tr><tr><td>Architecture review</td><td>Owner needed</td></tr></tbody></table><p>Could you send your recommendation by <strong>Thursday</strong>?</p><p>Thanks,<br>Carla</p>",
		attachments: [],
	},
	replyRecipients: {
		to: ["carla.jimenez@example.invalid"],
		cc: ["dana.osei@example.invalid"],
	},
};

/** The room keeps only identities and envelope metadata alongside its saved file. */
export const previewEmailRoomSource: RoomSource = {
	version: 1,
	threadId: "outlook:preview-source-email",
	title: PREVIEW_EMAIL_SUBJECT,
	channel: "email",
	kind: "outlook",
	nativeId: PREVIEW_EMAIL_UID,
	file: {
		fileLocation: "preview/northwind-renewal.md",
		fileName: "Northwind renewal.md",
	},
	messages: [
		{
			id: PREVIEW_EMAIL_UID,
			subject: PREVIEW_EMAIL_SUBJECT,
			fromName: "Carla Jimenez",
			fromAddress: "carla.jimenez@example.invalid",
			to: ["fixture@example.invalid"],
			cc: ["dana.osei@example.invalid"],
			at: PREVIEW_EMAIL_DATE,
		},
	],
};

/** A preview may read its sample email, but no other Pixel is executed. */
export function readPreviewSourceEmail(
	statement: string,
): typeof previewSourceEmail {
	if (
		!/^MicrosoftOutlookGetMail\([^;]*\);$/.test(statement) ||
		!statement.includes(`uid=["${PREVIEW_EMAIL_UID}"]`)
	)
		throw new Error(
			"This preview does not contact Outlook or save or send email.",
		);
	return structuredClone(previewSourceEmail);
}

/**
 * SDK usePixel and attachment uploads bypass Insight.actions. In this dedicated
 * preview, answer only the sample Outlook read and keep every backend call local.
 */
export function installEmailPreviewTransport(): () => void {
	const originalFetch = window.fetch;
	const previewFetch: typeof window.fetch = async (input, init) => {
		const url = new URL(
			input instanceof Request ? input.url : String(input),
			window.location.href,
		);
		if (!/\/api(?:\/|$)/.test(url.pathname))
			return originalFetch.call(window, input, init);
		try {
			if (!url.pathname.endsWith("/api/engine/runPixel"))
				throw new Error(
					"This preview does not upload files or contact the backend.",
				);
			const body =
				init?.body ??
				(input instanceof Request ? await input.clone().text() : "");
			const params = new URLSearchParams(
				typeof body === "string" || body instanceof URLSearchParams
					? body
					: "",
			);
			const statement = params.get("expression") ?? "";
			const output = readPreviewSourceEmail(statement);
			return Response.json({
				insightID: "preview-email-insight",
				pixelReturn: [
					{
						output,
						operationType: [],
						isMeta: false,
						pixelExpression: statement,
						pixelId: "preview-source-email",
						timeToRun: 0,
					},
				],
			});
		} catch (cause) {
			return Response.json(
				{
					message:
						cause instanceof Error
							? cause.message
							: "Preview request unavailable.",
				},
				{ status: 403 },
			);
		}
	};
	window.fetch = previewFetch;
	return () => {
		if (window.fetch === previewFetch) window.fetch = originalFetch;
	};
}

// Install before children mount their SDK hooks; this module is fixture-only.
if (
	import.meta.env.DEV &&
	typeof window !== "undefined" &&
	new URLSearchParams(window.location.search).get("chatState") === "email"
) {
	const restore = installEmailPreviewTransport();
	import.meta.hot?.dispose(restore);
}
