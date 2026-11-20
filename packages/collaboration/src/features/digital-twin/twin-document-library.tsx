import {
	ArrowRight,
	ChevronRight,
	FileText,
	FolderPlus,
	Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { FileItem } from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	Button,
	H3,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	P,
	Spinner,
} from "@semoss/ui/next";
import { agentImageUrl } from "@/features/agents/api/agent-image";
import type { DigitalTwin } from "./api/digital-twin";
import { TwinPageCover } from "./twin-page-cover";
import { TWIN_FINDER, TWIN_SOURCES } from "./twin-sources";

const FOLDERS = {
	emails: { label: "Emails", icon: TWIN_SOURCES.outlook.icon },
	meetings: { label: "Meetings", icon: TWIN_SOURCES.calendar.icon },
	"teams-chats": {
		label: "Teams chats",
		icon: TWIN_SOURCES["teams-chats"].icon,
	},
	files: { label: "Files", icon: FileText },
};
type Folder = keyof typeof FOLDERS;
const dateFormat = new Intl.DateTimeFormat(undefined, {
	month: "short",
	day: "numeric",
	year: "numeric",
});
const PAGE_SIZE = 25;

/** Group copies by their actual folder. Drive and uploaded files can share the same folder. */
function describeDocument(item: FileItem): {
	item: FileItem;
	folder: Folder;
	location: string;
	timestamp: number;
} {
	const parts = item.path.slice(1).split("/");
	parts.pop();
	const [root, ...subfolders] = parts;
	const folder: Folder =
		root === "emails" || root === "meetings" || root === "teams-chats"
			? root
			: "files";
	const location =
		root && (folder !== "files" || root === "files")
			? [FOLDERS[folder].label, ...subfolders].join(" / ")
			: parts.join(" / ") || "Library root";
	// SearchAppAssets sends wall time in the insight's timezone, without a UTC offset.
	const timestamp = item.lastModified
		? Date.parse(
				item.lastModified.replace(
					/^(\d{2})\/(\d{2})\/(\d{4}) /,
					"$3-$1-$2T",
				),
			)
		: Number.NaN;
	return {
		item,
		folder,
		location,
		timestamp: Number.isFinite(timestamp)
			? timestamp
			: Number.NEGATIVE_INFINITY,
	};
}

interface TwinDocumentLibraryProps {
	/** Twin and the files actually present under its public documents root. */
	twin: DigitalTwin;
	files: FileItem[];
	/** Opens a file in this dock's native viewer once its explorer is ready. */
	onOpen?: (file: FileItem) => void;
	/** Switches to an existing knowledge source or finder in this twin. */
	onPlaceChange: (place: string) => void;
	/** Only needed for an older twin without its documents folder. */
	onAddFolder?: () => void;
	isAddingFolder?: boolean;
	/** Last successful listing stays readable if a refresh fails. */
	refreshError?: string;
	onRefresh: () => void;
}

