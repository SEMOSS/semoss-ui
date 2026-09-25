/** Supported lookback windows for a bounded Outlook header search. */
export const MAIL_DATE_RANGES = { "1": 1, "7": 7, "30": 30, "90": 90 } as const;
export type MailDateRange =
	(typeof MAIL_DATE_RANGES)[keyof typeof MAIL_DATE_RANGES];

/** One explicit email search shared by the form, source loader, and adapter. */
export interface MailSearchFilters {
	folder: string;
	subject: string;
	from: string;
	unreadOnly: boolean;
	sinceDays: MailDateRange;
}

/** A provider participant; absent addresses and identities are never invented. */
export interface SourceParticipant {
	nativeId?: string;
	name?: string;
	address?: string;
	role: string;
}

/** One selected source message, retained only in the current application session. */
export interface SourceMessage {
	id: string;
	text: string;
	senderId?: string;
	senderName?: string;
	senderAddress?: string;
	at?: string;
	isTruncated?: boolean;
}

/** Native attachment metadata; download is a separate, explicit operation. */
export interface SourceAttachment {
	id: string;
	name: string;
	contentType?: string;
	size?: number;
	isFile: boolean;
	isInline?: boolean;
}

/** Validated source content delivered to the shared Work/Brain session. */
export interface ImportedSource {
	sourceKind: "outlook" | "teams" | "calendar";
	nativeId: string;
	title: string;
	body: string;
	messages: SourceMessage[];
	participants: SourceParticipant[];
	receivedAt?: string;
	attachments: SourceAttachment[];
	sourceUrl?: string;
	folder?: string;
	isTruncated?: boolean;
}

/** File staged by Microsoft into the active SEMOSS insight. */
export interface StagedSourceAttachment {
	insightId: string;
	filePath: string;
	name: string;
	size: number;
	attachmentId: string;
	sourceUid: string;
}

/** Verified identity of a newly created Outlook draft. */
export interface SavedEmailDraft {
	savedDraftId: string;
	webLink?: string;
}

/** Inputs supported by existing Outlook draft reactors. */
export type EmailDraftInput =
	| {
			mode: "new";
			to: string;
			cc: string;
			bcc: string;
			subject: string;
			body: string;
			attachments?: string[];
	  }
	| { mode: "reply"; sourceUid: string; body: string; replyAll: boolean }
	| { mode: "forward"; sourceUid: string; to: string; body: string };
