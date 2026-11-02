import {
	ArrowLeftIcon,
	CheckIcon,
	ChevronRightIcon,
	ChevronsUpDownIcon,
	HashIcon,
	UsersIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	Muted,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@semoss/ui/next";
import { ConnectorViewerStatus } from "../../components/connector-viewer-status";
import { useConnectorQuery } from "../../core/use-connector-query";
import { parseChannels } from "../microsoft.parsers";
import { MICROSOFT_PIXELS } from "../microsoft.pixels";
import type { TeamsTeam } from "../microsoft.types";
import type { TeamsChannelChoice } from "./use-teams-channel-choice";

const PAGE_SIZE = 50;

/** Props for {@link TeamsChannelPicker}. */
export interface TeamsChannelPickerProps {
	/** The location currently shown by the viewer. */
	choice: TeamsChannelChoice;
	/** Reconnects Microsoft when browsing requires a new sign-in. */
	onSignIn?: () => Promise<boolean>;
}

/** Search teams, then channels, without navigating until a channel is chosen. */
export const TeamsChannelPicker = ({
	choice,
	onSignIn,
}: TeamsChannelPickerProps) => {
	const { t } = useTranslation("connectors");
	const [isOpen, setIsOpen] = useState(false);
	const [browsedTeam, setBrowsedTeam] = useState<TeamsTeam | null>(null);
	const [search, setSearch] = useState("");
	const [limit, setLimit] = useState(PAGE_SIZE);
	const inputRef = useRef<HTMLInputElement>(null);
	const browseQuery = useConnectorQuery(
		isOpen && browsedTeam && browsedTeam.id !== choice.team?.id
			? MICROSOFT_PIXELS.teamsListChannels(browsedTeam.id)
			: null,
		parseChannels,
	);
	const query = browsedTeam
		? browsedTeam.id === choice.team?.id
			? choice.channelsQuery
			: browseQuery
		: choice.teamsQuery;
	const terms = search.trim().toLocaleLowerCase().split(/\s+/);
	const matches = (query.data ?? []).filter((item) => {
		const text =
			`${item.displayName} ${item.description ?? ""}`.toLocaleLowerCase();
		return terms.every((term) => text.includes(term));
	});
	const searchLabel = t(
		browsedTeam ? "teams.searchChannels" : "teams.searchTeams",
	);

	const handleBrowseTeam = (team: TeamsTeam | null) => {
		setBrowsedTeam(team);
		setSearch("");
		setLimit(PAGE_SIZE);
	};

	return (
		<Popover
			open={isOpen}
			onOpenChange={(open) => {
				if (open) handleBrowseTeam(choice.team);
				setIsOpen(open);
			}}
		>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					className="h-auto min-h-11 w-full min-w-0 justify-start px-2 py-1.5"
					aria-label={t("teams.changeLocation", {
						team: choice.team?.displayName ?? t("teams.chooseTeam"),
						channel:
							choice.channel?.displayName ??
							t("teams.chooseChannel"),
					})}
				>
					<HashIcon aria-hidden data-icon="inline-start" />
					<span className="flex min-w-0 flex-1 flex-col items-start text-start">
						<span className="w-full truncate font-normal text-muted-foreground text-xs">
							{choice.team?.displayName ?? t("teams.chooseTeam")}
						</span>
						<span className="w-full truncate">
							{choice.channel?.displayName ??
								t("teams.chooseChannel")}
						</span>
					</span>
					<ChevronsUpDownIcon aria-hidden data-icon="inline-end" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="start"
				collisionPadding={12}
				className="flex max-h-(--radix-popover-content-available-height) w-96 max-w-(--radix-popover-content-available-width) flex-col overflow-hidden p-0"
				aria-label={t("teams.chooseChannel")}
				onOpenAutoFocus={(event) => {
					event.preventDefault();
					inputRef.current?.focus();
				}}
			>
				<div className="flex shrink-0 flex-col gap-1 border-border border-b p-3">
					{browsedTeam ? (
						<>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="-ms-2 self-start"
								onClick={() => handleBrowseTeam(null)}
							>
								<ArrowLeftIcon
									aria-hidden
									data-icon="inline-start"
								/>
								{t("teams.allTeams")}
							</Button>
							<span className="wrap-anywhere font-medium text-sm">
								{browsedTeam.displayName}
							</span>
						</>
					) : (
						<span className="font-medium text-sm">
							{t("teams.chooseTeam")}
						</span>
					)}
				</div>
				<Command
					key={browsedTeam?.id ?? "teams"}
					shouldFilter={false}
					className="min-h-0"
				>
					<CommandInput
						ref={inputRef}
						autoFocus
						aria-label={searchLabel}
						placeholder={searchLabel}
						value={search}
						onValueChange={(value) => {
							setSearch(value);
							setLimit(PAGE_SIZE);
						}}
					/>
					<CommandList
						className="max-h-72 min-h-0"
						aria-label={searchLabel}
					>
						{query.status === "ready" ? (
							<>
								<CommandEmpty>
									<span className="block px-4">
										{search.trim()
											? t("common.noResults", {
													query: search.trim(),
												})
											: t(
													browsedTeam
														? "teams.noChannels"
														: "teams.noTeams",
												)}
									</span>
								</CommandEmpty>
								<CommandGroup>
									{matches.slice(0, limit).map((item) => {
										const isCurrent = browsedTeam
											? browsedTeam.id ===
													choice.team?.id &&
												item.id === choice.channel?.id
											: item.id === choice.team?.id;
										return (
											<CommandItem
												key={item.id}
												value={item.id}
												className="min-h-11 items-start py-2"
												onSelect={() => {
													if (browsedTeam) {
														choice.chooseLocation(
															browsedTeam.id,
															item.id,
														);
														setIsOpen(false);
													} else
														handleBrowseTeam(item);
												}}
											>
												{browsedTeam ? (
													<HashIcon aria-hidden />
												) : (
													<UsersIcon aria-hidden />
												)}
												<span className="flex min-w-0 flex-1 flex-col gap-1">
													<span className="wrap-anywhere">
														{item.displayName}
													</span>
													{item.description ? (
														<span className="line-clamp-2 text-muted-foreground text-xs">
															{item.description}
														</span>
													) : null}
												</span>
												{isCurrent ? (
													<>
														<CheckIcon
															aria-hidden
														/>
														<span className="sr-only">
															{t("teams.current")}
														</span>
													</>
												) : null}
												{!browsedTeam ? (
													<ChevronRightIcon
														aria-hidden
													/>
												) : null}
											</CommandItem>
										);
									})}
								</CommandGroup>
							</>
						) : (
							<>
								{query.status === "loading" ? (
									<output className="sr-only">
										{t("common.loading")}
									</output>
								) : null}
								<ConnectorViewerStatus
									query={query}
									serviceName={t("services.teams")}
									onSignIn={onSignIn}
									skeletonRows={4}
								/>
							</>
						)}
					</CommandList>
				</Command>
				{query.status === "ready" ? (
					<div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-border border-t px-3 py-2">
						<Muted className="text-xs">
							{t("teams.showingResults", {
								shown: Math.min(limit, matches.length),
								total: matches.length,
							})}
						</Muted>
						{matches.length > limit ? (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() =>
									setLimit((previous) => previous + PAGE_SIZE)
								}
							>
								{t("common.showMore")}
							</Button>
						) : null}
						{search ? (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => {
									setSearch("");
									setLimit(PAGE_SIZE);
									inputRef.current?.focus();
								}}
							>
								{t("common.clearSearch")}
							</Button>
						) : null}
					</div>
				) : null}
			</PopoverContent>
		</Popover>
	);
};
