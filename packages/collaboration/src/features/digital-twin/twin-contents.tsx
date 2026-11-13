import { ArrowLeft, File, FolderPlus } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
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
import { RoutineDocumentsDock } from "@/features/routines/routine-documents-dock";
import {
	TopicContentsNav,
	type TopicPlaceGroup,
} from "@/features/topic-contents/topic-contents-nav";
import type { InsightActions } from "@/lib/pixel";
import {
	copyToTwin,
	createTwinFolder,
	getMyTwin,
	hasTwinFolder,
	readTwinHoldings,
	TWIN_FILES_PATH,
	type TwinCopy,
} from "./api/digital-twin";
import { TwinSourceViewer } from "./twin-source-viewer";
import { TWIN_SOURCES } from "./twin-sources";
import { useTwinRead } from "./use-twin-read";

// what each place is called in the rail, and what it says above its list
const PLACES = {
	files: {
		label: "Files",
		icon: File,
		description:
			"The copies your Digital Twin answers from. Upload more, or open, rename and delete what is here.",
	},
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
		places: Object.entries(TWIN_SOURCES).map(([id, source]) => ({
			id,
			...source,
		})),
	},
];

/** The owner's twin and what it holds, or null when they have no twin. */
const readContents = async (actions: InsightActions) => {
	const twin = await getMyTwin(actions);
	return twin && { ...twin, ...(await readTwinHoldings(actions, twin.id)) };
};

/**
 * A full page for choosing what the owner's Digital Twin knows: its own files,
 * and the owner's Outlook, Teams chats, OneDrive and Teams files to add from.
 * A viewer saves an item into the page's files, as it does in a chat, and the
 * page then copies it into the twin. A list marks what the twin already holds
 * a copy of, whenever it was added. The copy is a snapshot: nothing here
 * reads the owner's account again later.
 */
export function TwinContents() {
	const { actions } = useInsight();
	const [params, setParams] = useSearchParams();
	const labelId = useId();
	const contents = useTwinRead(readContents);
	// set once the folder is known to be there: added here, or made by a copy
	const [isFolderAdded, setIsFolderAdded] = useState(false);
	const [isAddingFolder, setIsAddingFolder] = useState(false);
	const [status, setStatus] = useState("");
	// what a viewer's list marks as in the twin, by what the viewer knows each item by: what the page
	// read, until the page adds to it or reads it again
	const [heldKeys, setHeldKeys] = useState<ReadonlySet<string>>();
	const twin = contents.data;
	if (twin === null) return <Navigate to="/twins/mine" replace />;

	const requested = params.get("in");
	const place = isPlace(requested) ? requested : "files";

	const markHeld = (itemKey: string | undefined, isHeld: boolean): void => {
		if (!itemKey) return;
		setHeldKeys((current) => {
			const keys = new Set(current ?? twin?.itemKeys);
			if (isHeld) keys.add(itemKey);
			else keys.delete(itemKey);
			return keys;
		});
	};
	const handleSaved = async (
		twinId: string,
		file: ConnectorSavedFile,
	): Promise<void> => {
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
			return;
		}
		// again: what the twin holds may have been read while this copy was on its way
		markHeld(file.itemKey, true);
		// the copy makes the folders it lands in
		setIsFolderAdded(true);
		setStatus(`Added "${file.name}" to your Digital Twin.`);
		toast.success(`Added "${file.name}" to your Digital Twin.`);
		if (copy.recordError) {
			toast.warning(
				`"${file.name}" will not show as added once this page is reloaded.`,
				{ description: copy.recordError },
			);
		}
	};
	const handlePlaceChange = (next: string): void => {
		// the owner may have deleted a copy among the files, so what the twin holds is read again
		if (place === "files" && twin) {
			void readTwinHoldings(actions, twin.id).then(
				(holdings) => setHeldKeys(holdings.itemKeys),
				// what is marked stays as it was
				() => undefined,
			);
		}
		// replaced, so Back leaves the page instead of walking the places
		setParams({ in: next }, { replace: true });
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
	} else if (place !== "files") {
		body = (
			<TwinSourceViewer
				source={place}
				savedItems={{
					isSaved: (itemKey) =>
						(heldKeys ?? twin.itemKeys).has(itemKey),
					label: "In your Digital Twin",
				}}
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
						to="/twins/mine"
						aria-label="Back to your Digital Twin"
					>
						<ArrowLeft aria-hidden="true" />
					</Link>
				</Button>
				<div className="min-w-0 flex-1">
					<H1 className="wrap-anywhere font-medium text-base leading-snug tracking-normal sm:text-lg">
						What your Digital Twin knows
					</H1>
					{/* a phone keeps the room for the list; each place says what it holds */}
					<P className="hidden text-muted-foreground text-sm sm:block">
						Copies of the emails, Teams chats and files you choose.
						The people you share your Digital Twin with can open
						them.
					</P>
				</div>
				<Button asChild className="pointer-coarse:min-h-11 shrink-0">
					<Link to="/twins/mine">Done</Link>
				</Button>
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
							className="font-medium text-base leading-snug tracking-normal"
						>
							{PLACES[place].label}
						</H2>
						<P className="text-muted-foreground text-sm">
							{PLACES[place].description}
						</P>
					</div>
					{/* each place starts fresh, as a topic's places do */}
					<div key={place} className="min-h-0 flex-1">
						{body}
					</div>
					{place !== "files" && (
						// always there, so the first result does not move the list; the toast announces it
						<P className="wrap-anywhere line-clamp-2 shrink-0 border-t px-4 py-2 text-muted-foreground text-sm">
							{status ||
								"Save an item to copy it into your Digital Twin."}
						</P>
					)}
				</section>
			</div>
		</div>
	);
}
