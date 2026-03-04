import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { STATE_VERSION, type Variable } from "@semoss/renderer";
import { Box, Stack, styled } from "@semoss/ui";
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

const StyledAppCard = styled("div")({
	display: "flex",
	width: "100%",
	gap: "24px",
	flexDirection: "column",
});

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
		<Stack direction="column" spacing={3}>
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
			<StyledAppCard>
				<Box
					sx={{
						display: "flex",
						gap: "24px",
						flexGrow: 1,
						flexDirection: "row",
					}}
				>
					<FeaturedAppCard
						href={"../../playground/dist/"}
						tagline="Experiment in our Playground™"
						description={`Chat with different LLMs and try out different prompts from our prompt library. Or chat with multiple LLMs in one room to hold a focus group or round table.`}
						imageUrl={playground}
						chip={{
							label: "FEATURED",
							color: "#FDF0E5",
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
							color: "#FDF0E5",
						}}
					/>
				</Box>
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
			</StyledAppCard>

			<FanFavoritesSection />
		</Stack>
	);
});
