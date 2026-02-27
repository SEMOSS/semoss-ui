import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { STATE_VERSION, type Variable } from "@semoss/renderer";
import AIConductor from "@/assets/img/AIConductor.png";
import DevBanner from "@/assets/img/DevBanner.png";
import playground from "@/assets/img/playground.png";
import { NewAppModal } from "@/components/app";
import { BannerSection } from "@/components/landing/BannerSection";
import { FeaturedAppCard } from "@/components/landing/FeaturedAppCard";
import { useRootStore } from "@/hooks";
import {
	BASE_APP_QUERIES,
	BASE_APP_VARIABLES,
	BASE_PAGE_BLOCKS,
} from "../../pages/app/app.constants";
import { FanFavoritesSection } from "./FanFavoritesSection";
import { LandingHeader } from "./landing-header";

export const DeveloperUserScreen = observer(() => {
	const { configStore } = useRootStore();
	const navigate = useNavigate();

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

	const isRestricted = !configStore.isEngineOperationAvailable(
		"PROJECT",
		"add",
	);
	if (isRestricted) {
		return <Navigate to="/" replace />;
	}

	return (
		<div className="flex flex-col gap-6">
			<BannerSection
				imageUrl={DevBanner}
				tagline={`Empower your ideas with ${configStore.theme.name}`}
				description={
					"Build, automate, and innovate—all without coding. Harness the power of AI to transform your projects and workflows"
				}
				link={{
					label: "Browse Templates",
					to: "/app/new",
				}}
			/>
			<div className="flex w-full flex-col gap-6">
				<div className="flex grow flex-row gap-6">
					<FeaturedAppCard
						href={"../../playground/dist/"}
						tagline="Experiment in our Playground™"
						description={`Chat with different LLMs and try out different prompts from our prompt library. Or chat with multiple LLMs in one room to hold a focus group or round table.`}
						imageUrl={playground}
						chip={{
							label: "FEATURED",
							color: "var(--accent)",
						}}
					/>
					<FeaturedAppCard
						tagline={"Simplify tasks with AI Conductor"}
						description={
							"Use a chat interface to breakdown goals into subtasks that can be accomplished via an app, a routine, or another user. Simplify your workflows!"
						}
						imageUrl={AIConductor}
						chip={{
							label: "NEW",
							color: "var(--accent)",
						}}
					/>
				</div>
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

			<FanFavoritesSection />
		</div>
	);
});
