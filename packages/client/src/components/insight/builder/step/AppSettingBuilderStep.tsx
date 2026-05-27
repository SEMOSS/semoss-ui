import { Download, Settings } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Button,
	Card,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { AppSettings } from "@/components/app";
import {
	MembersTable,
	PendingMembersTable,
	SettingsTiles,
} from "@/components/settings";
import { SettingsContext } from "@/contexts";
import { useRootStore } from "@/hooks";

interface AppSettingBuilderStepProps {
	appMetadata: {
		existingAppId?: string;
		appName?: string;
	};
}

export const AppSettingBuilderStep = observer(
	(props: AppSettingBuilderStepProps) => {
		const { appMetadata } = props;
		const [activeTab, setActiveTab] = useState("general");
		const { configStore, monolithStore } = useRootStore();
		const navigate = useNavigate();

		/**
		 * Method that is called to export the app
		 */
		const exportApp = async () => {
			if (!appMetadata.existingAppId) return;

			try {
				// export the app
				const response = await monolithStore.runQuery<[string]>(
					`ExportProjectApp(project=["${appMetadata.existingAppId}"]);`,
				);

				// throw an error if there is no key
				const key = response.pixelReturn[0].output;
				if (!key) {
					throw new Error("Error exporting app");
				}

				await monolithStore.download(configStore.store.insightID, key);

				toast.success("Success");
			} catch (e) {
				console.error(e);

				toast.error(
					e instanceof Error ? e.message : "Error exporting app",
				);
			}
		};

		// If no existing app, we can't show settings
		if (!appMetadata.existingAppId) {
			return (
				<Card className="flex h-full flex-col overflow-hidden p-6">
					<h2 className="mb-2 font-semibold text-xl">Settings</h2>
					<p className="text-muted-foreground text-sm">
						Please select or create an app first.
					</p>
				</Card>
			);
		}

		return (
			<SettingsContext.Provider
				value={{
					adminMode: false,
				}}
			>
				<Card className="flex h-full flex-col overflow-hidden p-6">
					<div className="mb-4 flex flex-row items-center gap-2">
						<h2 className="font-semibold text-xl">Settings</h2>
						<Settings className="size-6" />
					</div>

					<Tabs
						value={activeTab}
						onValueChange={setActiveTab}
						className="flex min-h-0 flex-1 flex-col overflow-hidden"
					>
						<TabsList>
							<TabsTrigger value="general">General</TabsTrigger>
							<TabsTrigger value="access-control">
								Access Control
							</TabsTrigger>
						</TabsList>

						<div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
							<TabsContent
								value="general"
								className="flex-1 overflow-auto data-[state=inactive]:hidden"
							>
								<div className="flex w-full flex-col gap-4 p-4">
									<div className="flex w-full justify-end">
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													variant="ghost"
													size="icon-sm"
													onClick={() => {
														exportApp();
													}}
												>
													<Download className="size-4" />
												</Button>
											</TooltipTrigger>
											<TooltipContent>
												Export
											</TooltipContent>
										</Tooltip>
									</div>
									<AppSettings
										id={appMetadata.existingAppId}
									/>
								</div>
							</TabsContent>

							<TabsContent
								value="access-control"
								className="flex-1 overflow-auto data-[state=inactive]:hidden"
							>
								<div className="flex w-full flex-col gap-6 p-4">
									<section className="w-full rounded-md bg-background shadow-[0px_5px_22px_0px_rgba(0,0,0,0.06)]">
										<div className="p-4">
											<h3 className="mb-2 font-semibold text-base">
												Privacy & Access Control
											</h3>
											<p className="mb-4 text-muted-foreground text-sm">
												Configure who can access your
												apps and how it appears to
												others
											</p>
											<SettingsTiles
												type={"PROJECT"}
												id={appMetadata.existingAppId}
												name={
													appMetadata.appName || "app"
												}
												onDelete={() => {
													navigate("/app");
													console.log("App deleted");
												}}
											/>
										</div>
									</section>

									<section className="w-full rounded-md bg-background shadow-[0px_5px_22px_0px_rgba(0,0,0,0.06)]">
										<div className="p-4">
											<h3 className="mb-2 font-semibold text-base">
												Member Permissions
											</h3>
											<div className="flex flex-col gap-4">
												<PendingMembersTable
													type={"PROJECT"}
													id={
														appMetadata.existingAppId
													}
												/>
												<MembersTable
													type={"PROJECT"}
													id={
														appMetadata.existingAppId
													}
													onChange={() =>
														console.log(
															"Members changed",
														)
													}
												/>
											</div>
										</div>
									</section>
								</div>
							</TabsContent>
						</div>
					</Tabs>
				</Card>
			</SettingsContext.Provider>
		);
	},
);
