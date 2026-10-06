import { ArrowUpRight, Search } from "lucide-react";
import { useContext, useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
	Button,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import type { MailSearchFilters } from "@/features/connectors/types";
import { DashboardContext } from "@/features/dashboard/dashboard.context";
import { appPortalPath } from "@/features/dashboard/dashboard-app-api";
import { eventStart } from "@/features/dashboard/dashboard-calendar";
import {
	searchWorkspaceRecords,
	useWorkspaceSearch,
	type WorkspaceSearchResult,
} from "@/features/dashboard/use-workspace-search";
import { useCollaborationSession } from "../state/collaboration-session.context";

const groups: WorkspaceSearchResult["group"][] = [
	"Go to",
	"Chats",
	"Actions",
	"People",
	"Topics",
	"Calendar",
	"Email",
	"Apps",
];

/** One keyboard command surface across conversations, work, and connected sources. */
export function CollaborationSearch({
	paletteOnly = false,
}: {
	paletteOnly?: boolean;
}) {
	const dashboard = useContext(DashboardContext);
	const { state } = useCollaborationSession();
	const navigate = useNavigate();
	const [localOpen, setLocalOpen] = useState(false);
	const isOpen = dashboard?.isSearchOpen ?? localOpen;
	const setIsOpen = dashboard?.setIsSearchOpen ?? setLocalOpen;
	const [query, setQuery] = useState("");
	const [days, setDays] = useState<MailSearchFilters["sinceDays"]>(7);
	const didNavigate = useRef(false);
	useEffect(() => {
		if (isOpen) didNavigate.current = false;
	}, [isOpen]);
	const windowId = useId();
	const remote = useWorkspaceSearch(
		dashboard?.actions ?? null,
		query,
		isOpen,
		state.settings.sourcesJson.email === true,
		days,
	);
	useEffect(() => {
		const handleKey = (event: KeyboardEvent) => {
			if (
				(event.metaKey || event.ctrlKey) &&
				event.key.toLowerCase() === "k"
			) {
				event.preventDefault();
				setIsOpen(!isOpen);
			}
		};
		window.addEventListener("keydown", handleKey);
		return () => window.removeEventListener("keydown", handleKey);
	}, [isOpen, setIsOpen]);
	const term = query.trim().toLocaleLowerCase();
	const errors = [
		...remote.errors,
		...(dashboard?.calendar.error
			? [`Calendar: ${dashboard.calendar.error}`]
			: []),
	];
	const limitedRecords =
		state.people.length >= 5000 ||
		state.topics.length >= 1000 ||
		state.threads.length >= 5000 ||
		state.items.length >= 5000;
	const entries: WorkspaceSearchResult[] = term
		? [
				...remote.chats,
				...searchWorkspaceRecords(state, query),
				...(dashboard?.calendar.data ?? [])
					.filter((event) =>
						`${event.subject} ${event.organizerName} ${event.location}`
							.toLocaleLowerCase()
							.includes(term),
					)
					.map(
						(event): WorkspaceSearchResult => ({
							id: `event:${event.id}`,
							label: event.subject || "Untitled meeting",
							detail:
								eventStart(event)?.toLocaleString() ??
								"Upcoming meeting",
							group: "Calendar",
							source: { kind: "calendar", id: event.id },
						}),
					),
				...remote.mail.map(
					(mail): WorkspaceSearchResult => ({
						id: `mail:${mail.uid}`,
						label: mail.subject || "Untitled email",
						detail: mail.from || "Outlook",
						group: "Email",
						source: { kind: "email", id: mail.uid },
					}),
				),
				...(dashboard?.layout.preferences.widgets ?? [])
					.filter(
						(widget) =>
							widget.kind === "app" &&
							widget.title.toLocaleLowerCase().includes(term),
					)
					.map(
						(widget): WorkspaceSearchResult => ({
							id: widget.id,
							label: widget.title,
							detail: "Pinned app",
							group: "Apps",
							appId: widget.appId,
						}),
					),
			]
		: [
				{
					id: "home",
					label: "For you",
					detail: "Your personal dashboard",
					group: "Go to",
					path: "/",
				},
				{
					id: "new",
					label: "New Session",
					detail: "Start a conversation",
					group: "Go to",
					path: "/new",
				},
				{
					id: "brain",
					label: "Brain",
					detail: "People, topics, and your context",
					group: "Go to",
					path: "/brain",
				},
				...(dashboard?.history.rooms ?? []).slice(0, 8).map(
					(room): WorkspaceSearchResult => ({
						id: room.roomId,
						label: room.roomName || "Untitled chat",
						detail: "Recent chat",
						group: "Chats",
						roomId: room.roomId,
					}),
				),
			];
	function select(entry: WorkspaceSearchResult): void {
		didNavigate.current = true;
		setIsOpen(false);
		if (entry.path) void navigate(entry.path);
		else if (entry.roomId) void dashboard?.openRoom(entry.roomId);
		else if (entry.source) dashboard?.setSource(entry.source);
		else if (entry.appId)
			window.open(
				appPortalPath(entry.appId),
				"_blank",
				"noopener,noreferrer",
			);
	}
	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				didNavigate.current = false;
				setIsOpen(open);
			}}
		>
			{!paletteOnly && (
				<DialogTrigger asChild>
					<Button variant="ghost" aria-label="Search your workspace">
						<Search aria-hidden="true" />
						Search
					</Button>
				</DialogTrigger>
			)}
			<DialogContent
				className="gap-0 overflow-hidden p-0 sm:max-w-2xl"
				onCloseAutoFocus={(event) => {
					if (didNavigate.current || paletteOnly) {
						event.preventDefault();
						const trigger = [
							...document.querySelectorAll<HTMLButtonElement>(
								'button[aria-label="Search your workspace"], button[aria-label="Open navigation"]',
							),
						].find((button) => button.getClientRects().length > 0);
						(didNavigate.current
							? document.querySelector<HTMLElement>("main")
							: (dashboard?.searchReturnFocus.current?.isConnected
									? dashboard.searchReturnFocus.current
									: trigger) ||
								document.querySelector<HTMLElement>("main")
						)?.focus();
					}
				}}
			>
				<DialogHeader className="sr-only">
					<DialogTitle>Search your workspace</DialogTitle>
					<DialogDescription>
						Find chats, actions, people, topics, calendar entries,
						email, and pinned apps.
					</DialogDescription>
				</DialogHeader>
				<Command shouldFilter={false} label="Search">
					<CommandInput
						aria-label="Search"
						placeholder="Search your workspace…"
						value={query}
						onValueChange={setQuery}
						className="pr-10"
					/>
					<CommandList className="max-h-96 p-2">
						<CommandEmpty>
							{remote.isLoading
								? "Searching…"
								: "No matching items. Try another name or keyword."}
						</CommandEmpty>
						{groups.map((group) => {
							const matches = entries.filter(
								(entry) => entry.group === group,
							);
							return matches.length > 0 ? (
								<CommandGroup key={group} heading={group}>
									{matches.map((entry) => (
										<CommandItem
											key={entry.id}
											value={entry.id}
											onSelect={() => select(entry)}
											className="min-h-11 items-start gap-3 py-3"
										>
											<div className="min-w-0 flex-1">
												<p className="break-words font-medium">
													{entry.label}
												</p>
												<p className="line-clamp-1 text-muted-foreground text-xs">
													{entry.detail}
												</p>
											</div>
											<ArrowUpRight
												aria-hidden="true"
												className="mt-1 size-4"
											/>
										</CommandItem>
									))}
								</CommandGroup>
							) : null;
						})}
						{remote.hasMore && (
							<CommandItem
								value="more-chats"
								disabled={remote.isLoading}
								onSelect={remote.more}
							>
								Load more matching chats
							</CommandItem>
						)}
					</CommandList>
				</Command>
				{remote.isLoading && (
					<output className="px-4 py-2 text-muted-foreground text-xs">
						Searching connected records…
					</output>
				)}
				{errors.length > 0 && (
					<div
						role="alert"
						className="space-y-1 border-t p-3 text-sm"
					>
						{errors.map((error) => (
							<p key={error}>{error}</p>
						))}
						<Button
							size="sm"
							variant="outline"
							onClick={() => {
								remote.retry();
								dashboard?.calendar.refresh();
							}}
						>
							Retry search
						</Button>
					</div>
				)}
				<div className="flex flex-wrap items-center gap-2 border-t bg-muted/30 p-3 text-muted-foreground text-xs">
					<span className="min-w-0 flex-1">
						{limitedRecords
							? "Partial imported records (list limits apply)"
							: "Available conversations, people, and topics"}
						{state.settings.sourcesJson.calendar
							? " · Up to 30 events this week"
							: " · Calendar disconnected"}
						{state.settings.sourcesJson.email
							? " · Outlook sender/subject, up to 20 per query"
							: " · Outlook disconnected"}
					</span>
					<Label htmlFor={windowId} className="text-xs">
						Email window
					</Label>
					<Select
						value={String(days)}
						onValueChange={(value) => {
							const next = Number(value);
							if (
								next === 1 ||
								next === 7 ||
								next === 30 ||
								next === 90
							)
								setDays(next);
						}}
					>
						<SelectTrigger id={windowId} className="w-28">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{[1, 7, 30, 90].map((value) => (
								<SelectItem key={value} value={String(value)}>
									{value} days
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</DialogContent>
		</Dialog>
	);
}
