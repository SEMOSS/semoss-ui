import { ChevronDown, Lock } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppCatalogAvatar } from "@semoss/shared";
import {
	Avatar,
	AvatarFallback,
	Badge,
	Button,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	cn,
	Label,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Spinner,
	Tabs,
	TabsList,
	TabsTrigger,
	toast,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import { getProjects, setUserLocked } from "@/api";
import { useIteratorApi, useSettings } from "@/hooks";
import { MemberProfileForm } from "./member-profile-form";
import { MemberResourceAccess } from "./member-resource-access";
import type { SETTINGS_MEMBER } from "./settings.types";

type VIEW = "PROFILE" | "APP" | "ENGINE" | "INSIGHT";

/** Page size for the Insights app combobox. */
const APP_PAGE_SIZE = 25;

export interface MemberAccessPanelProps {
	/** The selected user whose access is being managed */
	user: SETTINGS_MEMBER;
	/** Called after the user's profile/roles change so the list can refresh */
	onUserChanged: () => void;
}

/**
 * Right pane of the members tab: the selected user's profile/roles and their
 * access to apps, engines, and a project's insights.
 */
export const MemberAccessPanel = ({
	user,
	onUserChanged,
}: MemberAccessPanelProps) => {
	const { adminMode } = useSettings();

	const [view, setView] = useState<VIEW>("PROFILE");
	const [member, setMember] = useState<SETTINGS_MEMBER>(user);
	const [insightProjectId, setInsightProjectId] = useState<string>("");
	const [unlocking, setUnlocking] = useState(false);

	// Insights app picker (combobox): the project catalog is large, so it is
	// searched + paged server-side via infinite scroll instead of a plain
	// Select that would load every project at once.
	const [appOpen, setAppOpen] = useState(false);
	const [appSearch, setAppSearch] = useState("");
	const debouncedAppSearch = useDebouncedValue(appSearch);
	const [selectedApp, setSelectedApp] = useState<{
		id: string;
		name: string;
	} | null>(null);

	// Keep the local copy in sync and reset transient state when the selection changes
	useEffect(() => {
		setMember(user);
		setInsightProjectId("");
		setSelectedApp(null);
		setAppOpen(false);
		setAppSearch("");
		setView("PROFILE");
	}, [user]);

	const appsIterator = useIteratorApi(
		(limit, offset) =>
			getProjects(
				adminMode,
				debouncedAppSearch || undefined,
				offset,
				limit,
			),
		{ enabled: appOpen, limit: APP_PAGE_SIZE },
		[adminMode, debouncedAppSearch],
	);

	// Stable onNext so useInfiniteScroll keeps its listener across load-state changes.
	const appNextRef = useRef(appsIterator.next);
	useEffect(() => {
		appNextRef.current = appsIterator.next;
	}, [appsIterator.next]);
	const handleAppNext = useCallback(() => appNextRef.current(), []);

	const { setScroll: setAppScroll } = useInfiniteScroll({
		disabled: !appOpen || appsIterator.isLoading || !appsIterator.hasMore,
		onNext: handleAppNext,
	});

	const openAppPicker = () => {
		appsIterator.reset();
		setAppOpen(true);
	};
	const closeAppPicker = () => {
		setAppOpen(false);
		setAppSearch("");
	};

	const displayName = member.name || member.id || "Unknown";

	const handleUnlock = async () => {
		setUnlocking(true);
		try {
			const response = await setUserLocked(
				adminMode,
				member.id,
				member.type,
				false,
			);
			if (response?.data?.success) {
				toast.success("User unlocked");
				setMember({ ...member, locked: false });
				onUserChanged();
			} else {
				toast.error("Failed to unlock user");
			}
		} catch (error) {
			toast.error(String(error));
		} finally {
			setUnlocking(false);
		}
	};

	return (
		<div className="flex h-full flex-col gap-3">
			{/* Header */}
			<div className="flex min-w-0 items-center gap-3">
				<Avatar className="size-9 shrink-0">
					<AvatarFallback>
						{displayName.charAt(0).toUpperCase()}
					</AvatarFallback>
				</Avatar>
				<div className="flex min-w-0 flex-col leading-tight">
					<span className="truncate font-semibold text-base">
						{displayName}
					</span>
					<span className="truncate text-muted-foreground text-sm">
						{member.email
							? `${member.email} · id: ${member.id}`
							: `id: ${member.id}`}
					</span>
				</div>
			</div>

			{member.locked ? (
				<div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
					<div className="flex items-center gap-2">
						<Lock className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
						<div className="flex flex-col">
							<span className="font-medium text-sm">
								This user is locked
							</span>
							<span className="text-muted-foreground text-xs">
								They can't sign in until unlocked. Unlock the
								user to restore their access.
							</span>
						</div>
					</div>
					<Button
						size="sm"
						variant="outline"
						disabled={unlocking}
						onClick={handleUnlock}
					>
						{unlocking ? "Unlocking..." : "Unlock User"}
					</Button>
				</div>
			) : null}

			<Tabs
				value={view}
				onValueChange={(value) => setView(value as VIEW)}
			>
				<TabsList className="w-fit max-w-full flex-wrap">
					<TabsTrigger value="PROFILE">Profile</TabsTrigger>
					<TabsTrigger value="APP">Apps</TabsTrigger>
					<TabsTrigger value="ENGINE">Engines</TabsTrigger>
					<TabsTrigger value="INSIGHT">Insights</TabsTrigger>
				</TabsList>
			</Tabs>

			<div className="flex min-h-0 flex-1 flex-col">
				{view === "PROFILE" ? (
					<div className="min-h-0 flex-1 overflow-y-auto">
						<MemberProfileForm
							user={member}
							onSaved={(updated) => {
								setMember(updated);
								onUserChanged();
							}}
						/>
					</div>
				) : null}

				{view === "APP" ? (
					<MemberResourceAccess kind="APP" userId={member.id} />
				) : null}

				{view === "ENGINE" ? (
					<MemberResourceAccess kind="ENGINE" userId={member.id} />
				) : null}

				{view === "INSIGHT" ? (
					<div className="flex min-h-0 flex-1 flex-col gap-3">
						<div className="flex shrink-0 flex-col gap-1.5">
							<Label className="text-muted-foreground text-sm">
								App
							</Label>
							<Popover
								open={appOpen}
								onOpenChange={(isOpen) =>
									isOpen ? openAppPicker() : closeAppPicker()
								}
							>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										role="combobox"
										aria-expanded={appOpen}
										className="h-auto w-full max-w-sm justify-start py-2 text-left"
									>
										{selectedApp ? (
											<div className="flex w-full min-w-0 items-center gap-2">
												<AppCatalogAvatar
													name={selectedApp.name}
													className="size-8 shrink-0 rounded-md text-xs"
												/>
												<div className="flex min-w-0 flex-col text-left">
													<span className="truncate font-medium">
														{selectedApp.name}
													</span>
													<span className="truncate text-muted-foreground text-xs">
														id: {selectedApp.id}
													</span>
												</div>
												<ChevronDown className="ms-auto size-4 shrink-0 opacity-70" />
											</div>
										) : (
											<span className="flex w-full items-center text-muted-foreground">
												Select an app to manage its
												insights
												<ChevronDown className="ms-auto size-4 shrink-0 opacity-70" />
											</span>
										)}
									</Button>
								</PopoverTrigger>
								<PopoverContent
									align="start"
									className="w-[var(--radix-popover-trigger-width)] min-w-72 p-0"
								>
									<Command shouldFilter={false}>
										<CommandInput
											placeholder="Search apps"
											value={appSearch}
											onValueChange={setAppSearch}
										/>
										<CommandList ref={setAppScroll}>
											<CommandEmpty>
												{appsIterator.isLoading &&
												appsIterator.data.length ===
													0 ? (
													<div className="flex items-center justify-center py-4">
														<Spinner />
													</div>
												) : (
													"No apps found"
												)}
											</CommandEmpty>
											<CommandGroup>
												{appsIterator.data.map(
													(project) => {
														const name =
															project.project_display_name ||
															project.project_name ||
															project.project_id;
														const isSelected =
															insightProjectId ===
															project.project_id;
														return (
															<CommandItem
																key={
																	project.project_id
																}
																value={
																	project.project_id
																}
																onSelect={() => {
																	setInsightProjectId(
																		project.project_id,
																	);
																	setSelectedApp(
																		{
																			id: project.project_id,
																			name,
																		},
																	);
																	closeAppPicker();
																}}
																className={cn(
																	isSelected &&
																		"bg-primary/10 data-[selected=true]:bg-primary/15",
																)}
															>
																<AppCatalogAvatar
																	name={name}
																	className="me-2 size-8 shrink-0 rounded-md text-xs"
																/>
																<div className="flex min-w-0 flex-1 flex-col">
																	<span className="truncate font-medium">
																		{name}
																	</span>
																	<span className="truncate text-muted-foreground text-xs">
																		id:{" "}
																		{
																			project.project_id
																		}
																	</span>
																</div>
																{project.project_type ? (
																	<Badge
																		variant="secondary"
																		className="ms-2 shrink-0 rounded-full"
																	>
																		{
																			project.project_type
																		}
																	</Badge>
																) : null}
															</CommandItem>
														);
													},
												)}
												{appsIterator.isLoading &&
													appsIterator.data.length >
														0 && (
														<div className="flex items-center justify-center py-2">
															<Spinner className="size-4" />
														</div>
													)}
											</CommandGroup>
										</CommandList>
									</Command>
								</PopoverContent>
							</Popover>
						</div>
						{insightProjectId ? (
							<MemberResourceAccess
								kind="INSIGHT"
								userId={member.id}
								projectId={insightProjectId}
							/>
						) : (
							<div className="flex h-24 items-center justify-center text-muted-foreground text-sm">
								Select an app to view and edit its insight
								access
							</div>
						)}
					</div>
				) : null}
			</div>
		</div>
	);
};
