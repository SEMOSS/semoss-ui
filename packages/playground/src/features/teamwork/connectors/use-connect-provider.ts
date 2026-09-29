import { useCallback } from "react";
import { useTranslation } from "@semoss/i18n";
import { toast } from "@semoss/ui/next";
import type { ConnectorProviderId } from "./connector.catalog";
import { PopupBlockedError } from "./connectors.api";
import type { UseConnectionsResult } from "./use-connections";

/**
 * A click handler that signs in to a provider and tells the user how it went:
 * connected, closed before finishing, or blocked by the browser.
 *
 * @param connect - `connect` from {@link useConnections}.
 * @return The handler. It starts the popup synchronously, so call it from the
 * click itself.
 */
export const useConnectProvider = (
	connect: UseConnectionsResult["connect"],
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
									message:
										error instanceof Error
											? error.message
											: "",
								}),
					);
				},
			);
		},
		[connect, t],
	);
};
