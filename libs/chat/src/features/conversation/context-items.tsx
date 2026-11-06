import { FileIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import type { ContextItemsStore } from "@semoss/sdk";
import { useObservableStore } from "@semoss/sdk/react";
import { FilePreviewTile } from "../../components/file-preview/file-preview-tile";
import type { RoomIntegration } from "../../host/room-integration";

/** Props for {@link ContextItems}. */
export interface ContextItemsProps {
	/** The room's queue for its next message. */
	contextItems: ContextItemsStore;
	/** The room's integrations, which mark the items they produced. */
	integrations?: readonly RoomIntegration[];
}

/**
 * The files added to context, shown with the input's attachments until the
 * next message takes them: a named chip for each, marked with the app it came
 * from. Each can be taken off; it stays in the chat's files. Renders nothing when none are waiting.
 */
export const ContextItems = ({
	contextItems,
	integrations = [],
}: ContextItemsProps) => {
	const { t } = useTranslation("room");

	const items = useObservableStore(contextItems, (store) => store.items, []);
	return items.map((item) => {
		const { service } = item;
		const icon = service
			? integrations
					.map((integration) =>
						integration.getContextItemIcon?.(service),
					)
					.find((candidate) => candidate !== undefined)
			: undefined;
		return (
			<FilePreviewTile
				key={item.id}
				name={item.name}
				detail={t("contextItems.label")}
				badge={icon ?? <FileIcon aria-hidden className="size-3" />}
				removeLabel={t("contextItems.remove", { name: item.name })}
				onRemove={() => contextItems.remove(item.id)}
			/>
		);
	});
};
