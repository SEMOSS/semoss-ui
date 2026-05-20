import { CheckIcon, ComputerIcon, SearchIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useIteratorPixel } from "@semoss/sdk/react";
import {
	cn,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Muted,
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
}

// TODO: design proper agent cards (see parallel TODO for MCPCard). The card
// layout below is a placeholder kept visually consistent with MCPSelector.
export const AgentSelector = observer(
	({ value, onChange, disabled, className }: AgentSelectorProps) => {
		const { t } = useTranslation("mcp");
		const [search, setSearch] = useState("");
		const debouncedSearch = useDebouncedValue(search);

		const getWorkspaces = useIteratorPixel<App[], App>(
			(limit, offset) =>
				`META | MyProjects(${debouncedSearch ? `filterWord=["<encode>${debouncedSearch}</encode>"], ` : ""}type = "WORKSPACE", limit=[${limit}], offset=[${offset}])`,
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
				</div>

				<ScrollArea
					className="min-h-0 w-full flex-1"
					viewportRef={(e) => setScroll(e)}
				>
					{getWorkspaces.isLoading && (
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
					{!getWorkspaces.isLoading &&
						getWorkspaces.data.length !== 0 && (
							<div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-3">
								{getWorkspaces.data.map((w) => {
									const isSelected =
										value?.workspace_id === w.project_id;
									return (
										<button
											type="button"
											key={w.project_id}
											onClick={() => select(w)}
											disabled={disabled}
											className={cn(
												"flex items-start gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50",
												isSelected &&
													"border-primary ring-2 ring-primary/20",
											)}
										>
											<ComputerIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
											<div className="min-w-0 flex-1">
												<div className="truncate font-medium text-sm">
													{w.project_display_name ||
														w.project_name}
												</div>
												{w.description ? (
													<div className="mt-1 line-clamp-2 text-muted-foreground text-xs">
														{w.description}
													</div>
												) : null}
											</div>
											{isSelected ? (
												<CheckIcon className="size-4 shrink-0 text-primary" />
											) : null}
										</button>
									);
								})}
							</div>
						)}
				</ScrollArea>
			</div>
		);
	},
);
