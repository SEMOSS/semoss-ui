import { SearchIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import workspaceImage from "@/assets/img/workspace.png";
import workspaceImageDark from "@/assets/img/workspace-darkmode.png";
import { WorkspaceCard } from "@/components";
import { useApp, useGlobalBreadcrumbs, useRoot } from "@/hooks";
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
	// set the breadcrumbs
	useGlobalBreadcrumbs({
		breadcrumbs: [
			{
				name: t("workspace:breadcrumbs.home"),
				path: "/",
			},
			{
				name: t("workspace:breadcrumbs.agent"),
				path: "/agent",
			},
		],
	});

	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search);
	const { app } = useApp();

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
		? root.theme.images.workspaceDark || workspaceImageDark
		: root.theme.images.workspace || workspaceImage;

	return (
		<div
			ref={(el) => {
				if (el) setScroll(el);
			}}
			className="@container h-full w-full overflow-y-auto"
		>
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-12 @3xl:px-12 @md:px-6 px-4 pt-8 pb-4">
				<div className="flex w-full rounded-lg bg-primary/10">
					<div className="flex flex-1 flex-col gap-4 p-6 font-sans">
						<div className="font-medium text-primary text-xl leading-normal dark:text-white">
							{t("workspace:welcomeTitle")}
						</div>
						<div className="font-normal text-base text-primary leading-normal dark:text-white">
							{t("workspace:welcomeDescription")}
						</div>
						<Button
							onClick={() => navigate("/agent/new")}
							className="w-auto"
						>
							{t("workspace:actions.createAgent")}
						</Button>
					</div>
					{/* Image appears only on large screens and above */}
					<div className="relative @3xl:block hidden w-[351px] overflow-hidden rounded-e-lg">
						<img
							src={src}
							alt={t("workspace:images.agentIllustration")}
							className="-translate-y-1/2 absolute start-0 top-1/2 h-[351px] w-full select-none object-cover"
						/>
					</div>
				</div>

				<div className="flex flex-col gap-4">
					<InputGroup className="bg-background">
						<InputGroupInput
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
						<div className="grid @2xl:grid-cols-2 @3xl:grid-cols-3 grid-cols-1 gap-4 @4xl:gap-x-8">
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
											await app.deleteWorkspace(
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
