import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { STATE_VERSION, type Variable } from "@semoss/renderer";
import { Breadcrumbs, Stack, Typography } from "@semoss/ui";
import { AddAppModal, AppTemplates, NewAppModal } from "../../components/app";
import CreateAppSection from "../../components/landing/CreateAppSection";
import { NavbarHeader, NavbarLeft } from "../../components/shared";
import { useRootStore } from "../../hooks";
import {
	BASE_APP_QUERIES,
	BASE_APP_VARIABLES,
	BASE_PAGE_BLOCKS,
} from "./app.constants";

export const CreateAppPage = () => {
	const navigate = useNavigate();

	const { configStore } = useRootStore();
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

	const isRestricted = !configStore.isEngineOperationAvailable(
		"PROJECT",
		"add",
	);
	if (isRestricted) {
		return <Navigate to="/" replace />;
	}

	const setupApp = (type: "blocks" | "code" | "agent") => {
		if (type === "blocks") {
			setNewAppOptions({
				type: "blocks",
				state: {
					version: STATE_VERSION,
					variables: BASE_APP_VARIABLES as Record<string, Variable>,
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
	};

	return (
		<>
			<NavbarLeft>
				<NavbarHeader />
			</NavbarLeft>
			<Stack direction="column" gap={2}>
				<Stack>
					<Breadcrumbs separator="/">
						<Breadcrumbs.Item
							//@ts-expect-error: TODO FIX Type
							as={Link}
							to={`../../..`}
							underline="none"
							color="inherit"
							variant="body1"
						>
							App Catalog
						</Breadcrumbs.Item>
						<Breadcrumbs.Item
							//@ts-expect-error: TODO FIX Type
							as={Link}
							to={`.`}
							underline="none"
							color="text.disabled"
							variant="body1"
						>
							Create
						</Breadcrumbs.Item>
					</Breadcrumbs>
					<Stack direction="row" alignItems={"center"} width={"100%"}>
						<Typography variant="h4">Create New App</Typography>
						<Stack flex={1}> &nbsp;</Stack>
					</Stack>
				</Stack>
				{isUploadOpen ? (
					<AddAppModal
						open={isUploadOpen}
						handleClose={(appId) => {
							// if there is an appId navigate to it
							if (appId) {
								navigateApp(appId);
							}

							// close it
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

				<Stack gap={2}>
					<CreateAppSection
						setupApp={setupApp}
						uploadApp={() => setIsUploadOpen(true)}
					/>

					<Stack gap={2}>
						<Typography variant="h6" gutterBottom>
							Start build with a template
						</Typography>
						<AppTemplates
							/**
							 * just commented this out for now,
							 * to show all templates app cards, could be useful later
							 */
							// randomCount={6}
							onUse={(t) => {
								setNewAppOptions({
									type: "blocks",
									state: t.state,
								});
							}}
						/>
					</Stack>
				</Stack>
			</Stack>
		</>
	);
};
