import { ArrowLeft, FolderPlus } from "lucide-react";
import { type ReactNode, useCallback, useId, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router";
import type { ConnectorSavedFile } from "@semoss/connectors";
import { FILE_PANEL_COMPONENTS } from "@semoss/panels";
import { useInsight } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	cn,
	H1,
	H2,
	P,
	Skeleton,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { useOptionalCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { uploadRoomFiles } from "@/features/rooms/api/upload-room-files";
import { RoutineDocumentsDock } from "@/features/routines/routine-documents-dock";
import {
	TopicContentsNav,
	type TopicPlaceGroup,
} from "@/features/topic-contents/topic-contents-nav";
import type { InsightActions } from "@/lib/pixel";
import { twinSettingsPath } from "@/lib/workspace-paths";
import {
	copyToTwin,
	createTwinFolder,
	getMyTwin,
	hasTwinFolder,
	meetingTranscriptFile,
	readMeetingTranscript,
	readTwinHoldings,
	TWIN_FILES_PATH,
	type TwinCopy,
} from "./api/digital-twin";
import { TwinFilesIcon } from "./twin-files-icon";
import { TwinKnowledgeFinder } from "./twin-knowledge-finder";
import { TwinSourceViewer } from "./twin-source-viewer";
import { TWIN_FINDER, TWIN_SOURCES } from "./twin-sources";
import { useTwinIndex } from "./use-twin-index";
import {
	attachmentsSummary,
	useTwinMailAttachments,
} from "./use-twin-mail-attachments";
import { useTwinRead } from "./use-twin-read";

// what each place is called in the rail, and what it says above its list
const PLACES = {
	files: {
		label: "Files",
		icon: TwinFilesIcon,
		description:
			"The copies your Digital Twin answers from. Upload more, or open, rename and delete what is here.",
	},
	[TWIN_FINDER.id]: TWIN_FINDER,
	...TWIN_SOURCES,
} as const;
type Place = keyof typeof PLACES;
const isPlace = (value: string | null): value is Place =>
	value !== null && value in PLACES;

const GROUPS: TopicPlaceGroup[] = [
	{
		title: "In your twin",
		places: [{ id: "files", ...PLACES.files }],
	},
	{
		title: "Add from",
		places: [
			TWIN_FINDER,
			...Object.entries(TWIN_SOURCES).map(([id, source]) => ({
				id,
				...source,
			})),
		],
	},
];

/**
 * A full page for choosing what the owner's Digital Twin knows: its own files,
 * the owner's Outlook, Teams chats, OneDrive and Teams files to add from, and
 * a search that suggests what to add from a description. A viewer, or the
 * search, saves an item into the page's files, as a viewer does in a chat,
 * and the page then copies it into the twin. After an email, its attachments
 * can be added in one go, and after a meeting what was said in it, where the
 * server can read that. A list marks what the twin already holds a copy of,
 * whenever it was added. The copy is a snapshot: nothing here reads the
 * owner's account again later.
 */
export function TwinContents() {
	const { actions, insightId } = useInsight();
	const [params, setParams] = useSearchParams();
	const labelId = useId();
	const requestedTwinId = params.get("twinId") ?? undefined;
	const readContents = useCallback(
		async (actions: InsightActions) => {
			const twin = await getMyTwin(actions, requestedTwinId);
			return (
				twin && {
					...twin,
					...(await readTwinHoldings(actions, twin.id)),
				}
			);
		},
		[requestedTwinId],
	);
	const contents = useTwinRead(readContents);
	// what each copy holds is described for the twin's chats a moment after the page opens and after each change here
	const requestIndex = useTwinIndex(contents.data?.id);
	// set once the folder is known to be there: added here, or made by a copy
	const [isFolderAdded, setIsFolderAdded] = useState(false);
	const [isAddingFolder, setIsAddingFolder] = useState(false);
	const [status, setStatus] = useState("");
	// what a viewer's list marks as in the twin, by what the viewer knows each item by: what the page
	// read, until the page adds to it or reads it again
	const [heldKeys, setHeldKeys] = useState<ReadonlySet<string>>();
	// the emails added here, whose attachments can be added too
	const attachments = useTwinMailAttachments();
	// the meetings added here, whose transcripts can be added too: only where the server's Microsoft sign in
	// asks for the scope one is read with, and never where no session is around the page
	const canReadTranscripts =
		useOptionalCollaborationSession()?.state.settings.meetingTranscripts ===
		true;
	const [meetings, setMeetings] = useState<string[]>([]);
	const [isAddingTranscripts, setIsAddingTranscripts] = useState(false);
	const twin = contents.data;
	if (twin === null) return <Navigate to="/twins/mine" replace />;

	const requested = params.get("in");
	const place = isPlace(requested) ? requested : "files";
	const PlaceIcon = PLACES[place].icon;

	const markHeld = (itemKey: string | undefined, isHeld: boolean): void => {
		if (!itemKey) return;
		setHeldKeys((current) => {
			const keys = new Set(current ?? twin?.itemKeys);
			if (isHeld) keys.add(itemKey);
			else keys.delete(itemKey);
			return keys;
		});
	};
	/** Copy a file in the page's files into the twin, saying how it went. Resolves to whether it is in. */
	const addToTwin = async (
		twinId: string,
		file: ConnectorSavedFile,
	): Promise<boolean> => {
		// marked while the copy runs, so the same item is not asked for twice
		markHeld(file.itemKey, true);
		setStatus(`Copying "${file.name}" into your Digital Twin…`);
		let copy: TwinCopy;
		try {
			copy = await copyToTwin(actions, twinId, file);
		} catch (cause) {
			markHeld(file.itemKey, false);
			setStatus(`"${file.name}" was not added to your Digital Twin.`);
			toast.error(`Could not add "${file.name}" to your Digital Twin.`, {
				description: cause instanceof Error ? cause.message : undefined,
			});
			return false;
		}
		// again: what the twin holds may have been read while this copy was on its way
		markHeld(file.itemKey, true);
		// the copy makes the folders it lands in
		setIsFolderAdded(true);
		setStatus(`Added "${file.name}" to your Digital Twin.`);
		toast.success(`Added "${file.name}" to your Digital Twin.`);
		requestIndex();
		if (copy.recordError) {
			toast.warning(
				`"${file.name}" will not show as added once this page is reloaded.`,
				{ description: copy.recordError },
			);
		}
		return true;
	};
	const handleSaved = async (
		twinId: string,
		file: ConnectorSavedFile,
	): Promise<void> => {
		if (!(await addToTwin(twinId, file))) return;
		attachments.offer(file);
		// the calendar knows a meeting by its event's id
		const eventId = file.itemKey;
		if (
			canReadTranscripts &&
			file.service === "outlook-calendar" &&
			eventId
		)
			setMeetings((current) =>
				current.includes(eventId) ? current : [...current, eventId],
			);
	};
	const handleAddTranscripts = async (twinId: string): Promise<void> => {
		setIsAddingTranscripts(true);
		setStatus("Reading what was said…");
		let added = 0;
		// why a meeting has no transcript, in the server's words
		const notes: string[] = [];
		try {
			for (const eventId of meetings) {
				const transcript = await readMeetingTranscript(
					actions,
					eventId,
				);
				if ("message" in transcript) {
					notes.push(transcript.message);
				} else {
					// into the page's files, as a viewer saves, then copied in beside its meeting
					const [saved] = await uploadRoomFiles(insightId, [
						meetingTranscriptFile(transcript),
					]);
					const isAdded =
						saved !== undefined &&
						(await addToTwin(twinId, {
							path: saved.fileLocation,
							name: saved.fileName,
							service: "outlook-calendar",
						}));
					if (isAdded) added += 1;
				}
				// done with, whichever way it went, so a second try does not add it twice
				setMeetings((current) =>
					current.filter((id) => id !== eventId),
				);
			}
			setStatus(
				[
					added > 0 &&
						`Added ${added} ${added === 1 ? "transcript" : "transcripts"} to your Digital Twin.`,
					...notes,
				]
					.filter(Boolean)
					.join(" "),
			);
		} catch (cause) {
			setStatus("The transcript was not added to your Digital Twin.");
			toast.error("Could not add the transcript.", {
				description: cause instanceof Error ? cause.message : undefined,
			});
		} finally {
			setIsAddingTranscripts(false);
		}
	};
	const handleAddAttachments = async (twinId: string): Promise<void> => {
		setStatus("Looking for attachments…");
		let found: Awaited<ReturnType<typeof attachments.save>>;
		try {
			found = await attachments.save();
		} catch (cause) {
			setStatus("The attachments were not added to your Digital Twin.");
			toast.error("Could not add the attachments.", {
				description: cause instanceof Error ? cause.message : undefined,
			});
			return;
		}
		let added = 0;
		// one after another, as each says how it went
		for (const file of found.saved)
			if (await addToTwin(twinId, file)) added += 1;
		setStatus(
			attachmentsSummary(
				added,
				found.skipped,
				(what) => `Added ${what} to your Digital Twin.`,
			),
		);
	};
	const handlePlaceChange = (next: string): void => {
		// the owner may have uploaded or deleted a copy among the files, so what the twin holds is read again
		if (place === "files" && twin) {
			void readTwinHoldings(actions, twin.id).then(
				(holdings) => setHeldKeys(holdings.itemKeys),
				// what is marked stays as it was
				() => undefined,
			);
			requestIndex();
		}
		// replaced, so Back leaves the page instead of walking the places
		const search = new URLSearchParams(params);
		search.set("in", next);
		setParams(search, { replace: true });
	};
	const handleAddFolder = async (twinId: string): Promise<void> => {
		setIsAddingFolder(true);
		try {
			// asked for a folder that is there, the server makes a numbered one beside it
			if (!(await hasTwinFolder(actions, twinId)))
				await createTwinFolder(actions, twinId);
			setIsFolderAdded(true);
		} catch (cause) {
			toast.error("The files folder could not be added.", {
				description: cause instanceof Error ? cause.message : undefined,
			});
		} finally {
			setIsAddingFolder(false);
		}
	};
	const isFinding = place === TWIN_FINDER.id;
	// what a list marks as in the twin, by what its viewer knows each item by
	const savedItems = {
		isSaved: (itemKey: string) =>
			(heldKeys ?? twin?.itemKeys)?.has(itemKey) ?? false,
		label: "In your Digital Twin",
	};
	let body: ReactNode;
	if (!twin) {
		body = contents.error ? (
			<Alert variant="destructive" className="m-4 w-auto">
				<AlertTitle>Could not load your Digital Twin</AlertTitle>
				<AlertDescription>
					{contents.error}
					<Button
						type="button"
						variant="outline"
						onClick={contents.reload}
					>
						Try again
					</Button>
				</AlertDescription>
			</Alert>
		) : (
			<div className="flex flex-col gap-3 p-4">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-64 w-full" />
				<output className="sr-only">Loading your Digital Twin…</output>
			</div>
		);
	} else if (place === TWIN_FINDER.id) {
		// drawn beside the other places, where it is kept while they show
		body = null;
	} else if (place !== "files") {
		body = (
			<TwinSourceViewer
				source={place}
				savedItems={savedItems}
				// the viewer saved into this page's files; the copy reads them from the same insight
				onSaved={(file) => void handleSaved(twin.id, file)}
			/>
		);
	} else if (twin.hasFolder || isFolderAdded) {
		body = (
			<div className="flex h-full min-h-0 flex-col p-3">
				<RoutineDocumentsDock
					config={{
						mode: { type: "APP", app: twin.id },
						rootPath: TWIN_FILES_PATH,
					}}
					components={FILE_PANEL_COMPONENTS}
				/>
			</div>
		);
	} else {
		body = (
			<div className="flex flex-col items-start gap-3 p-4">
				<P className="max-w-prose text-muted-foreground text-sm">
					Your Digital Twin has no files folder yet. Add it to upload
					files here. Saving something from Outlook, Teams or OneDrive
					adds it too.
				</P>
				<Button
					type="button"
					className="pointer-coarse:min-h-11"
					disabled={isAddingFolder}
					onClick={() => void handleAddFolder(twin.id)}
				>
					{isAddingFolder ? (
						<Spinner aria-hidden="true" />
					) : (
						<FolderPlus aria-hidden="true" />
					)}
					{isAddingFolder ? "Adding…" : "Add the files folder"}
				</Button>
			</div>
		);
	}

	return (
		<div className="flex min-h-0 min-w-0 flex-1 flex-col bg-background">
			<header className="flex shrink-0 items-center gap-2 border-b px-3 py-3 md:gap-3 md:px-4">
				<Button
					asChild
					variant="ghost"
					size="icon-sm"
					className="pointer-coarse:size-11 shrink-0"
				>
					<Link
						to={twin ? twinSettingsPath(twin.id) : "/twins"}
						aria-label="Back to your Digital Twin"
					>
						<ArrowLeft aria-hidden="true" />
					</Link>
				</Button>
				<div className="min-w-0 flex-1">
					<H1 className="wrap-anywhere font-medium text-base leading-snug tracking-normal sm:text-lg">
						{twin
							? `What ${twin.name} knows`
							: "What your Digital Twin knows"}
					</H1>
					{/* a phone keeps the room for the list; each place says what it holds */}
					<P className="hidden text-muted-foreground text-sm sm:block">
						Copies of the emails, Teams chats and files you choose.
						The people you share your Digital Twin with can open
						them.
					</P>
				</div>
			</header>
			<div className="flex min-h-0 flex-1 flex-col md:flex-row">
				<TopicContentsNav
					groups={GROUPS}
					place={place}
					onPlaceChange={handlePlaceChange}
				/>
				<section
					aria-labelledby={labelId}
					className={cn(
						"flex min-h-0 min-w-0 flex-1 flex-col",
						// rows with nothing to read beside them stay a readable width on a wide screen
						place !== "files" && "xl:max-w-4xl xl:border-r",
					)}
				>
					<div className="shrink-0 border-b px-4 py-3">
						<H2
							id={labelId}
							className="flex items-center gap-2 font-medium text-base leading-snug tracking-normal"
						>
							<PlaceIcon
								aria-hidden="true"
								className="size-4 shrink-0"
							/>
							{PLACES[place].label}
						</H2>
						<P className="text-muted-foreground text-sm">
							{PLACES[place].description}
						</P>
					</div>
					{/* not one of the places that start fresh: what it found is still there when the owner comes back to it */}
					{twin && (
						<div
							className={cn(
								"min-h-0 flex-1",
								!isFinding && "hidden",
							)}
						>
							<TwinKnowledgeFinder
								// another twin is asked for something else
								key={twin.id}
								savedItems={savedItems}
								// saved into this page's files, as a viewer saves; busy until the copy is in the twin
								onSaved={(file) => handleSaved(twin.id, file)}
							/>
						</div>
					)}
					{/* each place starts fresh, as a topic's places do */}
					<div
						key={place}
						className={cn(
							"min-h-0 flex-1",
							twin && isFinding && "hidden",
						)}
					>
						{body}
					</div>
					{place !== "files" && (
						// always there and tall enough for its button, so neither the first result nor the offer moves the list
						<div className="flex min-h-12 shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-t px-4 py-2">
							{/* the toast announces each result */}
							{/* wide enough to read before a button is let onto its line */}
							<P className="wrap-anywhere line-clamp-2 min-w-0 flex-1 basis-48 text-muted-foreground text-sm">
								{status ||
									(isFinding
										? "Add a suggestion to copy it into your Digital Twin."
										: "Save an item to copy it into your Digital Twin.")}
							</P>
							{twin && attachments.pending > 0 && (
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="pointer-coarse:min-h-11 shrink-0"
									disabled={attachments.isSaving}
									onClick={() =>
										void handleAddAttachments(twin.id)
									}
								>
									{attachments.isSaving && (
										<Spinner aria-hidden="true" />
									)}
									{attachments.pending === 1
										? "Add the email's attachments"
										: `Add the attachments of ${attachments.pending} emails`}
								</Button>
							)}
							{twin && meetings.length > 0 && (
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="pointer-coarse:min-h-11 shrink-0"
									disabled={isAddingTranscripts}
									onClick={() =>
										void handleAddTranscripts(twin.id)
									}
								>
									{isAddingTranscripts && (
										<Spinner aria-hidden="true" />
									)}
									{meetings.length === 1
										? "Add the meeting's transcript"
										: `Add the transcripts of ${meetings.length} meetings`}
								</Button>
							)}
						</div>
					)}
				</section>
			</div>
		</div>
	);
}
