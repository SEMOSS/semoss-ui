import { ChevronDownIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Muted,
	Popover,
	PopoverAnchor,
	PopoverContent,
} from "@semoss/ui/next";
import { normalizeFolderPath } from "./file-explorer.helpers";

interface MoveFilesDialogProps {
	open: boolean;
	selectedCount: number;
	suggestions: string[];
	onOpenChange: (open: boolean) => void;
	onMove: (destination: string) => void | Promise<void>;
}

export const MoveFilesDialog: React.FC<MoveFilesDialogProps> = ({
	open,
	selectedCount,
	suggestions,
	onOpenChange,
	onMove,
}) => {
	const [destination, setDestination] = useState("");
	const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
	const [suggestionWidth, setSuggestionWidth] = useState<number>(0);
	const inputRef = useRef<HTMLInputElement>(null);
	const inputGroupRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) {
			setDestination("");
			setIsSuggestionOpen(false);
			return;
		}

		requestAnimationFrame(() => {
			inputRef.current?.focus();
		});

		const updateWidth = () => {
			const width = inputGroupRef.current?.offsetWidth ?? 0;
			setSuggestionWidth(width);
		};

		updateWidth();
		window.addEventListener("resize", updateWidth);

		if (typeof ResizeObserver !== "undefined") {
			const observer = new ResizeObserver(updateWidth);
			if (inputGroupRef.current) {
				observer.observe(inputGroupRef.current);
			}
			return () => {
				window.removeEventListener("resize", updateWidth);
				observer.disconnect();
			};
		}

		return () => {
			window.removeEventListener("resize", updateWidth);
		};
	}, [open]);

	const normalizedSuggestions = useMemo(
		() =>
			Array.from(
				new Set(
					suggestions.map((folderPath) =>
						normalizeFolderPath(folderPath),
					),
				),
			),
		[suggestions],
	);
	const normalizedDestination = useMemo(
		() => normalizeFolderPath(destination),
		[destination],
	);
	const doesDestinationExist = useMemo(
		() =>
			destination.trim().length > 0 &&
			normalizedSuggestions.includes(normalizedDestination),
		[destination, normalizedDestination, normalizedSuggestions],
	);
	const filteredSuggestions = useMemo(() => {
		const normalized = destination.trim().toLowerCase();
		if (!normalized) {
			return suggestions;
		}

		const normalizedFolderInput = normalizeFolderPath(normalized);
		return suggestions
			.map((folderPath) => {
				const normalizedPath =
					normalizeFolderPath(folderPath).toLowerCase();
				let score = 4;
				if (normalizedPath === normalizedFolderInput) {
					score = 0;
				} else if (normalizedPath.startsWith(normalizedFolderInput)) {
					score = 1;
				} else if (
					normalizedPath.includes(
						`/${normalizedFolderInput.replace(/^\/+/, "")}`,
					)
				) {
					score = 2;
				} else if (normalizedPath.includes(normalized)) {
					score = 3;
				}

				return { folderPath, score };
			})
			.filter((entry) => entry.score < 4)
			.sort((a, b) => {
				if (a.score !== b.score) {
					return a.score - b.score;
				}
				if (a.folderPath.length !== b.folderPath.length) {
					return a.folderPath.length - b.folderPath.length;
				}
				return a.folderPath.localeCompare(b.folderPath);
			})
			.map((entry) => entry.folderPath);
	}, [destination, suggestions]);

	const canSubmit = destination.trim().length > 0;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Move Files</DialogTitle>
					<DialogDescription>
						Enter the destination path to move {selectedCount}{" "}
						selected item(s).
					</DialogDescription>
				</DialogHeader>
				<div className="pt-2 pb-1">
					<Popover
						open={isSuggestionOpen}
						onOpenChange={setIsSuggestionOpen}
					>
						<PopoverAnchor asChild>
							<div ref={inputGroupRef}>
								<InputGroup>
									<InputGroupInput
										ref={inputRef}
										placeholder="Destination path (e.g., /folder, or / for root)"
										value={destination}
										onChange={(e) => {
											setDestination(e.target.value);
											setIsSuggestionOpen(true);
										}}
										onKeyDown={(e) => {
											if (
												e.key === "Enter" &&
												canSubmit
											) {
												e.preventDefault();
												setIsSuggestionOpen(false);
												onMove(destination);
											}
										}}
									/>
									<InputGroupAddon align="inline-end">
										{destination.trim() &&
											!doesDestinationExist && (
												<span className="mr-1 rounded bg-primary/10 px-1.5 py-0.5 font-medium text-[10px] text-primary">
													New
												</span>
											)}
										<Button
											variant="ghost"
											size="icon-sm"
											aria-label="Select destination folder"
											onClick={() =>
												setIsSuggestionOpen(
													(prev) => !prev,
												)
											}
										>
											<ChevronDownIcon className="size-3" />
										</Button>
									</InputGroupAddon>
								</InputGroup>
							</div>
						</PopoverAnchor>
						<PopoverContent
							align="start"
							className="max-h-64 overflow-y-auto p-1"
							style={
								suggestionWidth
									? { width: suggestionWidth }
									: undefined
							}
							onOpenAutoFocus={(e) => e.preventDefault()}
							onCloseAutoFocus={(e) => e.preventDefault()}
						>
							{filteredSuggestions.length === 0 ? (
								<Muted className="px-2 py-1.5 text-xs">
									No matching folders
								</Muted>
							) : (
								filteredSuggestions.map((folderPath) => (
									<button
										key={folderPath}
										type="button"
										className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
										onClick={() => {
											setDestination(folderPath);
											setIsSuggestionOpen(false);
										}}
									>
										{folderPath}
									</button>
								))
							)}
						</PopoverContent>
					</Popover>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						onClick={() => onMove(destination)}
						disabled={!canSubmit}
					>
						Move
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
