import { useTranslation } from "@semoss/i18n";
import { ConnectorActionBar } from "../../components/connector-action-bar";
import { ConnectorDetailView } from "../../components/connector-detail-view";
import { ConnectorTextBody } from "../../components/connector-text-body";
import { ConnectorViewerStatus } from "../../components/connector-viewer-status";
import { useConnectorQuery } from "../../core/use-connector-query";
import type {
	ConnectorSaveRequest,
	ConnectorSaver,
} from "../../core/use-connector-saver";
import {
	googleDocFileName,
	googleDocToMarkdown,
	toGoogleDocText,
} from "../google.markdown";
import { parseGoogleDocContent } from "../google.parsers";
import {
	GOOGLE_DOC_MIME_TYPE,
	GOOGLE_PIXELS,
	getDriveFileUrl,
} from "../google.pixels";
import type { GoogleDoc, GoogleDocContent } from "../google.types";

/** Props for {@link GoogleDocDetail}. */
export interface GoogleDocDetailProps {
	/** The document as the list showed it. */
	doc: GoogleDoc;
	/** Saves the document's text into the insight. */
	saver: ConnectorSaver;
	/** Goes back to the list. */
	onBack: () => void;
	/** Starts the sign in, when the host offers one. */
	onSignIn?: () => Promise<boolean>;
}

/**
 * One Google Doc's text. The backend reads its paragraphs; tables, headers,
 * and footnotes are left out.
 */
export const GoogleDocDetail = ({
	doc,
	saver,
	onBack,
	onSignIn,
}: GoogleDocDetailProps) => {
	const { t } = useTranslation("connectors");
	const query = useConnectorQuery(
		GOOGLE_PIXELS.docsRead(doc.id),
		parseGoogleDocContent,
	);
	const content = query.data;
	const serviceName = t("services.googleDocs");
	const link = getDriveFileUrl(doc.id, GOOGLE_DOC_MIME_TYPE);

	const request = (full: GoogleDocContent): ConnectorSaveRequest => ({
		key: doc.id,
		name: doc.title,
		source: {
			kind: "text",
			fileName: googleDocFileName(full.title || doc.title),
			getContent: () => googleDocToMarkdown(full, link),
		},
	});

	return (
		<ConnectorDetailView
			title={content?.title || doc.title}
			backLabel={t("googleDocs.back")}
			onBack={onBack}
			actions={
				content ? (
					<ConnectorActionBar
						serviceName={serviceName}
						saveLabel={saver.saveLabel}
						webUrl={link}
						isBusy={saver.isBusy(doc.id)}
						onAddToContext={
							saver.addToContext
								? () => saver.addToContext?.(request(content))
								: undefined
						}
						onSave={() => saver.save(request(content))}
					/>
				) : null
			}
		>
			{content ? (
				<ConnectorTextBody
					text={toGoogleDocText(content.content)}
					emptyText={t("googleDocs.noText")}
				/>
			) : (
				<ConnectorViewerStatus
					query={query}
					serviceName={serviceName}
					account="google"
					onSignIn={onSignIn}
					skeletonRows={5}
				/>
			)}
		</ConnectorDetailView>
	);
};
