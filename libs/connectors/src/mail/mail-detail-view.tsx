import type {
	ConnectorAccount,
	ConnectorViewerProps,
} from "../core/connector.types";
import { useConnectorSaver } from "../core/use-connector-saver";
import type { MailConversation } from "./mail.threads";
import type { MailMessage } from "./mail.types";
import { MAIL_APPS } from "./mail-apps";
import { MailMessageView } from "./mail-message-view";
import { MailThreadView } from "./mail-thread-view";

/** A provider-bound item opened from a mailbox, including its focus origin. */
export type MailSelection = {
	provider: ConnectorAccount;
	itemKey: string;
	folderName: string;
} & (
	| { kind: "message"; message: MailMessage }
	| {
			kind: "thread";
			conversation: MailConversation & { conversationId: string };
	  }
);

/** Props for a host-owned, retained mail detail. */
export interface MailDetailViewProps extends ConnectorViewerProps {
	/** Captures the item and account selected in the originating browser. */
	selection: MailSelection;
	/** Reveals the originating browser without closing this retained detail. */
	onBack?: () => void;
	/** Changes for each explicit open or reopen so heading focus is restored. */
	focusRequestId?: number;
}

/** Render a retained message or thread using its originating account and insight. */
export const MailDetailView = ({
	selection,
	onBack,
	focusRequestId,
	...host
}: MailDetailViewProps) => {
	const app = MAIL_APPS[selection.provider];
	const saver = useConnectorSaver(app.service, host);
	const props = {
		app,
		saver,
		onBack,
		folderName: selection.folderName,
		onSignIn: host.onSignIn,
		onControlsChange: host.onControlsChange,
		isVisible: host.isVisible,
		focusRequestId,
	};
	return selection.kind === "thread" ? (
		<MailThreadView {...props} conversation={selection.conversation} />
	) : (
		<MailMessageView {...props} summary={selection.message} />
	);
};
