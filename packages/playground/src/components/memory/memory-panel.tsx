import { BrainIcon, RefreshCwIcon, TrashIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useState } from "react";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { RoomStore } from "@/stores";

interface Memory {
	memory_id: string;
	memory_type: string;
	content: string;
	date_created: string;
}

interface MemoryPanelProps {
	/** Room store instance */
	room: RoomStore;
}

/**
 * Sidebar panel for viewing and managing stored AI memories.
 * Lists all memories for the current user and allows deletion.
 */
export const MemoryPanel: React.FC<MemoryPanelProps> = observer(({ room }) => {
	const [memories, setMemories] = useState<Memory[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const loadMemories = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await room.runRoomPixel<[{ memories: Memory[] }]>(
				`ListMemories();`,
				false,
				false,
			);

			if (response.errors.length > 0) {
				setError(response.errors.join(", "));
				return;
			}

			const output = response.pixelReturn[0]?.output;
			if (output && typeof output === "object" && "memories" in output) {
				setMemories(output.memories || []);
			} else {
				setMemories([]);
			}
		} catch (e) {
			setError(
				e instanceof Error ? e.message : "Failed to load memories",
			);
		} finally {
			setIsLoading(false);
		}
	}, [room]);

	const deleteMemory = useCallback(
		async (memoryId: string) => {
			try {
				await room.runRoomPixel(
					`DeleteMemory(memoryId=[${JSON.stringify(memoryId)}]);`,
					false,
					false,
				);
				setMemories((prev) =>
					prev.filter((m) => m.memory_id !== memoryId),
				);
			} catch (e) {
				setError(
					e instanceof Error ? e.message : "Failed to delete memory",
				);
			}
		},
		[room],
	);

	useEffect(() => {
		loadMemories();
	}, [loadMemories]);

	const typeColors: Record<string, string> = {
		FACT: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950",
		PREFERENCE:
			"text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950",
		CONTEXT:
			"text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950",
		INSTRUCTION:
			"text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950",
		SUMMARY: "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-950",
		EPISODE: "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950",
	};

	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center justify-between border-border border-b px-4 py-3">
				<div className="flex items-center gap-2">
					<BrainIcon className="size-4" />
					<span className="font-medium text-sm">
						Memories ({memories.length})
					</span>
				</div>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={loadMemories}
							disabled={isLoading}
						>
							<RefreshCwIcon
								className={`size-4 ${isLoading ? "animate-spin" : ""}`}
							/>
						</Button>
					</TooltipTrigger>
					<TooltipContent>Refresh</TooltipContent>
				</Tooltip>
			</div>

			<div className="flex-1 overflow-y-auto">
				{error && (
					<div className="m-4 rounded-md bg-destructive/10 p-3 text-destructive text-sm">
						{error}
					</div>
				)}

				{!isLoading && memories.length === 0 && !error && (
					<div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
						<BrainIcon className="size-8 text-muted-foreground" />
						<p className="text-muted-foreground text-sm">
							No memories stored yet.
						</p>
						<p className="text-muted-foreground text-xs">
							Enable memory in room settings, then the AI will
							remember important facts from your conversations.
						</p>
					</div>
				)}

				{memories.map((memory) => (
					<div
						key={memory.memory_id}
						className="group border-border border-b px-4 py-3 hover:bg-muted/50"
					>
						<div className="mb-1 flex items-start justify-between gap-2">
							<span
								className={`inline-block rounded-full px-2 py-0.5 font-medium text-xs ${
									typeColors[memory.memory_type] ||
									"bg-muted text-muted-foreground"
								}`}
							>
								{memory.memory_type}
							</span>
							<Button
								variant="ghost"
								size="icon-sm"
								className="invisible shrink-0 group-hover:visible"
								onClick={() => deleteMemory(memory.memory_id)}
							>
								<TrashIcon className="size-3.5 text-destructive" />
							</Button>
						</div>
						<p className="text-sm leading-relaxed">
							{memory.content}
						</p>
						{memory.date_created && (
							<p className="mt-1 text-muted-foreground text-xs">
								{new Date(
									memory.date_created,
								).toLocaleDateString()}
							</p>
						)}
					</div>
				))}
			</div>
		</div>
	);
});
