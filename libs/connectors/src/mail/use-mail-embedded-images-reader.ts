import { useCallback } from "react";
import { useTranslation } from "@semoss/i18n";
import { useInsight } from "@semoss/sdk/react";
import { runConnectorPixel } from "../core/connector-pixel";
import { parseMailMessageDetail } from "./mail.parsers";
import type { MailEmbeddedImages } from "./mail.types";
import type { MailApp } from "./mail-apps";

/**
 * How to read the pictures one email embeds, for when the reader shows them:
 * the email is read again from its mailbox, with its formatted body and the
 * pictures that body names.
 *
 * @param app - The mailbox the email is in.
 * @param messageId - The email.
 * @return Reads the pictures. It stays the same function while the email and
 * the insight do, so a view reads them once.
 */
export const useMailEmbeddedImagesReader = (
	app: MailApp,
	messageId: string,
): (() => Promise<MailEmbeddedImages>) => {
	const { t } = useTranslation("connectors");
	const { insightId } = useInsight();
	const noInsightMessage = t("errors.noInsight");
	return useCallback(async () => {
		if (!insightId) {
			throw new Error(noInsightMessage);
		}
		const { displayBody } = parseMailMessageDetail(
			await runConnectorPixel(
				app.pixels.getMail(messageId, {
					includeDisplayBody: true,
					includeInlineImages: true,
				}),
				insightId,
			),
		);
		return {
			images: displayBody?.inlineImages ?? [],
			omitted: displayBody?.inlineImagesOmitted ?? 0,
		};
	}, [app, insightId, messageId, noInsightMessage]);
};
