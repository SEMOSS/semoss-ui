import { useCallback } from "react";
import { useTranslation } from "@semoss/i18n";
import { PopupBlockedError } from "@semoss/sdk";
import { toast } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import type { ConnectorProviderId } from "./connector.catalog";
import type { UseConnectionsResult } from "./use-connections";

/**
 * A click handler that signs in to a provider and tells the user how it went:
 * connected, closed before finishing, or blocked by the browser.
 *
 * @param connect - Signs in to a provider from the click: `signInToProvider`,
 * or `connect` from {@link useConnections}.
 * @param onConnected - Called once a provider is connected, after the toast.
 * @return The handler. It starts the popup synchronously, so call it from the
 * click itself.
 */
export const useConnectProvider = (
	connect: UseConnectionsResult["connect"],
	onConnected?: (providerId: ConnectorProviderId) => void,
): ((providerId: ConnectorProviderId) => void) => {
	const { t } = useTranslation("teamwork");

	return useCallback(
		(providerId: ConnectorProviderId) => {
			const name = t(`providers.${providerId}.name`);
			connect(providerId).then(
				(isConnected) => {
					if (isConnected) {
						toast.success(
							t("providers.connectSuccess", { name: name }),
						);
						onConnected?.(providerId);
					} else {
						toast.info(
							t("providers.connectIncomplete", { name: name }),
						);
					}
				},
				(error: unknown) => {
					toast.error(
						error instanceof PopupBlockedError
							? t("providers.popupBlocked")
							: t("providers.connectError", {
									name: name,
									message: getErrorMessage(error, ""),
								}),
					);
				},
			);
		},
		[connect, onConnected, t],
	);
};
