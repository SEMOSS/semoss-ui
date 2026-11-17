import { StarIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { ProjectSelect } from "@semoss/shared";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
	Spinner,
	useDebouncedValue,
} from "@semoss/ui/next";
import {
	getDateBucket,
	parseTimestampWithUtcDefault,
} from "@semoss/utility/date";
import { useChatConfig } from "../../chat/config/use-chat-config";
import { RoomAgentAvatar } from "../list/room-agent-avatar";
import { getRoomDate } from "../list/room-list-groups";
import { useRoomSearch } from "./use-room-search";

/** The agent the results are narrowed to. */
interface AgentChoice {
	/** The agent's project id, sent as the search's `workspaceId`. */
	id: string;
	/** The agent's display name, shown on the picker. */
	name: string;
}

/** Props for {@link RoomSearchDialog}. */
export interface RoomSearchDialogProps {
	/** Whether the dialog is open; it only searches while it is. */
	open: boolean;
	/** Asks to open or close the dialog; choosing a room closes it. */
	onOpenChange: (open: boolean) => void;
}

/**
 * Search every chat by name and message text in one list, name matches first,
 * optionally for one agent. Each result shows its agent, whether it is a
 * favorite, and whether it waits on the user; choosing one opens the room.
 */
export const RoomSearchDialog = ({
	open,
	onOpenChange,
}: RoomSearchDialogProps) => {
	const { t } = useTranslation("sidebar");
	const { navigation } = useChatConfig();
	const [query, setQuery] = useState("");
	const [agent, setAgent] = useState<AgentChoice | null>(null);
	const debouncedQuery = useDebouncedValue(query);
	const { rooms, isLoading, isError } = useRoomSearch(
		debouncedQuery,
		agent?.id ?? null,
		open,
	);

	const isSearching = debouncedQuery.trim().length > 0;
	// still typing counts as pending, so the empty state does not flash between keystrokes
	const isPending = isLoading || query !== debouncedQuery;

	// closing starts the next search afresh
	const handleOpenChange = (next: boolean) => {
		if (!next) {
			setQuery("");
			setAgent(null);
		}
		onOpenChange(next);
	};

	const handleSelect = (roomId: string) => {
		handleOpenChange(false);
		navigation.openRoom(roomId);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent
				className="gap-0 overflow-hidden p-0 sm:max-w-xl"
				showCloseButton={false}
			>
				<DialogTitle className="sr-only">
					{t("searchChats.title")}
				</DialogTitle>
				<DialogDescription className="sr-only">
					{t("searchChats.description")}
				</DialogDescription>
				<Command shouldFilter={false}>
					<div className="flex items-center gap-2 border-b pe-2 [&_[data-slot=command-input-wrapper]]:flex-1 [&_[data-slot=command-input-wrapper]]:border-b-0">
						<CommandInput
							value={query}
							onValueChange={setQuery}
							placeholder={t("searchChats.placeholder")}
							aria-label={t("searchChats.placeholder")}
							className="h-11"
						/>
						<ProjectSelect
							name={agent?.name ?? ""}
							value={agent?.id ?? ""}
							onChange={(project) =>
								setAgent({
									id: project.project_id,
									name:
										project.project_display_name ||
										project.project_name,
								})
							}
							projectTypes={["WORKSPACE"]}
							showProjectImage
							modal
							noneOption={{
								label: t("searchChats.allAgents"),
								onSelect: () => setAgent(null),
							}}
							className="h-7 w-auto max-w-48 shrink-0 border-none bg-transparent px-2 text-muted-foreground text-xs shadow-none hover:bg-accent hover:text-foreground"
							popoverContentProps={{
								align: "end",
								className: "w-64",
							}}
						/>
					</div>
					<CommandList className="max-h-96 p-1">
						{isPending && rooms.length === 0 ? (
							<output className="flex items-center justify-center gap-2 py-6 text-muted-foreground text-sm">
								<Spinner className="size-4" />
								{t("searchChats.loading")}
							</output>
						) : null}
						{isError ? (
							<div
								role="alert"
								className="py-6 text-center text-destructive text-sm"
							>
								{t("messages.errorLoadingRooms")}
							</div>
						) : null}
						{!isPending && !isError ? (
							<CommandEmpty>
								{isSearching
									? t("searchChats.empty", {
											query: debouncedQuery.trim(),
										})
									: t("messages.noRoomsFound")}
							</CommandEmpty>
						) : null}
						{rooms.length > 0 ? (
							<CommandGroup
								heading={
									isSearching
										? t("searchChats.results")
										: t("searchChats.recent")
								}
								className="p-0"
							>
								{rooms.map((room) => {
									const bucket = getDateBucket(
										parseTimestampWithUtcDefault(
											getRoomDate(room),
										),
									);
									// the room is listed for a message, not its name
									const isMessageMatch =
										isSearching &&
										room.NAME_MATCH === false;
									return (
										<CommandItem
											key={room.ROOM_ID}
											value={room.ROOM_ID}
											onSelect={() =>
												handleSelect(room.ROOM_ID)
											}
											className="gap-2.5 py-1.5"
										>
											<RoomAgentAvatar
												workspaceId={room.WORKSPACE_ID}
												workspaceName={
													room.WORKSPACE_NAME
												}
											/>
											<span className="flex min-w-0 flex-1 flex-col">
												<span className="truncate font-medium">
													{room.ROOM_NAME ||
														t("messages.untitled")}
												</span>
												<span className="truncate text-muted-foreground text-xs">
													{room.WORKSPACE_NAME ||
														t("groups.noAgent")}
													{isMessageMatch
														? ` · ${t("searchChats.matchedMessage")}`
														: ""}
												</span>
											</span>
											{room.PINNED ? (
												<>
													<StarIcon
														className="size-3.5 fill-current text-muted-foreground"
														aria-hidden="true"
													/>
													<span className="sr-only">
														{t("buckets.favorites")}
													</span>
												</>
											) : null}
											<span className="shrink-0 text-muted-foreground text-xs">
												{t(`buckets.${bucket}`)}
											</span>
										</CommandItem>
									);
								})}
							</CommandGroup>
						) : null}
					</CommandList>
				</Command>
			</DialogContent>
		</Dialog>
	);
};
