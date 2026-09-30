import { useMemo } from "react";
import { useTranslation } from "@semoss/i18n";
import { Markdown, Muted } from "@semoss/ui/next";
import { toMarkdownText } from "../core/connector-rich-text";

/** Props for {@link ConnectorTextBody}. */
export interface ConnectorTextBodyProps {
	/** The text, as the backend read it. */
	text?: string;
	/** Whether the backend cut the text short. */
	isTruncated?: boolean;
	/** Shown when there is no text. */
	emptyText: string;
}

/**
 * The text of an email, message, or event, shown the way its saved file
 * reads: the same Markdown, so its paragraphs and line breaks, dividers,
 * lists, and links look alike in both.
 */
export const ConnectorTextBody = ({
	text,
	isTruncated = false,
	emptyText,
}: ConnectorTextBodyProps) => {
	const { t } = useTranslation("connectors");
	const markdown = useMemo(() => toMarkdownText(text ?? ""), [text]);

	return (
		<div className="flex flex-col gap-3">
			{markdown ? (
				// wrap-anywhere breaks long links and addresses, which
				// break-words cannot shrink to the panel's width
				<Markdown variant="document" className="wrap-anywhere text-sm">
					{markdown}
				</Markdown>
			) : (
				<Muted>{emptyText}</Muted>
			)}
			{isTruncated ? <Muted>{t("common.truncated")}</Muted> : null}
		</div>
	);
};
