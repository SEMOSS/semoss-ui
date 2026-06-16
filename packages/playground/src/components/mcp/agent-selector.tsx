import {
	CheckIcon,
	ComputerIcon,
	PlusIcon,
	SearchIcon,
	SquareArrowOutUpRightIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@semoss/i18n";
import { useIteratorPixel } from "@semoss/sdk/react";
import { AppCatalogAvatar } from "@semoss/shared";
import {
	Button,
	Card,
	CardContent,
	cn,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Muted,
	ScrollArea,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import type { App, Workspace } from "@/types";

type WorkspaceRef = Pick<Workspace, "workspace_id"> &
	Partial<Pick<Workspace, "name">>;

interface AgentSelectorProps {
	value: WorkspaceRef | null;
	onChange: (next: WorkspaceRef | null) => void;
	disabled?: boolean;
	className?: string;
}

// TODO: design proper agent cards (see parallel TODO for MCPCard). The card
// layout below is a placeholder kept visually consistent with MCPSelector.
export const AgentSelector = observer(
	({ value, onChange, disabled, className }: AgentSelectorProps) => {
		const { t } = useTranslation(["mcp", "workspace"]);
		const navigate = useNavigate();
		const [search, setSearch] = useState("");
		const debouncedSearch = useDebouncedValue(search);

		const getWorkspaces = useIteratorPixel<App[], App>(
			(limit, offset) =>
				`META | MyProjects(${debouncedSearch ? `filterWord=${JSON.stringify(debouncedSearch)}, ` : ""}type = "WORKSPACE", limit=[${limit}], offset=[${offset}])`,
			(response) => (response.length < 25 ? -1 : Infinity),
			(response) => response,
			{ limit: 25 },
			[debouncedSearch],
		);

		const { setScroll } = useInfiniteScroll({
			disabled: getWorkspaces.isLoading || !getWorkspaces.hasMore,
			onNext: () => {
				getWorkspaces.next();
			},
		});

		const select = (w: App) => {
			const ref: WorkspaceRef = {
				workspace_id: w.project_id,
				name: w.project_display_name || w.project_name,
			};
			onChange(value?.workspace_id === ref.workspace_id ? null : ref);
		};

		return (
			<div
				className={cn(
					"flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm",
					className,
				)}
			>
				<div className="flex w-full shrink-0 flex-row gap-2 border-border border-b bg-muted p-4">
					<div className="flex-1">
						<InputGroup className="bg-background">
							<InputGroupInput
								autoFocus
								placeholder={t("selector.search")}
								value={search}
								disabled={disabled}
								onChange={(e) => setSearch(e.target.value)}
							/>
							<InputGroupAddon>
								<SearchIcon />
							</InputGroupAddon>
						</InputGroup>
					</div>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="outline"
								onClick={(event) => {
									event.preventDefault();
									event.stopPropagation();
									window.open("#/agent/new", "_blank");
								}}
								disabled={disabled}
								data-testid="agent-selector--create-btn"
							>
								<PlusIcon />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							{t("workspace:actions.createAgent", {
								defaultValue: "Create an Agent",
							})}
						</TooltipContent>
					</Tooltip>
				</div>

				<ScrollArea
					className="min-h-0 w-full flex-1"
					viewportRef={(e) => setScroll(e)}
				>
					{getWorkspaces.isLoading &&
						getWorkspaces.data.length === 0 && (
							<div className="flex h-64 w-full items-center justify-center">
								<Spinner />
							</div>
						)}
					{!getWorkspaces.isLoading &&
						getWorkspaces.data.length === 0 && (
							<div className="flex h-64 w-full items-center justify-center">
								<Muted>{t("selector.noAgentsFound")}</Muted>
							</div>
						)}
					{getWorkspaces.data.length !== 0 && (
						<>
							<div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-3">
								{getWorkspaces.data.map((w) => {
									const isSelected =
										value?.workspace_id === w.project_id;
									const permissionLabel =
										w.user_permission === 1
											? t("workspace:members.owner", {
													defaultValue: "Owner",
												})
											: w.user_permission === 2
												? t(
														"workspace:members.editor",
														{
															defaultValue:
																"Editor",
														},
													)
												: t(
														"workspace:members.readOnly",
														{
															defaultValue:
																"Read-only",
														},
													);
									return (
										<Card
											key={w.project_id}
											onClick={() =>
												!disabled && select(w)
											}
											className={cn(
												"p-0 transition-colors",
												!disabled &&
													"cursor-pointer hover:bg-muted/30",
												disabled &&
													"cursor-not-allowed opacity-50",
												isSelected && "border-primary",
											)}
										>
											<CardContent className="flex flex-col gap-2 p-3">
												{/* Row 1: open-page link + permission text on
												    the left; selection checkbox on the right. */}
												<div className="flex items-center gap-2">
													<div className="flex min-w-0 flex-1 items-center gap-1.5">
														<Tooltip>
															<TooltipTrigger
																asChild
															>
																<a
																	href={`#/agent/${w.project_id}`}
																	onClick={(
																		event,
																	) => {
																		event.preventDefault();
																		event.stopPropagation();
																		navigate(
																			`/agent/${w.project_id}`,
																		);
																	}}
																	className="text-muted-foreground hover:text-foreground"
																>
																	<SquareArrowOutUpRightIcon className="size-4" />
																</a>
															</TooltipTrigger>
															<TooltipContent>
																{t(
																	"agent.openAgentPage",
																	{
																		defaultValue:
																			"Open agent page",
																	},
																)}
															</TooltipContent>
														</Tooltip>
														{permissionLabel ? (
															<span className="-translate-y-px text-[10px] text-muted-foreground capitalize">
																{
																	permissionLabel
																}
															</span>
														) : null}
													</div>
													<div className="flex shrink-0 items-center gap-1.5">
														<div
															className={cn(
																"flex size-4 items-center justify-center rounded border transition-colors",
																isSelected
																	? "border-primary bg-primary text-primary-foreground"
																	: "border-muted-foreground/40",
															)}
														>
															{isSelected ? (
																<CheckIcon
																	className="size-3"
																	strokeWidth={
																		3
																	}
																/>
															) : null}
														</div>
													</div>
												</div>

												{/* Row 2: avatar + (name on top, type below). */}
												<div className="flex items-start gap-2">
													<AppCatalogAvatar
														name={
															w.project_display_name ||
															w.project_name
														}
														className="size-10 shrink-0 rounded-md text-sm"
													/>
													<div className="flex min-w-0 flex-1 flex-col gap-0.5">
														<div className="wrap-break-word line-clamp-2 font-medium text-sm leading-tight">
															{w.project_display_name ||
																w.project_name}
														</div>
														<div className="flex items-center gap-1.5 text-muted-foreground text-xs">
															<ComputerIcon className="size-3.5 shrink-0" />
															<span>
																{t(
																	"agent.typeLabel",
																	{
																		defaultValue:
																			"Agent",
																	},
																)}
															</span>
														</div>
													</div>
												</div>

												{/* Row 3: description (full width) or spacer. */}
												{w.description ? (
													<div className="wrap-break-words line-clamp-4 text-muted-foreground text-xs">
														{w.description}
													</div>
												) : (
													<div
														className="h-1"
														aria-hidden
													/>
												)}
											</CardContent>
										</Card>
									);
								})}
							</div>
							{getWorkspaces.isLoading && (
								<div className="flex w-full items-center justify-center pb-4">
									<Spinner />
								</div>
							)}
						</>
					)}
				</ScrollArea>
			</div>
		);
	},
);
