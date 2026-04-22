// biome-ignore-all lint/correctness/useExhaustiveDependencies: TODO

import { Bookmark, Pencil, Settings, Share2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import { lazy, Suspense, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
	Button,
	Dialog,
	DialogContent,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { setProjectFavorite } from "@/api";
import { ShareOverlay } from "@/components/ui";
import { useNavigate } from "@/hooks/useNavigate";

const Renderer = lazy(() =>
	import("@semoss/renderer").then((m) => ({ default: m.Renderer })),
);
const CodeRenderer = lazy(() =>
	import("@/components/code-workspace").then((m) => ({
		default: m.CodeRenderer,
	})),
);

import { usePage, useRootStore } from "@/hooks";
import type { WorkspaceStore } from "@/stores";
import { NavbarHeader, NavbarLeft, NavbarRight } from "../../components/shared";

export const ViewAppPage = observer(() => {
	// App ID Needed for pixel calls
	const { appId } = useParams();
	const { configStore } = useRootStore();

	const navigate = useNavigate();

	const [workspace, setWorkspace] = useState<WorkspaceStore>(undefined);
	const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
	const [bookmarked, setBookmarked] = useState<boolean>(false);

	const handleBookmark = (status: boolean) => {
		setBookmarked(status);
		setProjectFavorite(appId, status)
			.then(() => {
				toast.success(
					`Project ${bookmarked ? "unbookmarked" : "bookmarked"}`,
				);
				return;
			})
			.catch((err) => {
				throw Error(err);
			});
	};

	// setup the page
	usePage({
		showNavbarLogo: false,
	});

	useEffect(() => {
		// clear out the old app
		setWorkspace(undefined);

		configStore
			.createWorkspace(appId)
			.then((loadedWorkspace) => {
				setWorkspace(loadedWorkspace);
				setBookmarked(
					Boolean(loadedWorkspace.metadata.project_favorite),
				);
			})
			.catch((e) => {
				toast.error(e.message);
				navigate("/");
			});
	}, [appId]);

	// hide the screen while it loads
	if (!workspace) {
		return (
			<div className="absolute inset-0 flex items-center justify-center">
				<Spinner />
			</div>
		);
	}

	return (
		<>
			<NavbarLeft>
				<NavbarHeader
					logo={
						<div
							title={
								workspace?.metadata?.project_display_name ||
								workspace?.metadata?.project_name
							}
							className="w-[30ch] truncate text-ellipsis font-normal text-[16px] leading-[175%]"
						>
							{workspace?.metadata?.project_display_name ||
								workspace?.metadata?.project_name}
						</div>
					}
				/>
			</NavbarLeft>
			<NavbarRight>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => navigate(`/app/${appId}`)}
							data-testid={"settings"}
						>
							<Settings className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Settings</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => handleBookmark(!bookmarked)}
							data-testid={"viewAppPage-bookmark-btn"}
						>
							<Bookmark
								className={`size-4 ${bookmarked ? "fill-primary text-primary" : ""}`}
							/>
						</Button>
					</TooltipTrigger>
					<TooltipContent>Bookmark App</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setIsShareOpen(true)}
							data-testid={"viewAppPage-share-btn"}
						>
							<Share2 className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Share App</TooltipContent>
				</Tooltip>
				<Button
					variant="default"
					size="sm"
					disabled={
						!(
							workspace.role === "OWNER" ||
							workspace.role === "EDIT"
						)
					}
					onClick={() => navigate(`../../../app/${appId}/edit`)}
					data-testid={"viewAppPage-edit-btn"}
				>
					<Pencil className="mr-1 size-4" />
					Edit
				</Button>
			</NavbarRight>
			<div className="absolute inset-0">
				<Suspense
					fallback={
						<div className="flex h-full w-full items-center justify-center">
							<Spinner />
						</div>
					}
				>
					{workspace.type === "BLOCKS" ? (
						<Renderer
							appId={appId}
							insightId={workspace.insightId}
						/>
					) : null}
					{workspace.type === "CODE" ? (
						<CodeRenderer appId={appId} />
					) : null}
				</Suspense>
			</div>

			<Dialog
				open={isShareOpen}
				onOpenChange={(o) => !o && setIsShareOpen(false)}
			>
				<DialogContent className="max-w-lg p-0">
					<ShareOverlay
						appId={appId}
						onClose={() => setIsShareOpen(false)}
					/>
				</DialogContent>
			</Dialog>
		</>
	);
});
