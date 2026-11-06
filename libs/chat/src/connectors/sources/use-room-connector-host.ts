import { useCallback } from "react";
import type { ConnectorViewerProps } from "@semoss/connectors";
import { getI18n } from "@semoss/i18n";
import { PopupBlockedError } from "@semoss/sdk";
import { toast } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import {
	type RoomFileHost,
	useRoomFileHost,
} from "../../features/tool-views/use-room-file-host";
import {
	type ConnectorProviderId,
	getConnectorProvider,
} from "../connector.catalog";
import { signInToProvider } from "../connector-sign-in";

/** What the room gives a connector viewer, or a connector's tool view. */
export type RoomConnectorHost = Omit<
	ConnectorViewerProps,
	"onSaved" | "onAddToContext" | "saveTargetName"
> &
	RoomFileHost;

/**
 * Sign in to a connector account in a popup, saying how it went. Runs inside
 * a click: it opens the popup before its first await.
 *
 * @param providerId - The account to sign in to.
 * @returns Whether the account is connected afterwards.
 */
export const signInToProviderWithNotice = async (
	providerId: ConnectorProviderId,
): Promise<boolean> => {
	const t = getI18n().t;
	const provider = getConnectorProvider(providerId);
	const name = t(`chatConnectors:providers.${provider.id}.name`);
	// no await before this call: the popup has to open inside the click
	const attempt = signInToProvider(providerId);
	try {
		const isConnected = await attempt;
		if (!isConnected) {
			toast.info(
				t("chatConnectors:providers.connectIncomplete", { name: name }),
			);
		}
		return isConnected;
	} catch (error) {
		toast.error(
			error instanceof PopupBlockedError
				? t("chatConnectors:providers.popupBlocked")
				: t("chatConnectors:providers.connectError", {
						name: name,
						message: getErrorMessage(error, ""),
					}),
		);
		return false;
	}
};

/**
 * What the room gives a connector viewer in its sidebar: the room's file
 * host ({@link useRoomFileHost}), and signing in, which links the viewer's
 * account to the session in a popup.
 *
 * @param providerId - The account the viewer reads with.
 * @return The viewer's host props.
 */
export const useRoomConnectorHost = (
	providerId: ConnectorProviderId,
): RoomConnectorHost => {
	const fileHost = useRoomFileHost();
	const onSignIn = useCallback(
		() => signInToProviderWithNotice(providerId),
		[providerId],
	);
	return { ...fileHost, onSignIn: onSignIn };
};
