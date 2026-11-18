import {
	ArrowLeftIcon,
	CheckIcon,
	ChevronDownIcon,
	ChevronRightIcon,
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
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { ConnectorViewerStatus } from "../../components/connector-viewer-status";
import { useConnectorQuery } from "../../core/use-connector-query";
import { parseChannels } from "../microsoft.parsers";
import { MICROSOFT_PIXELS } from "../microsoft.pixels";
import type { TeamsTeam } from "../microsoft.types";
import type { TeamsChannelChoice } from "./use-teams-channel-choice";

const PAGE_SIZE = 50;

/** Props for {@link TeamsChannelPicker}. */
interface TeamsChannelPickerProps {
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
	// the count only helps when there is more to show or a search to clear
	const showFooter =
		query.status === "ready" &&
		(matches.length > limit || search.length > 0);

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
					variant="outline"
					size="sm"
					className="w-fit min-w-0 max-w-full justify-start gap-1.5 bg-background font-normal shadow-none max-md:min-h-11"
					aria-label={
						choice.team
							? t("teams.changeLocation", {
									team: choice.team.displayName,
									channel:
										choice.channel?.displayName ??
										t("teams.chooseChannel"),
								})
							: undefined
					}
				>
					{choice.team ? (
						<>
							<span className="min-w-0 shrink-2 truncate text-muted-foreground">
								{choice.team.displayName}
							</span>
							<HashIcon
								aria-hidden
								className="text-muted-foreground"
							/>
							<span className="min-w-0 truncate font-medium">
								{choice.channel?.displayName ??
									t("teams.chooseChannel")}
							</span>
						</>
					) : (
						<>
							<UsersIcon
								aria-hidden
								className="text-muted-foreground"
							/>
							<span className="min-w-0 truncate text-muted-foreground">
								{t("teams.chooseTeam")}
							</span>
						</>
					)}
					<ChevronDownIcon
						aria-hidden
						className="ms-1 text-muted-foreground"
					/>
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="start"
				collisionPadding={12}
				className="flex max-h-(--radix-popover-content-available-height) w-80 max-w-(--radix-popover-content-available-width) flex-col overflow-hidden p-0"
				aria-label={t(
					browsedTeam ? "teams.chooseChannel" : "teams.chooseTeam",
				)}
				onOpenAutoFocus={(event) => {
					event.preventDefault();
					inputRef.current?.focus();
				}}
			>
				{browsedTeam ? (
					<div className="flex shrink-0 items-center gap-1 border-border border-b p-1">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									aria-label={t("teams.allTeams")}
									onClick={() => handleBrowseTeam(null)}
								>
									<ArrowLeftIcon
										aria-hidden
										className="rtl:-scale-x-100"
									/>
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								{t("teams.allTeams")}
							</TooltipContent>
						</Tooltip>
						<span className="min-w-0 flex-1 truncate font-medium text-sm">
							{browsedTeam.displayName}
						</span>
					</div>
				) : null}
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
												title={item.displayName}
												className="min-h-9"
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
												<span className="flex min-w-0 flex-1 flex-col">
													<span className="truncate">
														{item.displayName}
													</span>
													{item.description ? (
														<span className="truncate text-muted-foreground text-xs">
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
														className="rtl:-scale-x-100 text-muted-foreground"
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
				{showFooter ? (
					<div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-border border-t px-3 py-1.5">
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
