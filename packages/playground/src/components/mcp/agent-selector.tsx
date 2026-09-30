import {
	Bot,
	PlusIcon,
	SearchIcon,
	SquareArrowOutUpRightIcon,
} from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useIteratorPixel } from "@semoss/sdk/react";
import { AppCatalogAvatar } from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	Button,
	cn,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Label,
	Muted,
	RadioGroup,
	RadioGroupItem,
	ScrollArea,
	Spinner,
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
	/** Harness-enabled rooms can run without a saved agent. */
	allowDefaultAgent?: boolean;
}

/** Searchable, keyboard-accessible agent selection with a deliberate default. */
export function AgentSelector({
	value,
	onChange,
	disabled,
	className,
	allowDefaultAgent = false,
}: AgentSelectorProps) {
	const { t } = useTranslation(["mcp", "workspace", "room", "common"]);
	const id = useId();
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search);
	const getWorkspaces = useIteratorPixel<App[], App>(
		(limit, offset) =>
			`META | MyProjects(${debouncedSearch ? `filterWord=${JSON.stringify(debouncedSearch)}, ` : ""}projectType=["WORKSPACE"], limit=[${limit}], offset=[${offset}])`,
		(response) => (response.length < 25 ? -1 : Infinity),
		(response) => response,
		{ limit: 25 },
		[debouncedSearch],
	);
	const { setScroll } = useInfiniteScroll({
		disabled: getWorkspaces.isLoading || !getWorkspaces.hasMore,
		onNext: getWorkspaces.next,
	});
	return (
		<div className={cn("flex min-h-0 flex-1 flex-col gap-4", className)}>
			<div className="flex items-center gap-2">
				<InputGroup className="min-w-0 flex-1">
					<InputGroupInput
						aria-label={t("room:menuWorkspace.searchPlaceholder")}
						placeholder={t("room:menuWorkspace.searchPlaceholder")}
						value={search}
						disabled={disabled}
						onChange={(event) => setSearch(event.target.value)}
					/>
					<InputGroupAddon>
						<SearchIcon aria-hidden="true" />
					</InputGroupAddon>
				</InputGroup>
				<Button
					asChild
					variant="outline"
					size="sm"
					data-testid="agent-selector--create-btn"
				>
					<a
						href="#/agent/new"
						target="_blank"
						rel="noopener noreferrer"
					>
						<PlusIcon aria-hidden="true" />
						{t("workspace:actions.createAgent")}
					</a>
				</Button>
			</div>
			<ScrollArea className="min-h-0 flex-1" viewportRef={setScroll}>
				<RadioGroup
					aria-label={t("room:form.agentLabel")}
					value={value?.workspace_id ?? ""}
					disabled={disabled}
					onValueChange={(next) => {
						if (!next) {
							onChange(null);
							return;
						}
						const agent = getWorkspaces.data.find(
							(item) => item.project_id === next,
						);
						if (agent)
							onChange({
								workspace_id: agent.project_id,
								name:
									agent.project_display_name ||
									agent.project_name,
							});
					}}
					className="gap-2 p-1"
				>
					<div className="flex items-center gap-3 rounded-lg border p-3">
						<RadioGroupItem id={`${id}-default`} value="" />
						<Label
							htmlFor={`${id}-default`}
							className="min-h-8 flex-1"
						>
							<Bot aria-hidden="true" className="size-4" />
							{t(
								allowDefaultAgent
									? "room:modes.defaultAgent"
									: "room:modes.noAgent",
							)}
						</Label>
					</div>
					{value &&
						!getWorkspaces.data.some(
							(item) => item.project_id === value.workspace_id,
						) && (
							<div className="flex items-center gap-3 rounded-lg border p-3">
								<RadioGroupItem
									id={`${id}-selected`}
									value={value.workspace_id}
								/>
								<Label
									htmlFor={`${id}-selected`}
									className="break-words"
								>
									{value.name || value.workspace_id}
								</Label>
							</div>
						)}
					{getWorkspaces.data.map((agent) => {
						const name =
							agent.project_display_name || agent.project_name;
						const permission =
							agent.user_permission === 1
								? "owner"
								: agent.user_permission === 2
									? "editor"
									: "readOnly";
						return (
							<div
								key={agent.project_id}
								className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent"
							>
								<RadioGroupItem
									id={`${id}-${agent.project_id}`}
									value={agent.project_id}
								/>
								<AppCatalogAvatar
									projectId={agent.project_id}
									name={name}
									className="size-10 shrink-0 rounded-md"
								/>
								<Label
									htmlFor={`${id}-${agent.project_id}`}
									className="min-w-0 flex-1 flex-col items-start gap-1"
								>
									<span className="break-words">{name}</span>
									<Muted className="text-xs">
										{t(`workspace:members.${permission}`)}
									</Muted>
									{agent.description && (
										<Muted className="break-words text-sm">
											{agent.description}
										</Muted>
									)}
								</Label>
								<Button asChild variant="ghost" size="icon-sm">
									<a
										href={`#/agent/${agent.project_id}`}
										target="_blank"
										rel="noopener noreferrer"
										aria-label={`${t("agent.openAgentPage")} — ${name}`}
									>
										<SquareArrowOutUpRightIcon aria-hidden="true" />
									</a>
								</Button>
							</div>
						);
					})}
				</RadioGroup>
				{getWorkspaces.isError ? (
					<Alert variant="destructive" className="mt-3">
						<AlertDescription>
							{t("room:settings.agentLoadError")}
						</AlertDescription>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={getWorkspaces.reset}
						>
							{t("room:studio.retry")}
						</Button>
					</Alert>
				) : (
					!getWorkspaces.isLoading &&
					getWorkspaces.data.length === 0 && (
						<Muted className="p-4">
							{t("selector.noAgentsFound")}
						</Muted>
					)
				)}
				{getWorkspaces.isLoading && (
					<div className="flex justify-center p-4">
						<Spinner />
					</div>
				)}
			</ScrollArea>
		</div>
	);
}
