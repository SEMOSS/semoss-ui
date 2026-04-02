// biome-ignore-all lint/correctness/useExhaustiveDependencies: TODO
import {
	Bookmark,
	BookmarkBorderOutlined,
	EditOutlined,
	ShareRounded,
} from "@mui/icons-material";
import { Settings } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Renderer } from "@semoss/renderer";
import { Env } from "@semoss/sdk/react";
import {
	Avatar,
	Button,
	IconButton,
	LoadingScreen,
	Modal,
	Stack,
	styled,
	Tooltip,
	useNotification,
} from "@semoss/ui";
import { setProjectFavorite } from "@/api";
import { CodeRenderer } from "@/components/code-workspace";
import { ShareOverlay } from "@/components/ui";
import { usePage, useRootStore } from "@/hooks";
import type { WorkspaceStore } from "@/stores";
import { NavbarHeader, NavbarLeft, NavbarRight } from "../../components/shared";

const StyledContent = styled("div")({
	position: "absolute",
	inset: 0,
});

export const ViewAppPage = observer(() => {
	// App ID Needed for pixel calls
	const { appId } = useParams();
	const { configStore } = useRootStore();

	const notification = useNotification();
	const navigate = useNavigate();

	const [workspace, setWorkspace] = useState<WorkspaceStore>(undefined);
	const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
	const [bookmarked, setBookmarked] = useState<boolean>(false);

	const handleBookmark = (status: boolean) => {
		setBookmarked(status);
		setProjectFavorite(appId, status)
			.then(() => {
				notification.add({
					color: "success",
					message: `Project ${
						bookmarked ? "unbookmarked" : "bookmarked"
					}`,
				});
				return;
			})
			.catch((err) => {
				// throw error if promise doesn't fulfill
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
				notification.add({
					color: "error",
					message: e.message,
				});

				navigate("/");
			});
	}, [appId]);

	// hide the screen while it loads
	if (!workspace) {
		return <LoadingScreen.Trigger description="Initializing app" />;
	}

	return (
		<>
			<NavbarLeft>
				<NavbarHeader
					logo={
						<Stack
							direction="row"
							alignItems={"center"}
							spacing={1}
						>
							<Avatar
								variant="rounded"
								src={`${Env.MODULE}/api/project-${workspace.appId}/projectImage/download`}
							/>
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
						</Stack>
					}
				/>
			</NavbarLeft>
			<NavbarRight>
				<Tooltip title={"Settings"}>
					<IconButton
						size="small"
						onClick={() => {
							navigate(`/app/${appId}`);
						}}
						data-testid={"settings"}
					>
						<Settings className="h-4 w-4" />
					</IconButton>
				</Tooltip>
				<Tooltip title={"Bookmark App"}>
					<IconButton
						size="small"
						color={bookmarked ? "primary" : "default"}
						onClick={() => handleBookmark(!bookmarked)}
						data-testid={"viewAppPage-bookmark-btn"}
					>
						{bookmarked ? (
							<Bookmark fontSize={"inherit"} />
						) : (
							<BookmarkBorderOutlined fontSize={"inherit"} />
						)}
					</IconButton>
				</Tooltip>
				<Tooltip title={"Share App"}>
					<IconButton
						size="small"
						color="default"
						onClick={() => {
							setIsShareOpen(true);
						}}
						data-testid={"viewAppPage-share-btn"}
					>
						<ShareRounded fontSize={"inherit"} />
					</IconButton>
				</Tooltip>
				<Button
					variant="contained"
					size={"small"}
					color="primary"
					disabled={
						!(
							workspace.role === "OWNER" ||
							workspace.role === "EDIT"
						)
					}
					endIcon={<EditOutlined fontSize="inherit" />}
					component={Link}
					//@ts-expect-error this is expected. props are forwarded
					to={`../../../app/${appId}/edit`}
					data-testid={"viewAppPage-edit-btn"}
				>
					Edit
				</Button>
			</NavbarRight>
			<StyledContent>
				{workspace.type === "BLOCKS" ? (
					<Renderer appId={appId} insightId={workspace.insightId} />
				) : null}
				{workspace.type === "CODE" ? (
					<CodeRenderer appId={appId} />
				) : null}
			</StyledContent>

			<Modal open={isShareOpen} onClose={() => setIsShareOpen(false)}>
				<ShareOverlay
					appId={appId}
					onClose={() => setIsShareOpen(false)}
				/>
			</Modal>
		</>
	);
});
