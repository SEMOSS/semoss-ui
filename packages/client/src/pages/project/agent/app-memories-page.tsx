import { Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { runPixel, usePixel } from "@semoss/sdk/react";
import {
	Badge,
	Button,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	toast,
} from "@semoss/ui/next";
import { useProject } from "@/hooks";

interface Memory {
	memory_id: string;
	event_type: string;
	content: string;
	user_id: string;
	date_created: string;
}

interface ListMemoriesResult {
	memories: Memory[];
	total_count: number;
	has_more: boolean;
}

const PAGE_SIZE = 25;

/**
 * Memories shared with this project, promoted here from a personal
 * conversation (see PromoteMemoryToWorkspaceReactor). Mirrors the knowledge
 * base tab's shape: read access follows the tab's own restrict list (view
 * access), enforced again server-side by ListMemories.
 */
export const AppMemoriesPage = () => {
	const { project } = useProject();
	const workspaceId = project.project_id;

	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [offset, setOffset] = useState(0);
	const [memories, setMemories] = useState<Memory[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const [hasMore, setHasMore] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(search);
			setOffset(0);
		}, 400);
		return () => clearTimeout(timer);
	}, [search]);

	const listMemories = usePixel<ListMemoriesResult>(
		`ListMemories(workspaceId=${JSON.stringify(workspaceId)}${debouncedSearch ? `, search=${JSON.stringify(debouncedSearch)}` : ""}, includeSuperseded=true, limit=${PAGE_SIZE}, offset=${offset});`,
		{ data: { memories: [], total_count: 0, has_more: false } },
	);

	useEffect(() => {
		if (listMemories.status === "SUCCESS") {
			setMemories(listMemories.data.memories ?? []);
			setTotalCount(listMemories.data.total_count ?? 0);
			setHasMore(listMemories.data.has_more ?? false);
		} else if (listMemories.status === "ERROR") {
			toast.error(String(listMemories.error));
		}
	}, [listMemories.status, listMemories.data, listMemories.error]);

	const handleUnshare = async (memoryId: string) => {
		setDeletingId(memoryId);
		try {
			const response = await runPixel(
				`PromoteMemoryToWorkspace(memoryId=${JSON.stringify(memoryId)});`,
			);
			const firstResult = response?.pixelReturn?.[0];
			if (firstResult?.operationType?.includes("ERROR")) {
				throw new Error(String(firstResult.output));
			}
			toast.success("Memory removed from project");
			setMemories((prev) => prev.filter((m) => m.memory_id !== memoryId));
			listMemories.refresh();
		} catch (error) {
			toast.error(`Failed to remove memory from project: ${error}`);
		} finally {
			setDeletingId(null);
		}
	};

	return (
		<div className="flex flex-col gap-4">
			<div>
				<h2 className="font-semibold text-base">Shared Memories</h2>
				<p className="text-muted-foreground text-sm">
					Memories promoted to this project, visible to everyone with
					access to it.
				</p>
			</div>
			<InputGroup className="max-w-sm">
				<InputGroupAddon>
					<Search className="size-4" />
				</InputGroupAddon>
				<InputGroupInput
					placeholder="Search memory content"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					aria-label="Search memory content"
				/>
			</InputGroup>
			<div className="overflow-auto rounded-md border">
				<table className="w-full text-sm">
					<thead className="bg-muted/50">
						<tr>
							<th className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground">
								Type
							</th>
							<th className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground">
								Content
							</th>
							<th className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground">
								Shared By
							</th>
							<th className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground">
								<span className="sr-only">Actions</span>
							</th>
						</tr>
					</thead>
					<tbody>
						{memories.length === 0 ? (
							<tr>
								<td
									colSpan={4}
									className="py-8 text-center text-muted-foreground"
								>
									No memories have been shared with this
									project yet.
								</td>
							</tr>
						) : (
							memories.map((memory) => (
								<tr key={memory.memory_id} className="border-t">
									<td className="px-3 py-2 align-middle">
										<Badge
											variant="outline"
											className="font-normal"
										>
											{memory.event_type}
										</Badge>
									</td>
									<td className="max-w-md px-3 py-2 align-middle">
										<div className="line-clamp-2">
											{memory.content}
										</div>
									</td>
									<td className="whitespace-nowrap px-3 py-2 align-middle text-muted-foreground">
										{memory.user_id}
									</td>
									<td className="px-3 py-2 align-middle">
										<Button
											variant="ghost"
											size="icon"
											aria-label={`Remove memory from project: ${memory.content.slice(0, 40)}`}
											disabled={
												deletingId === memory.memory_id
											}
											onClick={() =>
												handleUnshare(memory.memory_id)
											}
										>
											<Trash2 className="size-4" />
										</Button>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
			<div className="flex items-center justify-between text-muted-foreground text-sm">
				<span>{totalCount} total</span>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={offset === 0}
						onClick={() =>
							setOffset((prev) => Math.max(0, prev - PAGE_SIZE))
						}
					>
						Previous
					</Button>
					<Button
						variant="outline"
						size="sm"
						disabled={!hasMore}
						onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
					>
						Next
					</Button>
				</div>
			</div>
		</div>
	);
};
