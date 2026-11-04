import { observer } from "mobx-react-lite";
import type React from "react";
import { useTranslation } from "@semoss/i18n";
import { logout } from "@semoss/sdk/react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";
import { useRoot } from "@/hooks";

/**
 * Perform the real logout (Monolith's /api/auth/logout/all — session teardown,
 * cookie expiry, registerLogout) then reload unconditionally. The reload is
 * what discards the stale module-level CSRF token and lets the app bootstrap
 * against a clean, logged-out session, so it has to run even if logout()
 * itself fails — a user stuck behind a broken button is the exact failure
 * this dialog exists to remove.
 */
const acknowledgeAndSignOut = async (): Promise<void> => {
	try {
		await logout();
	} catch (e) {
		console.error("Failed to log out after a guardrail revocation", e);
	} finally {
		window.location.reload();
	}
};

/**
 * Non-dismissible notice shown when a guardrail block has marked the session
 * pending revocation (see registerSessionRevokedHandler in @semoss/sdk). The
 * session is deliberately still technically alive at this point — see
 * markPendingRevocation on the backend — so there's nothing to close back
 * into; the only action performs the real logout and reloads, which lets the
 * server's own redirect (whatever login page or custom logout URL the
 * deployment is configured with) take over.
 */
export const SessionRevokedDialog: React.FC = observer(() => {
	const { t } = useTranslation("common");
	const { root } = useRoot();
	const { revoked, message } = root.sessionRevoked;

	if (!revoked) {
		return null;
	}

	return (
		<Dialog open={revoked}>
			<DialogContent
				showCloseButton={false}
				onEscapeKeyDown={(e) => e.preventDefault()}
				onInteractOutside={(e) => e.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle>{t("sessionRevoked.title")}</DialogTitle>
				</DialogHeader>
				<p>{t("sessionRevoked.body")}</p>
				{message ? (
					<p className="text-muted-foreground text-sm">{message}</p>
				) : null}
				<DialogFooter>
					<Button variant="default" onClick={acknowledgeAndSignOut}>
						{t("sessionRevoked.action")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
});
