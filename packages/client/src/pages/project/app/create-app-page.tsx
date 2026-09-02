import { ChevronRight, UploadIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { Variable } from "@semoss/renderer";
import { STATE_VERSION } from "@semoss/renderer/version";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Button,
	H4,
	P,
} from "@semoss/ui/next";
import { NewAppModal } from "@/components/app";
import { LandingHeader } from "@/components/landing";
import { UploadProjectDialog } from "@/components/project";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { useNavigate } from "@/hooks/useNavigate";
import {
	BASE_APP_QUERIES,
	BASE_APP_VARIABLES,
	BASE_PAGE_BLOCKS,
} from "../../app/app.constants";

export const CreateAppPage = () => {
	const navigate = useNavigate();

	const [isUploadOpen, setIsUploadOpen] = useState(false);
	const [newAppOptions, setNewAppOptions] = useState<
		React.ComponentProps<typeof NewAppModal>["options"] | null
	>(null);

	const isNameOpen = !!newAppOptions;

	/**
	 * Navigate to the app and open it
	 *
	 * appId - appId of the app
	 */
	const navigateApp = (appId: string) => {
		if (!appId) {
			return;
		}

		navigate(`/app/${appId}/edit`);
	};

	return (
		<>
			<NavbarLeft>
				<NavbarHeader logo={null} />
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to="../">App Catalog</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator>
							<ChevronRight />
						</BreadcrumbSeparator>
						<BreadcrumbItem>
							<BreadcrumbPage>New</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
			</NavbarLeft>
			<div className="flex flex-col gap-4">
				{isUploadOpen ? (
					<UploadProjectDialog
						open={isUploadOpen}
						type="APP"
						handleClose={(appId) => {
							if (appId) {
								navigateApp(appId);
							}
							setIsUploadOpen(false);
						}}
					/>
				) : null}

				{isNameOpen ? (
					<NewAppModal
						open={isNameOpen}
						options={newAppOptions}
						onClose={(appId) => {
							if (appId) {
								navigateApp(appId);
							} else {
								// close the modal
								setNewAppOptions(null);
							}
						}}
					/>
				) : null}

				<div className="flex flex-row items-center justify-between gap-2">
					<H4>New App</H4>
					<Button
						variant="outline"
						data-testid={"createAppSection-upload-btn"}
						onClick={() => setIsUploadOpen(true)}
					>
						<UploadIcon />
						Upload
					</Button>
				</div>
				<P className="mb-3 text-muted-foreground">
					In a platform where data drives decisions, apps are how data
					come to life. Whether you're a developer, data engineer, or
					product owner, this page helps you build, organize, and
					share interactive experiences — from drag-and-drop layouts
					to custom code and agent-powered workflows — so your team
					can turn data into action.
				</P>
				<div className="flex w-full flex-col gap-4">
					<LandingHeader
						onCreate={(type) => {
							if (type === "blocks") {
								setNewAppOptions({
									type: "blocks",
									state: {
										version: STATE_VERSION,
										variables: BASE_APP_VARIABLES as Record<
											string,
											Variable
										>,
										queries: BASE_APP_QUERIES,
										blocks: BASE_PAGE_BLOCKS,
										executionOrder: [],
									},
								});
							} else if (type === "code") {
								setNewAppOptions({
									type: "code",
								});
							} else if (type === "agent") {
								navigate("/app/new/prompt");
							}
						}}
					/>
				</div>
			</div>
		</>
	);
};
