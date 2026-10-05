import { FileIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useTranslation } from "@semoss/i18n";
import { ConnectorBrandIcon } from "@semoss/shared";
import { FilePreviewTile } from "@/components/common/file-preview-tile";
import { findConnectorSource } from "@/features/connectors/sources/connector-sources";
import type { ContextItemsStore } from "./context-items.store";

/** Props for {@link ContextItems}. */
export interface ContextItemsProps {
	/** The room's queue for its next message. */
	contextItems: ContextItemsStore;
}

/**
 * The files added to context, shown with the input's attachments until the
 * next message takes them: a named chip for each, marked with the app it came
 * from. Each can be taken off; it stays in the chat's files. Renders nothing when none are waiting.
 */
export const ContextItems = observer(({ contextItems }: ContextItemsProps) => {
	const { t } = useTranslation("room");

	return contextItems.items.map((item) => {
		const brand = item.service
			? findConnectorSource(item.service)?.brand
			: undefined;
		return (
			<FilePreviewTile
				key={item.id}
				name={item.name}
				detail={t("contextItems.label")}
				badge={
					brand ? (
						<ConnectorBrandIcon brand={brand} className="size-3" />
					) : (
						<FileIcon aria-hidden className="size-3" />
					)
				}
				removeLabel={t("contextItems.remove", { name: item.name })}
				onRemove={() => contextItems.remove(item.id)}
			/>
		);
	});
});
