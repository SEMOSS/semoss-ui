import {
	type ConnectorSavedFile,
	type ConnectorSavedItems,
	MailboxView,
	OneDriveViewer,
	TeamsChatViewer,
	TeamsFilesViewer,
} from "@semoss/connectors";
import { toast } from "@semoss/ui/next";
import { connectMicrosoft } from "@/features/connectors/api/microsoft";
import type { TwinSourceId } from "./twin-sources";

interface TwinSourceViewerProps {
	/** The owner's place to pick from. */
	source: TwinSourceId;
	/** What the owner already put in: its rows say so in place of offering it again. */
	savedItems: ConnectorSavedItems;
	/** Takes an item once its viewer has saved it into the page's files. */
	onSaved: (file: ConnectorSavedFile) => void;
}

/**
 * One of the owner's own places, as its real viewer, to pick a twin's
 * knowledge from. Each row saves with "Save to Digital Twin", in the owner's
 * own signed-in session; what happens to the saved file is the host's, and
 * so is which rows are marked as already put in.
 */
export function TwinSourceViewer({
	source,
	savedItems,
	onSaved,
}: TwinSourceViewerProps) {
	const handleSignIn = async (): Promise<boolean> => {
		try {
			// called before the first await, so the sign in window opens inside the click
			await connectMicrosoft();
			return true;
		} catch (cause) {
			toast.error("Could not sign in to Microsoft 365.", {
				description: cause instanceof Error ? cause.message : undefined,
			});
			return false;
		}
	};
	// the host names the place above the viewer, so the viewer leaves its own header out
	const host = {
		saveTargetName: "Digital Twin",
		showHeader: false,
		savedItems,
		onSaved,
		onSignIn: handleSignIn,
	};
	switch (source) {
		case "outlook":
			return <MailboxView provider="microsoft" {...host} />;
		case "teams-chats":
			return <TeamsChatViewer {...host} />;
		case "onedrive":
			return <OneDriveViewer {...host} />;
		default:
			return <TeamsFilesViewer {...host} />;
	}
}
