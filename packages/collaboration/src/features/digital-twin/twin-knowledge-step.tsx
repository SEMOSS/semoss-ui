import { ListChecks, Upload, X } from "lucide-react";
import { useId, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import { Button, FileDropzone, H3, P, Spinner, toast } from "@semoss/ui/next";
import { uploadRoomFiles } from "@/features/rooms/api/upload-room-files";
import {
	TopicContentsNav,
	type TopicPlaceGroup,
} from "@/features/topic-contents/topic-contents-nav";
import type { TwinSource } from "./api/digital-twin";
import { TwinSourceViewer } from "./twin-source-viewer";
import {
	TWIN_SOURCES,
	type TwinSourceId,
	twinSourceKind,
} from "./twin-sources";

// the two places that are not one of the owner's Microsoft 365 apps
const CHOSEN = {
	label: "What you chose",
	description:
		"Copies of these go into your Digital Twin when it is created. Until then they wait here, and you can take any of them back out.",
};
const UPLOAD = {
	label: "Your computer",
	description:
		"Files from this computer, such as a project plan or a slide deck. They are added to your Digital Twin as they are.",
};
const isSource = (place: string): place is TwinSourceId =>
	place in TWIN_SOURCES;

interface TwinKnowledgeStepProps {
	/** What the owner chose so far, in the order they chose it. */
	items: TwinSource[];
	/** Takes an item once it is in the page's files: saved by a viewer, or uploaded. */
	onAdd: (source: TwinSource) => void;
	/** Takes an item back out of the choice. */
	onRemove: (source: TwinSource) => void;
}

/**
 * The step of creating a Digital Twin that chooses what it knows: the
 * owner's Outlook, Teams chats, OneDrive, Teams files and computer to pick
 * from, and the list of what was picked. There is no twin yet to copy into,
 * so each pick only waits in the page's files for the create that copies it.
 */
export function TwinKnowledgeStep({
	items,
	onAdd,
	onRemove,
}: TwinKnowledgeStepProps) {
	const { insightId } = useInsight();
	const labelId = useId();
	const [place, setPlace] = useState("outlook");
	const [isUploading, setIsUploading] = useState(false);
	const [status, setStatus] = useState("");

	const handleAdd = (source: TwinSource): void => {
		onAdd(source);
		setStatus(
			`Chose "${source.name}". It is added when your Digital Twin is created.`,
		);
	};
	const handleUpload = async (files: File[]): Promise<void> => {
		setIsUploading(true);
		try {
			const uploaded = await uploadRoomFiles(insightId, files);
			for (const file of uploaded)
				handleAdd({ path: file.fileLocation, name: file.fileName });
		} catch (cause) {
			toast.error("Could not take those files.", {
				description: cause instanceof Error ? cause.message : undefined,
			});
		} finally {
			setIsUploading(false);
		}
	};

	const groups: TopicPlaceGroup[] = [
		{
			title: "For your twin",
			places: [
				{
					id: "chosen",
					label: CHOSEN.label,
					icon: ListChecks,
					count: items.length,
				},
			],
		},
		{
			title: "Add from",
			places: [
				...Object.entries(TWIN_SOURCES).map(([id, source]) => ({
					id,
					...source,
				})),
				{ id: "upload", label: UPLOAD.label, icon: Upload },
			],
		},
	];
	const current = isSource(place)
		? TWIN_SOURCES[place]
		: place === "upload"
			? UPLOAD
			: CHOSEN;
	return (
		<div className="flex min-w-0 flex-col overflow-hidden rounded-lg border md:h-128 md:flex-row">
			<TopicContentsNav
				groups={groups}
				place={place}
				onPlaceChange={setPlace}
			/>
			<section
				aria-labelledby={labelId}
				className="flex min-h-0 min-w-0 flex-1 flex-col"
			>
				<div className="shrink-0 border-b px-4 py-3">
					<H3
						id={labelId}
						className="font-medium text-base leading-snug"
					>
						{current.label}
					</H3>
					<P className="text-muted-foreground text-sm">
						{current.description}
					</P>
				</div>
				{/* each place starts fresh, as the places of the twin's own contents page do */}
				<div
					key={place}
					className="h-96 min-h-0 overflow-y-auto md:h-auto md:flex-1"
				>
					{isSource(place) ? (
						<TwinSourceViewer source={place} onSaved={handleAdd} />
					) : place === "upload" ? (
						<div className="flex flex-col gap-3 p-4">
							<FileDropzone
								multiple
								value={null}
								disabled={isUploading}
								description="Choose files, or drop them here"
								onChange={(value) => {
									const files = Array.isArray(value)
										? value
										: value
											? [value]
											: [];
									if (files.length) void handleUpload(files);
								}}
							/>
							{isUploading && (
								<output className="flex items-center gap-2 text-muted-foreground text-sm">
									<Spinner aria-hidden="true" />
									Taking your files…
								</output>
							)}
						</div>
					) : items.length > 0 ? (
						<ul className="divide-y">
							{items.map((item) => {
								const kind = twinSourceKind(item);
								return (
									<li
										key={item.path}
										className="flex min-w-0 items-center gap-3 px-4 py-2"
									>
										<kind.icon
											aria-hidden="true"
											className="size-4 shrink-0 text-muted-foreground"
										/>
										<div className="min-w-0 flex-1">
											<P className="wrap-anywhere text-sm">
												{item.name}
											</P>
											<P className="text-muted-foreground text-xs">
												{kind.label}
											</P>
										</div>
										<Button
											type="button"
											variant="ghost"
											size="icon-sm"
											className="pointer-coarse:size-11 shrink-0"
											aria-label={`Remove ${item.name}`}
											onClick={() => {
												onRemove(item);
												setStatus(
													`Took "${item.name}" back out.`,
												);
											}}
										>
											<X aria-hidden="true" />
										</Button>
									</li>
								);
							})}
						</ul>
					) : (
						<P className="p-4 text-muted-foreground text-sm">
							Nothing chosen yet. Pick a place under Add from,
							then save the emails, Teams chats and files your
							Digital Twin should answer from. You can also skip
							this and add them after it is created.
						</P>
					)}
				</div>
				{/* always there, so the first pick does not move the list; the count beside What you chose changes with it */}
				<output className="wrap-anywhere line-clamp-2 shrink-0 border-t px-4 py-2 text-muted-foreground text-sm">
					{status ||
						"Save an item to choose it for your Digital Twin."}
				</output>
			</section>
		</div>
	);
}
