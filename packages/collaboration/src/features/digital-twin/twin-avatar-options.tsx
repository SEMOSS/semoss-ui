import { Sparkles } from "lucide-react";
import { useId, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Button,
	FieldDescription,
	Label,
	P,
	RadioGroup,
	RadioGroupItem,
	Skeleton,
	Spinner,
	Textarea,
} from "@semoss/ui/next";
import { generateTwinAvatar, type TwinAvatarOption } from "./api/digital-twin";

/** One of a run's three tiles. */
type Tile =
	| { status: "pending" }
	| { status: "ready"; option: TwinAvatarOption }
	| { status: "failed"; reason: string }
	// the server has no photo of the owner and was sent no description
	| { status: "undescribed" };

const PENDING: Tile[] = [
	{ status: "pending" },
	{ status: "pending" },
	{ status: "pending" },
];

interface TwinAvatarOptionsProps {
	/** The image the form holds now; the option it came from shows as picked. */
	image: File | null | undefined;
	/** Called with the file of the option the owner picks. */
	onPick: (file: File) => void;
	/** True while the form around it is saving. */
	isDisabled?: boolean;
}

/**
 * Avatar options for a Digital Twin, made when asked: three at a time, each
 * in a different look, from the owner's Microsoft profile photo, or from a
 * description when the server has no photo of them. Picking one hands its
 * file to the form around it, which uploads it when it saves; nothing is
 * saved here.
 */
export function TwinAvatarOptions({
	image,
	onPick,
	isDisabled = false,
}: TwinAvatarOptionsProps) {
	const id = useId();
	const { actions } = useInsight();
	const [tiles, setTiles] = useState<Tile[]>([]);
	const [isGenerating, setIsGenerating] = useState(false);
	const [needsDescription, setNeedsDescription] = useState(false);
	const [description, setDescription] = useState("");
	const [error, setError] = useState("");
	// the look the next run starts at; the server counts it round the looks it has
	const nextLook = useRef<number | null>(null);

	const hasOptions = tiles.some((tile) => tile.status === "ready");
	// read from the form, so choosing a file or saving clears the pick with no state of its own
	const picked = tiles.findIndex(
		(tile) => tile.status === "ready" && tile.option.file === image,
	);

	const handleGenerate = async (): Promise<void> => {
		const look = needsDescription ? description.trim() : undefined;
		// three in a row are three different looks, and the next run moves on to the three after them;
		// where the first run starts is left to chance, so not everyone is shown the same three
		const first = nextLook.current ?? Math.floor(Math.random() * 1000);
		nextLook.current = first + PENDING.length;
		setError("");
		setIsGenerating(true);
		setTiles(PENDING);
		// one request per option, so each tile fills in as its own picture arrives
		const made = await Promise.all(
			PENDING.map(async (_, index): Promise<Tile> => {
				let tile: Tile;
				try {
					const option = await generateTwinAvatar(
						actions,
						look,
						first + index,
					);
					tile = option
						? { status: "ready", option }
						: { status: "undescribed" };
				} catch (cause) {
					tile = {
						status: "failed",
						reason:
							cause instanceof Error
								? cause.message
								: "That did not work.",
					};
				}
				setTiles((current) =>
					current.map((was, at) => (at === index ? tile : was)),
				);
				return tile;
			}),
		);
		setIsGenerating(false);
		if (made.some((tile) => tile.status === "ready")) return;
		// nothing to pick from: say why, in place of three empty tiles
		setTiles([]);
		if (made.some((tile) => tile.status === "undescribed")) {
			setNeedsDescription(true);
			return;
		}
		const reasons = made.flatMap((tile) =>
			tile.status === "failed" ? [tile.reason] : [],
		);
		setError(reasons[0] ?? "No options could be made.");
	};

	let progress = "";
	if (isGenerating)
		progress = "Making three options. This can take a minute.";
	else if (hasOptions) progress = "Pick one, or regenerate for three more.";

	return (
		<div className="flex min-w-0 flex-col gap-3">
			{needsDescription && (
				<div className="flex min-w-0 flex-col gap-2">
					<Label htmlFor={`${id}-look`}>Describe your avatar</Label>
					<Textarea
						id={`${id}-look`}
						value={description}
						onChange={(event) => setDescription(event.target.value)}
						maxLength={500}
						rows={3}
						disabled={isGenerating || isDisabled}
						aria-describedby={`${id}-look-hint`}
					/>
					<FieldDescription id={`${id}-look-hint`}>
						We could not find a Microsoft profile photo for you.
						Describe the look you want, such as hair, glasses and
						clothes.
					</FieldDescription>
				</div>
			)}
			<div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
				<Button
					type="button"
					variant="outline"
					disabled={
						isGenerating ||
						isDisabled ||
						(needsDescription && !description.trim())
					}
					onClick={() => void handleGenerate()}
					className="pointer-coarse:min-h-11"
				>
					{isGenerating ? (
						<Spinner aria-hidden="true" data-icon="inline-start" />
					) : (
						<Sparkles aria-hidden="true" data-icon="inline-start" />
					)}
					{isGenerating && "Generating…"}
					{!isGenerating &&
						(hasOptions ? "Regenerate" : "Generate options")}
				</Button>
				{/* always there, so a screen reader hears each change */}
				<output className="min-w-0 text-muted-foreground text-sm">
					{progress}
				</output>
			</div>
			{!needsDescription && tiles.length === 0 && (
				<FieldDescription>
					Makes three options from your Microsoft profile photo.
					Without one, you describe the look.
				</FieldDescription>
			)}
			{error && (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
			{tiles.length > 0 && (
				<>
					<P id={`${id}-options`} className="font-medium text-sm">
						Avatar options
					</P>
					<RadioGroup
						aria-labelledby={`${id}-options`}
						value={picked < 0 ? "" : String(picked)}
						onValueChange={(value) => {
							const tile = tiles[Number(value)];
							if (tile?.status === "ready")
								onPick(tile.option.file);
						}}
						disabled={isDisabled}
						className="@container grid max-w-md grid-cols-3 gap-2"
					>
						{tiles.map((tile, index) => {
							const name = `Option ${index + 1}`;
							// every tile is a square over one line, so none moves as the pictures arrive; the
							// line is smaller where three tiles are narrow, so a phone does not wrap it
							if (tile.status !== "ready") {
								return (
									<div
										key={name}
										className="flex min-w-0 flex-col gap-2 rounded-lg border border-border p-2"
									>
										{tile.status === "failed" ? (
											<div className="flex aspect-square w-full items-center justify-center rounded-md bg-muted p-1 text-center text-muted-foreground text-xs">
												Could not make this one
											</div>
										) : (
											<Skeleton className="aspect-square w-full" />
										)}
										<span className="flex min-h-5 items-center @xs:text-sm text-muted-foreground text-xs">
											{name}
										</span>
									</div>
								);
							}
							return (
								<Label
									key={name}
									htmlFor={`${id}-${index}`}
									className="flex min-w-0 cursor-pointer flex-col items-stretch gap-2 rounded-lg border border-border p-2 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5"
								>
									<img
										src={tile.option.url}
										alt=""
										className="aspect-square w-full rounded-md object-cover"
									/>
									<span className="flex min-h-5 min-w-0 items-center gap-2 font-normal @xs:text-sm text-xs">
										<RadioGroupItem
											id={`${id}-${index}`}
											value={String(index)}
										/>
										{name}
									</span>
								</Label>
							);
						})}
					</RadioGroup>
				</>
			)}
		</div>
	);
}
