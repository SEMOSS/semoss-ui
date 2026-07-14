import { ArrowRight } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import type { Variable } from "@semoss/renderer";
import { STATE_VERSION } from "@semoss/renderer/version";
import { Button, H4, Muted } from "@semoss/ui/next";
import BI from "@/assets/img/BI.png";
import DevBanner from "@/assets/img/DevBanner.png";
import Terminal from "@/assets/img/Terminal.png";
import { NewAppModal } from "@/components/app";
import {
	BannerSection,
	LandingHeader,
	SystemAppCard,
} from "@/components/landing";
import { usePage, useRootStore } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";
import {
	BASE_APP_QUERIES,
	BASE_APP_VARIABLES,
	BASE_PAGE_BLOCKS,
} from "@/pages/app/app.constants";
import { NavbarHeader, NavbarLeft } from "../components/shared";

export const LandingPage: React.FC = observer(() => {
	// setup the page
	usePage({
		showNavbarSearch: true,
	});

	const { configStore } = useRootStore();
	const navigate = useNavigate();

	const [newAppOptions, setNewAppOptions] = useState<
		React.ComponentProps<typeof NewAppModal>["options"] | null
	>(null);

	const isNameOpen = !!newAppOptions;

	const isRestricted = !configStore.isEngineOperationAvailable(
		"PROJECT",
		"add",
	);
	if (isRestricted) {
		return <Navigate to="/" replace />;
	}

	return (
		<>
			<NavbarLeft>
				<NavbarHeader />
			</NavbarLeft>
			<div className="flex w-full flex-col gap-6 pb-8">
				<BannerSection
					imageUrl={DevBanner}
					tagline={"Experiment with AI in the Playground"}
					description={
						"Experience AI that goes beyond chat. Deploy multiple LLMs with powerful tool-calling abilities through MCP integration. Watch AI agents manipulate files, call APIs, and execute real workflows while tackling complex tasks. Turn conversations into actions and ideas into results."
					}
					link={{
						label: "Launch Playground",
						to: "../../playground/dist/",
					}}
				/>
				<div className="flex w-full flex-col gap-6">
					<div className="flex grow flex-row gap-6">
						<div className="flex w-full flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
							<div className="flex flex-col gap-1">
								<H4 className="font-bold text-foreground">
									Get started with our tool
								</H4>
								<Muted>
									Start building your app in the way that
									works best for you.
								</Muted>
							</div>
							<Button
								asChild
								variant="ghost"
								size="default"
								className="shrink-0 text-primary hover:bg-transparent hover:text-primary"
							>
								<Link to="/app/new">
									Browse Templates
									<ArrowRight className="size-4" />
								</Link>
							</Button>
						</div>
					</div>
					{isNameOpen ? (
						<NewAppModal
							open={isNameOpen}
							options={newAppOptions}
							onClose={(appId) => {
								if (appId) {
									navigate(`/app/${appId}/edit`);
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
							} else if (type === "workflow") {
								setNewAppOptions({ type: "workflow" });
							}
						}}
					/>
				</div>

				<div className="flex w-full flex-col gap-3">
					<div className="flex-col gap-1">
						<H4 className="font-bold text-foreground">
							Try these fan favorites
						</H4>
						<Muted>
							Explore popular apps built by the community.
						</Muted>
					</div>
					<div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
						<SystemAppCard
							name="Playground"
							description="Test your apps and skills"
							href="../../playground/dist/"
							img={BI}
						/>

						<SystemAppCard
							name="Terminal"
							description="Execute commands and see a response"
							href="../../terminal/dist/"
							img={Terminal}
						/>

						<SystemAppCard
							name="BI"
							description="Develop dashboards and visualizations to view data"
							href="../../legacy/dist/"
							img={BI}
						/>
					</div>
				</div>
			</div>
		</>
	);
});
