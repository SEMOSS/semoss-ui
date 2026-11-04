import { ChevronDownIcon } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	cn,
	Popover,
	PopoverContent,
	PopoverTrigger,
	TreeView,
	TreeViewItem,
} from "@semoss/ui/next";
import {
	buildMailFolderTree,
	INBOX,
	type MailFolderNode,
} from "./mail.folders";
import type { MailFolder } from "./mail.types";

/** Props for {@link MailFolderPicker}. */
export interface MailFolderPickerProps {
	/** The mailbox's folders, each right after the one it sits in. */
	folders: MailFolder[];
	/** The id of the folder being read. */
	value: string;
	/** What the folder being read is called, shown on the closed picker. */
	label: string;
	/** Called with the id of the folder the user picks. */
	onValueChange: (folderId: string) => void;
}

/**
 * The folder a mailbox is read from, picked from its folder tree the way a
 * mail app shows it: a folder that holds others opens and closes with its
 * chevron, the inbox starts open, and each folder shows how many of its
 * emails nobody has opened. Picking a folder, nested or not, reads it and
 * closes the tree.
 */
export const MailFolderPicker = ({
	folders,
	value,
	label,
	onValueChange,
}: MailFolderPickerProps) => {
	const { t } = useTranslation("connectors");
	const [isOpen, setIsOpen] = useState(false);
	const treeId = useId();
	const [expanded, setExpanded] = useState<string[]>(() => [
		`${treeId}-${INBOX}`,
	]);
	const tree = buildMailFolderTree(folders);

	/**
	 * Read the folder picked, and close the tree.
	 *
	 * @param folder - The folder.
	 */
	const handleSelect = (folder: MailFolder) => {
		onValueChange(folder.id);
		setIsOpen(false);
	};

	/**
	 * The tree's items for one level of folders, each holding its own.
	 *
	 * @param nodes - The folders of the level.
	 * @return The items.
	 */
	const renderLevel = (nodes: MailFolderNode[]): ReactNode =>
		nodes.map(({ folder, children }) => {
			const isSelected = folder.id === value;
			const unread = folder.unreadCount ?? 0;
			return (
				<TreeViewItem
					key={folder.id}
					id={`${treeId}-${folder.id}`}
					item={folder}
					aria-selected={isSelected}
					rowClassName={cn(
						isSelected && "bg-accent text-accent-foreground",
					)}
					label={
						<span className="flex min-w-0 items-center justify-between gap-2 text-sm">
							<span
								className={cn(
									"truncate",
									unread > 0 && "font-medium",
								)}
							>
								{folder.name}
							</span>
							{unread > 0 ? (
								<span className="shrink-0 font-medium text-primary text-xs">
									<span aria-hidden>{unread}</span>
									<span className="sr-only">
										{t("mail.unreadCount", {
											count: unread,
										})}
									</span>
								</span>
							) : null}
						</span>
					}
				>
					{children.length > 0 ? renderLevel(children) : null}
				</TreeViewItem>
			);
		});

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="h-8 min-w-24 max-w-full flex-1 justify-between gap-2 bg-background px-3 font-normal shadow-none"
					aria-label={t("mail.folderPicker", { folder: label })}
				>
					<span className="truncate">{label}</span>
					<ChevronDownIcon
						aria-hidden
						className="size-4 shrink-0 text-muted-foreground"
					/>
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="start"
				// design-lint-disable-next-line arbitrary-size -- the tree is as wide as its trigger, which only Radix measures, through this variable
				className="max-h-96 w-[var(--radix-popover-trigger-width)] min-w-56 overflow-y-auto p-1"
			>
				<TreeView
					aria-label={t("mail.folder")}
					expanded={expanded}
					onExpandChange={setExpanded}
					onItemSelect={handleSelect}
				>
					{renderLevel(tree)}
				</TreeView>
			</PopoverContent>
		</Popover>
	);
};
