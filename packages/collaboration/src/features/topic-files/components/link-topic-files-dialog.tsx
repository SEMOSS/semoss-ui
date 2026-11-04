import { ChevronRight, Folder, Search } from "lucide-react";
import { type FormEvent, useEffect, useId, useMemo, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Badge,
	Button,
	Checkbox,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Input,
	Label,
	P,
	Small,
	Spinner,
	toast,
} from "@semoss/ui/next";
import {
	browseTopicDrive,
	type DriveBrowseArgs,
	type DriveEntry,
	linkTopicFile,
	type TopicLink,
} from "../api/topic-files";

interface Place {
	label: string;
	args: DriveBrowseArgs;
}
const ROOTS: Place[] = [
	{ label: "My OneDrive", args: { view: "mine" } },
	{ label: "Shared with me", args: { view: "shared" } },
	{ label: "Teams", args: { view: "teams" } },
	{ label: "SharePoint sites", args: { view: "sites" } },
];
const KIND_LABELS: Record<DriveEntry["kind"], string> = {
	file: "File",
	folder: "Folder",
	team: "Team",
	channel: "Channel",
	site: "Site",
	library: "Library",
};

interface LinkTopicFilesDialogProps {
	/** The writable topic receiving the links. */
	topicId: string;
	/** Already linked files: marked in the picker, and their folders offered as places. */
	links: TopicLink[];
	/** Reload the list after links are saved. */
	onLinked: () => void;
}
const errorText = (error: unknown, fallback: string): string =>
	error instanceof Error ? error.message : fallback;
const fileKey = (driveId?: string | null, itemId?: string | null): string =>
	`${driveId}|${itemId}`;

