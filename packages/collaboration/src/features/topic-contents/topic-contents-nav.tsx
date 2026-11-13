import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import {
	buildMailFolderTree,
	type MailFolder,
	type MailFolderNode,
	type MailFolders,
} from "@semoss/connectors";
import {
	Button,
	cn,
	H2,
	Muted,
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
	TreeView,
	TreeViewItem,
} from "@semoss/ui/next";
import { type AppIcon, OutlookIcon } from "@/components/common/app-icons";

/** A list the page can show, such as the topic's own conversations. */
export interface TopicPlace {
	id: string;
	label: string;
	/** Tells the kinds of place apart at a glance: Teams chats wear the Teams logo. */
	icon: AppIcon;
	/** How many it lists, when the page knows without reading it. */
	count?: number;
}

/** Places under one heading. */
export interface TopicPlaceGroup {
	title: string;
	places: TopicPlace[];
}

interface TopicContentsNavProps {
	/** The short lists, which stay in view above the mailbox however many folders it has. */
	groups: TopicPlaceGroup[];
	/** The owner's Outlook folders; absent where the topic cannot take mail from the mailbox. */
	mailbox?: MailFolders;
	/** The place shown: a group's place id, or `folder:` and a folder's id. */
	place: string;
	onPlaceChange: (place: string) => void;
}

// the accent fill alone is about 1:1 against the page, and it is what hovering any place paints, so the
// place shown also wears a ring, and keeps its fill under the pointer and its ring's color under keyboard focus
const CURRENT_CLASS =
	"bg-primary/10 font-medium text-foreground ring-1 ring-primary ring-inset hover:bg-primary/10 focus-visible:ring-primary dark:hover:bg-primary/10";

const folderPlace = (folder: MailFolder): string => `folder:${folder.id}`;
/** What to call a folder away from its tree: a nested one by its path, as the mailbox's own picker does. */
export const folderLabel = (folder: MailFolder): string =>
	folder.depth > 0 && folder.path
		? folder.path.replaceAll("/", " / ")
		: folder.name;

/**
 * Where the page's list comes from: the topic's own contents, Teams and the other short lists, then the
 * Outlook folder tree as the mailbox has it. A rail beside the list, and one menu above it on a narrow screen.
 */
