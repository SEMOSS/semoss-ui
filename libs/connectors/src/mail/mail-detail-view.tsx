import { useCallback } from "react";
import { useTranslation } from "@semoss/i18n";
import type {
	ConnectorAccount,
	ConnectorViewerProps,
} from "../core/connector.types";
import { useConnectorSaver } from "../core/use-connector-saver";
import { MAIL_APPS } from "./mail-apps";
import type { MailItemSelection } from "./mail-item-selection";
import { MailMessageView } from "./mail-message-view";
import { MailThreadView } from "./mail-thread-view";

/** Actions and metadata a host can show for the selected mail. */
export interface MailDetailViewControls {
	/** The account that owns the selected mail. */
	provider: ConnectorAccount;
	/** Whether the selection is one message or a conversation. */
	kind: "message" | "thread";
	/** The selected provider message or conversation identifier. */
	itemId: string;
	/** The loaded message's link, absent until a matching item is available. */
	webUrl?: string;
	/** Localized name of the external app. */
	appName: string;
}

/** Props for {@link MailDetailView}. */
export interface MailDetailViewProps extends ConnectorViewerProps {
	/** The account that owns the selected mail. */
	provider: ConnectorAccount;
	/** The item chosen in a mailbox browser. */
	selection: MailItemSelection;
	/** Returns to the browser; the host restores focus to `selection.itemKey`. */
	onBack?: () => void;
	/** Publishes loaded-item controls. Keep this callback identity stable. */
	onControls?: (controls: MailDetailViewControls) => void;
	/** Overrides inline Open visibility; omitted keeps each viewer's behavior. */
	showOpenIn?: boolean;
}

/** Reads a selected message or thread in a host's own detail panel. */
export const MailDetailView = (props: MailDetailViewProps) => {
	const { provider, selection, onBack, onSignIn, onControls, showOpenIn } =
		props;
	const { t } = useTranslation("connectors");
	const app = MAIL_APPS[provider];
	const saver = useConnectorSaver(app.service, props);
	const appName = t(app.appNameKey);
	const { kind, id: itemId } = selection;
	const publishWebUrl = useCallback(
		(webUrl: string | undefined) => {
			onControls?.({ provider, kind, itemId, webUrl, appName });
		},
		[provider, kind, itemId, appName, onControls],
	);

	return selection.kind === "thread" ? (
		<MailThreadView
			key={selection.itemKey}
			app={app}
			conversation={{
				...selection.summary,
				key: selection.itemKey,
				conversationId: selection.id,
			}}
			folderName={selection.folderName}
			saver={saver}
			onSignIn={onSignIn}
			onBack={onBack}
			onWebUrlChange={publishWebUrl}
			showOpenIn={showOpenIn}
		/>
	) : (
		<MailMessageView
			key={selection.itemKey}
			app={app}
			summary={{ ...selection.summary.latest, id: selection.id }}
			folderName={selection.folderName}
			saver={saver}
			onSignIn={onSignIn}
			onBack={onBack}
			onWebUrlChange={publishWebUrl}
			showOpenIn={showOpenIn}
		/>
	);
};
