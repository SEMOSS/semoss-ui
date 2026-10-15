import { Paperclip } from "lucide-react";
import { useEffect, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Button,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	Popover,
	PopoverContent,
	PopoverTrigger,
	z,
} from "@semoss/ui/next";
import { callPixel, pixel } from "@/lib/pixel";

const assetSchema = z.array(
	z.object({ path: z.string(), type: z.string().nullish() }),
);

/** Pick a file from this room's folder to attach. */
export function AttachRoomFile({
	selected,
	disabled,
	onAttach,
}: {
	selected: string[];
	disabled?: boolean;
	onAttach: (path: string) => void;
}) {
	const { actions } = useInsight();
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [files, setFiles] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!open) return;
		let cancelled = false;
		setLoading(true);
		const timer = setTimeout(() => {
			callPixel(
				actions,
				// An empty term lists everything; the reactor requires one.
				pixel(
					"SearchInsightAssets",
					search.trim()
						? { filePath: "", search: search.trim() }
						: { filePath: "", search: ".*", options: ["regex"] },
				),
				assetSchema,
			)
				.then((rows) => {
					if (cancelled) return;
					setFiles(
						rows
							.filter((row) => row.type !== "directory")
							.map((row) => row.path.replace(/^[/\\]+/, ""))
							// Hidden tool folders such as .claude are not user files.
							.filter(
								(path) =>
									!path
										.split("/")
										.some((p) => p.startsWith(".")),
							)
							.slice(0, 50),
					);
				})
				.catch(() => !cancelled && setFiles([]))
				.finally(() => !cancelled && setLoading(false));
		}, 200);
		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [actions, open, search]);

	const available = files.filter((path) => !selected.includes(path));

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="self-start"
					disabled={disabled}
				>
					<Paperclip aria-hidden="true" className="size-3.5" />
					Attach file
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-80 p-0">
				<Command shouldFilter={false}>
					<CommandInput
						placeholder="Search this room's files"
						value={search}
						onValueChange={setSearch}
					/>
					<CommandList>
						<CommandEmpty>
							{loading ? "Searching..." : "No files found"}
						</CommandEmpty>
						<CommandGroup>
							{available.map((path) => (
								<CommandItem
									key={path}
									value={path}
									onSelect={() => {
										onAttach(path);
										setOpen(false);
									}}
								>
									<span className="wrap-break-word font-mono text-xs">
										{path}
									</span>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