export function TopicContentsNav({
	groups,
	mailbox,
	place,
	onPlaceChange,
}: TopicContentsNavProps) {
	const fieldId = useId();
	const railRef = useRef<HTMLElement>(null);
	// the inbox starts open, as it does in a mail app
	const [expanded, setExpanded] = useState<string[]>([`${fieldId}-inbox`]);
	const folderCount = mailbox?.folders.length ?? 0;
	useEffect(() => {
		// a link can open on a folder far down the tree, and the folders arrive after the page
		void place;
		void folderCount;
		railRef.current
			?.querySelector('[aria-current="true"], [aria-selected="true"]')
			?.scrollIntoView?.({ block: "nearest" });
	}, [place, folderCount]);

	const renderFolders = (nodes: MailFolderNode[]): ReactNode =>
		nodes.map(({ folder, children }) => {
			const isSelected = folderPlace(folder) === place;
			const unread = folder.unreadCount ?? 0;
			return (
				<TreeViewItem
					key={folder.id}
					id={`${fieldId}-${folder.id}`}
					item={folder}
					aria-selected={isSelected}
					rowClassName={cn(
						"pointer-coarse:min-h-11",
						isSelected && CURRENT_CLASS,
					)}
					label={
						<span className="flex min-w-0 items-center justify-between gap-2 text-sm">
							{/* a long name is cut in the rail; hovering gives all of it */}
							<span className="truncate" title={folder.name}>
								{folder.name}
							</span>
							{unread > 0 && (
								<span
									className={cn(
										"shrink-0 text-xs tabular-nums",
										// muted grey drops below 4.5:1 on the selected row's fill
										!isSelected && "text-muted-foreground",
									)}
								>
									<span aria-hidden="true">
										{unread.toLocaleString()}
									</span>
									<span className="sr-only">
										{unread.toLocaleString()} unread
									</span>
								</span>
							)}
						</span>
					}
				>
					{children.length > 0 ? renderFolders(children) : null}
				</TreeViewItem>
			);
		});

	return (
		<>
			<div className="shrink-0 border-b p-3 md:hidden">
				<Select value={place} onValueChange={onPlaceChange}>
					<SelectTrigger
						aria-label="What to list"
						className="pointer-coarse:min-h-11 w-full"
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{groups.map(({ title, places }) => (
							<SelectGroup key={title}>
								<SelectLabel>{title}</SelectLabel>
								{places.map((entry) => (
									<SelectItem key={entry.id} value={entry.id}>
										{entry.label}
									</SelectItem>
								))}
							</SelectGroup>
						))}
						{mailbox && (
							<SelectGroup>
								<SelectLabel>Outlook folders</SelectLabel>
								{mailbox.folders.map((folder) => (
									<SelectItem
										key={folder.id}
										value={folderPlace(folder)}
									>
										{folderLabel(folder)}
									</SelectItem>
								))}
							</SelectGroup>
						)}
					</SelectContent>
				</Select>
			</div>
			<nav
				ref={railRef}
				aria-label="What to list"
				className="hidden w-60 shrink-0 flex-col gap-5 overflow-y-auto border-r p-3 md:flex xl:w-72"
			>
				{groups.map(({ title, places }, index) => (
					<section
						key={title}
						// by position: a title has spaces, which an id reference splits on
						aria-labelledby={`${fieldId}-group-${index}`}
					>
						<H2
							id={`${fieldId}-group-${index}`}
							className="px-2 pb-1 font-medium text-muted-foreground text-xs tracking-normal"
						>
							{title}
						</H2>
						<ul>
							{places.map((entry) => (
								<li key={entry.id}>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										aria-current={
											entry.id === place || undefined
										}
										className={cn(
											"pointer-coarse:min-h-11 w-full justify-start gap-2 px-2 font-normal",
											entry.id === place && CURRENT_CLASS,
										)}
										onClick={() => onPlaceChange(entry.id)}
									>
										<entry.icon
											aria-hidden="true"
											className="size-4 shrink-0"
										/>
										<span className="min-w-0 flex-1 truncate text-left">
											{entry.label}
										</span>
										{entry.count !== undefined && (
											<span
												className={cn(
													"shrink-0 font-normal text-xs tabular-nums",
													// muted grey drops below 4.5:1 on the shown place's fill
													entry.id !== place &&
														"text-muted-foreground",
												)}
											>
												{entry.count.toLocaleString()}
											</span>
										)}
									</Button>
								</li>
							))}
						</ul>
					</section>
				))}
				{mailbox && (
					<section aria-labelledby={`${fieldId}-outlook`}>
						<H2
							id={`${fieldId}-outlook`}
							className="flex items-center gap-1.5 px-2 pb-1 font-medium text-muted-foreground text-xs tracking-normal"
						>
							<OutlookIcon
								aria-hidden="true"
								className="size-3.5"
							/>
							Outlook folders
						</H2>
						<TreeView
							aria-labelledby={`${fieldId}-outlook`}
							expanded={expanded}
							onExpandChange={setExpanded}
							onItemSelect={(folder: MailFolder) =>
								onPlaceChange(folderPlace(folder))
							}
						>
							{renderFolders(
								buildMailFolderTree(mailbox.folders),
							)}
						</TreeView>
						{mailbox.status === "loading" && (
							<Muted className="block px-2 pt-1 font-normal text-xs">
								Loading folders…
							</Muted>
						)}
						{mailbox.status === "signedOut" && (
							<Muted className="block px-2 pt-1 font-normal text-xs">
								Sign in to see your other folders.
							</Muted>
						)}
						{mailbox.status === "error" && (
							<div className="space-y-1 px-2 pt-1">
								<Muted className="block font-normal text-xs">
									Could not read your folders.
								</Muted>
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="pointer-coarse:min-h-11"
									onClick={mailbox.reload}
								>
									Try again
								</Button>
							</div>
						)}
					</section>
				)}
			</nav>
		</>
	);
}