/** The knowledge collection shown before opening a document and after closing the last preview. */
export function TwinDocumentLibrary({
	twin,
	files,
	onOpen,
	onPlaceChange,
	onAddFolder,
	isAddingFolder,
	refreshError,
	onRefresh,
}: TwinDocumentLibraryProps) {
	const [query, setQuery] = useState("");
	const [selected, setSelected] = useState<Folder | "all">("all");
	const [limit, setLimit] = useState(PAGE_SIZE);
	const documents = useMemo(
		() =>
			files
				.map(describeDocument)
				.sort(
					(a, b) =>
						b.timestamp - a.timestamp ||
						a.item.path.localeCompare(b.item.path),
				),
		[files],
	);
	const counts = { emails: 0, meetings: 0, "teams-chats": 0, files: 0 };
	for (const doc of documents) counts[doc.folder]++;
	const folders = (Object.keys(FOLDERS) as Folder[]).filter(
		(folder) => counts[folder] > 0,
	);
	const active =
		selected === "all" || counts[selected] > 0 ? selected : "all";
	const search = query.trim().toLocaleLowerCase();
	const matches = documents.filter(
		({ item, folder, location }) =>
			(active === "all" || active === folder) &&
			(!search ||
				`${item.name} ${location}`
					.toLocaleLowerCase()
					.includes(search)),
	);
	const clearFilters = (): void => {
		setQuery("");
		setSelected("all");
		setLimit(PAGE_SIZE);
	};
	const rows = matches
		.slice(0, limit)
		.map(({ item, folder, location, timestamp }) => {
			const Icon = FOLDERS[folder].icon;
			const modified = Number.isFinite(timestamp)
				? dateFormat.format(timestamp)
				: null;
			return (
				<li key={item.path}>
					<Button
						type="button"
						variant="ghost"
						disabled={!onOpen}
						onClick={() => onOpen?.(item)}
						className="focus-visible:-outline-offset-2 h-auto min-h-14 w-full justify-start gap-3 whitespace-normal rounded-none @lg/twins:px-5 px-3 py-3 text-start focus-visible:outline-2 focus-visible:outline-ring"
					>
						<span
							aria-hidden="true"
							className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"
						>
							<Icon className="size-5" />
						</span>
						<span className="flex min-w-0 flex-1 flex-col gap-0.5">
							<span className="wrap-anywhere text-start font-medium text-sm">
								{item.name}
							</span>
							<span className="wrap-anywhere text-start font-normal text-muted-foreground text-xs">
								{location}
								{modified && (
									<span className="@lg/twins:hidden">
										{" "}
										· {modified}
									</span>
								)}
							</span>
						</span>
						{modified && (
							<span className="@lg/twins:inline hidden shrink-0 font-normal text-muted-foreground text-xs tabular-nums">
								Modified {modified}
							</span>
						)}
						<ChevronRight
							aria-hidden="true"
							className="size-4 shrink-0 text-muted-foreground rtl:rotate-180"
						/>
					</Button>
				</li>
			);
		});
	return (
		<div className="@container/twins h-full min-h-0 min-w-0 overflow-y-auto bg-background">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 @4xl/twins:p-8 @lg/twins:p-6 p-3">
				<TwinPageCover
					twinId={twin.id}
					name={twin.name}
					portrait={agentImageUrl(twin.id)}
					sectionTitle="Knowledge library"
				>
					<P className="col-span-full @lg/twins:text-base text-sm">
						{files.length
							? `${files.length.toLocaleString()} ${files.length === 1 ? "document" : "documents"} your twin can answer from.`
							: "Give your twin its first document, email, or conversation."}
					</P>
					<div className="col-span-full flex flex-wrap gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="pointer-coarse:min-h-11 bg-card text-card-foreground"
							onClick={() => onPlaceChange(TWIN_FINDER.id)}
						>
							<TWIN_FINDER.icon aria-hidden="true" /> Find with AI
						</Button>
						{onAddFolder && (
							<Button
								type="button"
								size="sm"
								disabled={isAddingFolder}
								onClick={onAddFolder}
								className="pointer-coarse:min-h-11"
							>
								{isAddingFolder ? (
									<Spinner aria-hidden="true" />
								) : (
									<FolderPlus aria-hidden="true" />
								)}
								{isAddingFolder
									? "Adding…"
									: "Add the files folder"}
							</Button>
						)}
					</div>
				</TwinPageCover>
				{refreshError && (
					<Alert variant="destructive">
						<AlertDescription>
							Couldn’t refresh the library. {refreshError}
							<Button
								type="button"
								size="sm"
								variant="outline"
								onClick={onRefresh}
							>
								Try again
							</Button>
						</AlertDescription>
					</Alert>
				)}
				{files.length > 0 && (
					<section
						aria-label="Library documents"
						className="flex min-w-0 flex-col gap-3"
					>
						<div className="flex @md/twins:flex-row flex-col @md/twins:items-center @md/twins:justify-between gap-3">
							<H3 className="font-semibold text-lg tracking-normal">
								Documents
							</H3>
							<InputGroup className="pointer-coarse:min-h-11 @md/twins:w-60 w-full bg-card">
								<InputGroupAddon>
									<Search aria-hidden="true" />
								</InputGroupAddon>
								<InputGroupInput
									type="search"
									aria-label="Search documents"
									placeholder="Search documents"
									value={query}
									onChange={(e) => {
										setQuery(e.target.value);
										setLimit(PAGE_SIZE);
									}}
								/>
							</InputGroup>
						</div>
						{folders.length > 1 && (
							<fieldset
								aria-label="Filter documents by folder"
								className="flex flex-wrap gap-1.5"
							>
								{(["all", ...folders] as const).map(
									(folder) => (
										<Button
											type="button"
											key={folder}
											aria-pressed={active === folder}
											size="sm"
											variant={
												active === folder
													? "secondary"
													: "ghost"
											}
											className="min-h-8 pointer-coarse:min-h-11 gap-1.5 px-3"
											onClick={() => {
												setSelected(folder);
												setLimit(PAGE_SIZE);
											}}
										>
											{folder === "all"
												? "All"
												: FOLDERS[folder].label}
											<span className="text-muted-foreground text-xs tabular-nums">
												{(folder === "all"
													? files.length
													: counts[folder]
												).toLocaleString()}
											</span>
										</Button>
									),
								)}
							</fieldset>
						)}
						{matches.length ? (
							<ul className="divide-y overflow-hidden rounded-xl border bg-card text-card-foreground">
								{rows}
							</ul>
						) : (
							<div className="rounded-xl border bg-card p-5">
								<P>No documents match your search.</P>
								<Button
									type="button"
									variant="link"
									className="px-0"
									onClick={clearFilters}
								>
									Clear filters
								</Button>
							</div>
						)}
						{matches.length > limit && (
							<Button
								type="button"
								variant="outline"
								className="self-start"
								onClick={() =>
									setLimit((current) => current + PAGE_SIZE)
								}
							>
								Show more documents
							</Button>
						)}
					</section>
				)}
				{(files.length === 0 || (files.length === 1 && !search)) && (
					<section
						aria-label="Browse sources"
						className="flex flex-col gap-3"
					>
						<H3 className="font-semibold text-lg tracking-normal">
							{files.length
								? "Add another source"
								: "Browse a source"}
						</H3>
						<div className="flex flex-wrap gap-2">
							{Object.entries(TWIN_SOURCES).map(
								([key, { label, icon: Icon }]) => (
									<Button
										key={key}
										type="button"
										variant="outline"
										className="pointer-coarse:min-h-11 bg-card"
										onClick={() => onPlaceChange(key)}
									>
										<Icon aria-hidden="true" />
										{label}
										<ArrowRight
											aria-hidden="true"
											className="size-3.5 rtl:rotate-180"
										/>
									</Button>
								),
							)}
						</div>
					</section>
				)}
			</div>
		</div>
	);
}
