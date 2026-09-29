import { FileIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useTranslation } from "@semoss/i18n";
import { FilePreviewTile } from "@/components/common/file-preview-tile";
import { findConnectorSource } from "../sources/connector-sources";
import type { TeamworkStore } from "../teamwork.store";

/** Props for {@link TeamworkContextItems}. */
export interface TeamworkContextItemsProps {
	/** The room's teamwork state. */
	teamwork: TeamworkStore;
}

/**
 * The files a viewer added to context, shown with the input's attachments
 * until the next message takes them: a named chip for each, marked with the
 * app it came from. Each can be taken off;
 * it stays in the chat's files. Renders nothing when none are waiting.
 */
export const TeamworkContextItems = observer(
	({ teamwork }: TeamworkContextItemsProps) => {
		const { t } = useTranslation("teamwork");

		return teamwork.contextItems.map((item) => {
			const Icon = findConnectorSource(item.service)?.icon ?? FileIcon;
			return (
				<FilePreviewTile
					key={item.id}
					name={item.name}
					detail={t("context.label")}
					badge={<Icon aria-hidden className="size-3" />}
					removeLabel={t("context.remove", { name: item.name })}
					onRemove={() => teamwork.removeContextItem(item.id)}
				/>
			);
		});
	},
);
