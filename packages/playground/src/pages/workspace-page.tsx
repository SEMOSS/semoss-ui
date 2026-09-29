import { SearchIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "@semoss/i18n";
import { useIteratorPixel } from "@semoss/sdk/react";
import {
	Button,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Muted,
	Spinner,
	toast,
	useDebouncedValue,
	useInfiniteScroll,
	useTheme,
} from "@semoss/ui/next";
import { WorkspaceCard } from "@/components/workspace/workspace-card";
import { useChat } from "@/hooks/use-chat";
import { useRoot } from "@/hooks/use-root";
import type { App } from "@/types";

/**
 * Renders the WorkspacePage, allowing users to access their workspace or discover new ones
 *
 * @component
 */
export const WorkspacePage = observer(() => {
	const { t } = useTranslation(["workspace", "notifications", "common"]);
	const navigate = useNavigate();
	const { root } = useRoot();
	const { theme: colorMode } = useTheme();

	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search);
	const { chat } = useChat();

	/**
	 * Get all of the workspaces with lazy loading
	 */
	const getWorkspaces = useIteratorPixel<App[], App>(
		(limit, offset) =>
			`META | MyProjects(${debouncedSearch ? `filterWord=["<encode>${debouncedSearch}</encode>"], ` : ""} projectType=["WORKSPACE"], limit=[${limit}], offset=[${offset}])`,
		(response) => {
			// if its less than the limit, we know its the end
			if (response.length < 25) {
				return -1;
			}

			return Infinity;
		},
		(response) => {
			return response;
		},
		{
			limit: 25,
		},
		[debouncedSearch],
	);

	/**
	 * Setup infinite scroll for the command list
	 */
	const { setScroll } = useInfiniteScroll({
		disabled: getWorkspaces.isLoading || !getWorkspaces.hasMore,
		onNext: () => {
			getWorkspaces.next();
		},
	});

	// theme == dark or system matches
	const isDark =
		colorMode === "dark" ||
		(colorMode === "system" &&
			window.matchMedia("(prefers-color-scheme: dark)").matches);

	const src = isDark
		? root.theme.images.workspaceDark
		: root.theme.images.workspace;

	return (
		<div
			ref={(el) => {
				if (el) setScroll(el);
			}}
			className="@container h-full w-full overflow-y-auto"
		>
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
				<div className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
					<div className="min-w-0 flex-1">
						<h1 className="font-semibold text-2xl tracking-tight">
							{t("workspace:breadcrumbs.agent")}
						</h1>
						<p className="mt-2 max-w-2xl text-muted-foreground text-sm">
							{t("workspace:welcomeDescription")}
						</p>
					</div>
					<Button onClick={() => navigate("/agent/new")}>
						{t("workspace:actions.createAgent")}
					</Button>
					{src && (
						<img
							src={src}
							alt={t("workspace:images.agentIllustration")}
							className="max-h-32 w-full rounded-xl object-cover"
						/>
					)}
				</div>

				<div className="flex flex-col gap-4">
					<InputGroup className="bg-background">
						<InputGroupInput
							aria-label={t("common:buttons.search")}
							placeholder={t("common:buttons.search")}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
						<InputGroupAddon>
							<SearchIcon />
						</InputGroupAddon>
					</InputGroup>

					{getWorkspaces.isLoading &&
					getWorkspaces.data.length === 0 ? (
						<div className="flex items-center justify-center py-12">
							<Spinner />
						</div>
					) : getWorkspaces.data.length === 0 ? (
						<div className="flex items-center justify-center py-12">
							<Muted>{t("workspace:messages.noResults")}</Muted>
						</div>
					) : (
						<div className="grid @2xl:grid-cols-2 @3xl:grid-cols-3 grid-cols-1 gap-4">
							{getWorkspaces.data.map((w) => (
								<WorkspaceCard
									key={w.project_id}
									workspace={{
										workspace_id: w.project_id,
										name:
											w.project_display_name ||
											w.project_name,
										description: w.description ?? "",
									}}
									permission={
										w.user_permission === 1
											? "OWNER"
											: w.user_permission === 2
												? "EDIT"
												: "READ_ONLY"
									}
									dateCreated={w.project_date_created}
									onDeleteClick={async () => {
										try {
											await chat.deleteWorkspace(
												w.project_id,
											);

											getWorkspaces.reset();
										} catch (e) {
											toast.error(
												e instanceof Error
													? e.message
													: t(
															"notifications:workspace.deleteError",
														),
											);
										}
									}}
								/>
							))}
						</div>
					)}

					{getWorkspaces.isLoading &&
						getWorkspaces.data.length > 0 && (
							<div className="flex items-center justify-center p-4">
								<Spinner className="size-4" />
							</div>
						)}
				</div>
			</div>
		</div>
	);
});
