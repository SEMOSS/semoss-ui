import { CloudUploadIcon } from "lucide-react";
import { useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Button,
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { SettingsLinkField } from "@/components/settings/settings-link-field";
import { getAppShareUrl } from "@/components/ui/share/app-share-url";
import { useProject } from "@/hooks/use-project";
import { useSession } from "@/hooks/use-session";
import { useSettings } from "@/hooks/useSettings";

/** An app's portal, as GetProjectPortalDetails reads it */
interface PortalDetails {
	/** Whether the portal has been published */
	project_is_published: boolean;
	/** The link to the published portal */
	project_portal_url?: string;
}

/**
 * The Portal section of an app's Settings: the app's share link in this
 * platform, and publishing its portal so Monolith serves it at a link of its
 * own.
 */
export const AppPortalSettingsPage = () => {
	const { project } = useProject();
	const sessionRunPixel = useSession((state) => state.runPixel);
	const isEngineOperationAvailable = useSession(
		(state) => state.isEngineOperationAvailable,
	);
	const { adminMode } = useSettings();
	const [isPublishing, setIsPublishing] = useState(false);

	const getPortalDetails = usePixel<PortalDetails>(
		adminMode
			? `AdminGetProjectPortalDetails('${project.project_id}');`
			: `GetProjectPortalDetails('${project.project_id}');`,
	);
	const isLoaded = getPortalDetails.status === "SUCCESS";
	const portalUrl = isLoaded
		? (getPortalDetails.data?.project_portal_url ?? "")
		: "";
	const isPublished = isLoaded && Boolean(portalUrl);

	const handlePublish = async () => {
		setIsPublishing(true);
		try {
			const response = await sessionRunPixel(
				`PublishProject(project='${project.project_id}', release=true);`,
			);
			const [result] = response.pixelReturn;
			const output = String(result?.output ?? "");
			if (response.errors.length > 0 || !result) {
				toast.error(
					response.errors.join("") || "Could not publish the portal",
				);
				return;
			}
			getPortalDetails.update({
				...getPortalDetails.data,
				project_is_published: true,
				project_portal_url: output,
			});
			toast.success("Published the portal");
		} catch (error) {
			toast.error(getErrorMessage(error, "Could not publish the portal"));
		} finally {
			setIsPublishing(false);
		}
	};

	return (
		<Card>
			<CardHeader className="border-b">
				<CardTitle>Portal</CardTitle>
				<CardDescription>
					Share the app with its link in this platform, or publish its
					portal so Monolith serves it at a link of its own.
				</CardDescription>
				<CardAction className="self-center">
					<Button
						type="button"
						size="sm"
						disabled={
							!isLoaded ||
							isPublishing ||
							!isEngineOperationAvailable("PROJECT", "access")
						}
						onClick={handlePublish}
						data-testid="appPortal-publish-btn"
					>
						{isPublishing ? (
							<Spinner className="size-4" />
						) : (
							<CloudUploadIcon aria-hidden />
						)}
						{isPublishing
							? "Publishing..."
							: isPublished
								? "Publish Again"
								: "Publish"}
					</Button>
				</CardAction>
			</CardHeader>
			<CardContent className="flex flex-col gap-6">
				<SettingsLinkField
					label="Share Link"
					description="Opens the app in this platform, for anyone with access to it."
					url={getAppShareUrl(project.project_id)}
					testIdPrefix="appPortal-share"
				/>
				{getPortalDetails.status === "ERROR" ? (
					<Alert variant="destructive">
						<AlertDescription>
							{getErrorMessage(
								getPortalDetails.error,
								"Could not read the portal",
							)}
						</AlertDescription>
					</Alert>
				) : (
					<SettingsLinkField
						label="Portal Link"
						description={
							isPublished
								? "The published portal, served by Monolith. Publish again to update it with the app's latest changes."
								: "Publish the portal to get its link."
						}
						url={portalUrl}
						emptyText={
							isLoaded ? "Not published yet" : "Loading..."
						}
						testIdPrefix="appPortal-portal"
					/>
				)}
			</CardContent>
		</Card>
	);
};