/** Pick OneDrive, SharePoint or Teams files to link, or paste a link to one. */
export function LinkTopicFilesDialog({
	topicId,
	links,
	onLinked,
}: LinkTopicFilesDialogProps) {
	const { actions } = useInsight();
	const fieldId = useId();
	const [isOpen, setIsOpen] = useState(false);
	const [trail, setTrail] = useState<Place[]>([ROOTS[0]]);
	const [entries, setEntries] = useState<DriveEntry[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const [shareUrl, setShareUrl] = useState("");
	const [selected, setSelected] = useState<Map<string, DriveEntry>>(
		new Map(),
	);
	const [isLinking, setIsLinking] = useState(false);
	const place = trail[trail.length - 1];
	const linked = useMemo(
		() => new Set(links.map((link) => fileKey(link.driveId, link.itemId))),
		[links],
	);
	const linkedFolders = useMemo(() => {
		const folders = new Map<string, Place>();
		for (const link of links) {
			if (!link.parentId) continue;
			const label =
				link.location?.split("/").filter(Boolean).pop() ?? "Folder";
			folders.set(fileKey(link.driveId, link.parentId), {
				label,
				args: { driveId: link.driveId, itemId: link.parentId },
			});
		}
		return [...folders.values()];
	}, [links]);

	useEffect(() => {
		if (!isOpen) return;
		let isCurrent = true;
		setIsLoading(true);
		setError(null);
		browseTopicDrive(actions, place.args)
			.then((result) => {
				if (isCurrent) setEntries(result);
			})
			.catch((failure: unknown) => {
				if (!isCurrent) return;
				setEntries([]);
				setError(
					errorText(failure, "Could not load Microsoft 365 files."),
				);
			})
			.finally(() => {
				if (isCurrent) setIsLoading(false);
			});
		return () => {
			isCurrent = false;
		};
	}, [actions, isOpen, place]);

	const reset = (): void => {
		setTrail([ROOTS[0]]);
		setSelected(new Map());
		setSearch("");
		setShareUrl("");
		setError(null);
	};
	const handleOpenChange = (next: boolean): void => {
		if (isLinking) return;
		if (!next) reset();
		setIsOpen(next);
	};
	const openEntry = (entry: DriveEntry): void => {
		const label = entry.name ?? KIND_LABELS[entry.kind];
		const args: DriveBrowseArgs | null =
			entry.kind === "folder" && entry.driveId && entry.itemId
				? { driveId: entry.driveId, itemId: entry.itemId }
				: entry.kind === "library" && entry.id
					? { driveId: entry.id }
					: entry.kind === "team" && entry.id
						? { teamId: entry.id }
						: entry.kind === "channel" &&
								entry.id &&
								place.args.teamId
							? { teamId: place.args.teamId, channelId: entry.id }
							: entry.kind === "site" && entry.id
								? { siteId: entry.id }
								: null;
		if (args) setTrail((current) => [...current, { label, args }]);
	};
	const toggle = (entry: DriveEntry, isChecked: boolean): void => {
		setSelected((current) => {
			const next = new Map(current);
			const key = fileKey(entry.driveId, entry.itemId);
			if (isChecked) next.set(key, entry);
			else next.delete(key);
			return next;
		});
	};
	const handleSearch = (event: FormEvent): void => {
		event.preventDefault();
		const text = search.trim();
		if (text)
			setTrail([{ label: `Search: ${text}`, args: { search: text } }]);
	};
	const link = async (
		addresses: Array<
			{ shareUrl: string } | { driveId: string; itemId: string }
		>,
	): Promise<void> => {
		setIsLinking(true);
		setError(null);
		let count = 0;
		try {
			for (const address of addresses) {
				const result = await linkTopicFile(actions, topicId, address);
				if (!result.alreadyLinked) count += 1;
			}
		} catch (failure: unknown) {
			setError(errorText(failure, "Could not link the file."));
			if (count > 0) onLinked();
			return;
		} finally {
			setIsLinking(false);
		}
		onLinked();
		toast.success(
			count === 0
				? "Already linked to this topic"
				: `${count} file${count === 1 ? "" : "s"} linked`,
		);
		reset();
		setIsOpen(false);
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button type="button" variant="outline">
					Link Microsoft 365 files
				</Button>
			</DialogTrigger>
			<DialogContent
				showCloseButton={!isLinking}
				className="max-h-full overflow-y-auto sm:max-w-2xl"
				onEscapeKeyDown={(event) => {
					if (isLinking) event.preventDefault();
				}}
				onInteractOutside={(event) => {
					if (isLinking) event.preventDefault();
				}}
			>
				<DialogHeader>
					<DialogTitle>Link Microsoft 365 files</DialogTitle>
					<DialogDescription>
						Pick OneDrive, SharePoint or Teams files, or paste a
						link to one. The topic keeps a link and the file's
						details, not a copy.
					</DialogDescription>
				</DialogHeader>
				<form
					className="flex flex-col gap-2 sm:flex-row sm:items-end"
					onSubmit={(event) => {
						event.preventDefault();
						if (shareUrl.trim())
							void link([{ shareUrl: shareUrl.trim() }]);
					}}
				>
					<div className="min-w-0 flex-1 space-y-1">
						<Label htmlFor={`${fieldId}-url`}>
							Paste a file link
						</Label>
						<Input
							id={`${fieldId}-url`}
							type="url"
							placeholder="https://…sharepoint.com/…"
							value={shareUrl}
							disabled={isLinking}
							onChange={(event) =>
								setShareUrl(event.target.value)
							}
						/>
					</div>
					<Button
						type="submit"
						variant="outline"
						disabled={isLinking || !shareUrl.trim()}
					>
						Link
					</Button>
				</form>
				<nav aria-label="Places" className="flex flex-wrap gap-2">
					{ROOTS.map((root) => (
						<Button
							key={root.label}
							type="button"
							size="sm"
							variant={
								trail.length === 1 && trail[0] === root
									? "secondary"
									: "ghost"
							}
							onClick={() => setTrail([root])}
						>
							{root.label}
						</Button>
					))}
				</nav>
				{linkedFolders.length > 0 && (
					<div className="flex flex-wrap items-center gap-2">
						<Small className="text-muted-foreground">
							Folders of linked files:
						</Small>
						{linkedFolders.map((folder) => (
							<Button
								key={fileKey(
									folder.args.driveId,
									folder.args.itemId,
								)}
								type="button"
								size="sm"
								variant="ghost"
								onClick={() => setTrail([folder])}
							>
								<Folder aria-hidden="true" />
								{folder.label}
							</Button>
						))}
					</div>
				)}
				<form
					aria-label="Search OneDrive and SharePoint"
					className="relative"
					onSubmit={handleSearch}
				>
					<Label htmlFor={`${fieldId}-search`} className="sr-only">
						Search OneDrive and SharePoint
					</Label>
					<Search
						aria-hidden="true"
						className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground"
					/>
					<Input
						id={`${fieldId}-search`}
						type="search"
						placeholder="Search OneDrive and SharePoint…"
						className="pl-9"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
					/>
				</form>
				<nav
					aria-label="Location"
					className="flex flex-wrap items-center gap-1"
				>
					{trail.map((step, index) => (
						<span
							key={`${step.label}-${index}`}
							className="flex items-center gap-1"
						>
							{index > 0 && (
								<ChevronRight
									aria-hidden="true"
									className="size-4 text-muted-foreground"
								/>
							)}
							<Button
								type="button"
								size="sm"
								variant="ghost"
								aria-current={
									index === trail.length - 1
										? "location"
										: undefined
								}
								disabled={index === trail.length - 1}
								onClick={() =>
									setTrail(trail.slice(0, index + 1))
								}
							>
								{step.label}
							</Button>
						</span>
					))}
				</nav>
				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
				{isLoading ? (
					<output className="flex items-center gap-2">
						<Spinner aria-hidden="true" />
						Loading…
					</output>
				) : (
					<ul
						aria-label="Files and places"
						className="max-h-80 divide-y divide-border overflow-y-auto rounded-md border"
					>
						{!error && entries.length === 0 && (
							<li className="p-3">
								<P className="text-muted-foreground">
									Nothing here.
								</P>
							</li>
						)}
						{entries.map((entry) => {
							const key =
								entry.kind === "file" || entry.kind === "folder"
									? fileKey(entry.driveId, entry.itemId)
									: `${entry.kind}|${entry.id}`;
							if (entry.kind !== "file")
								return (
									<li key={key}>
										<button
											type="button"
											className="flex w-full min-w-0 items-center justify-between gap-2 p-3 text-left hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
											onClick={() => openEntry(entry)}
										>
											<span className="flex min-w-0 items-center gap-2">
												<Folder
													aria-hidden="true"
													className="size-4 shrink-0 text-muted-foreground"
												/>
												<span className="break-all">
													{entry.name ??
														KIND_LABELS[entry.kind]}
												</span>
											</span>
											<Small className="shrink-0 text-muted-foreground">
												{KIND_LABELS[entry.kind]}
											</Small>
										</button>
									</li>
								);
							const isLinked = linked.has(key);
							const checkboxId = `${fieldId}-${key}`;
							return (
								<li
									key={key}
									className="flex min-w-0 items-start gap-3 p-3"
								>
									<Checkbox
										id={checkboxId}
										className="mt-1"
										checked={isLinked || selected.has(key)}
										disabled={isLinked || isLinking}
										onCheckedChange={(checked) =>
											toggle(entry, checked === true)
										}
									/>
									<Label
										htmlFor={checkboxId}
										className="block min-w-0 font-normal"
									>
										<span className="block break-all font-medium">
											{entry.name}
										</span>
										<Small className="block break-all text-muted-foreground">
											{[
												entry.location,
												entry.modifiedAt &&
													`Modified ${new Date(entry.modifiedAt).toLocaleDateString()}`,
											]
												.filter(Boolean)
												.join(" · ")}
										</Small>
									</Label>
									{isLinked && (
										<Badge
											variant="secondary"
											className="ml-auto shrink-0"
										>
											Linked
										</Badge>
									)}
								</li>
							);
						})}
					</ul>
				)}
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						disabled={isLinking}
						onClick={() => handleOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						type="button"
						disabled={isLinking || selected.size === 0}
						onClick={() =>
							void link(
								[...selected.values()].flatMap((entry) =>
									entry.driveId && entry.itemId
										? [
												{
													driveId: entry.driveId,
													itemId: entry.itemId,
												},
											]
										: [],
								),
							)
						}
					>
						{isLinking && <Spinner />}
						{isLinking
							? "Linking…"
							: `Link selected${selected.size ? ` (${selected.size})` : ""}`}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
