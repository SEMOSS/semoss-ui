/** A file in the user's Google Drive, as `GoogleDriveList` lists it. */
export interface GoogleDriveFile {
	id: string;
	name: string;
	/** Google's type, such as `application/vnd.google-apps.document`. */
	mimeType?: string;
}

/** A Google Doc as `GoogleDocsList` lists it. */
export interface GoogleDoc {
	id: string;
	title: string;
}

/** A Google Doc's text, as `GoogleDocsRead` reads it. */
export interface GoogleDocContent {
	title: string;
	/** The document's paragraphs as plain text; tables and headers are left out. */
	content: string;
}
