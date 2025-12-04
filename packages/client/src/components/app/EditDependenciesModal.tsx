import { Close } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { Env, usePixel } from "@semoss/sdk/react";
import {
	Autocomplete,
	Button,
	IconButton,
	Modal,
	Stack,
	styled,
	TextField,
	Typography,
	useNotification,
} from "@semoss/ui";
import { useRootStore } from "@/hooks";
import {
	type modelledDependency,
	SetProjectDependencies,
} from "./app-details.utility";

interface EditDependenciesModalProps {
	isOpen: boolean;
	onClose: (refresh: boolean) => void;
	appId: string;
}

interface MyEngineProjectEngine {
	app_id: string;
	app_name: string;
	app_type: string;
}

interface MyEngineProjectProject {
	project_id: string;
	project_name: string;
}

interface Dependency {
	id: string;
	name: string;
	type: string;
}

const StyledModalHeading = styled(Modal.Title)({
	display: "flex",
	justifyContent: "space-between",
	alignItems: "center",
});

const StyledHeader = styled(Typography)({
	fontWeight: 500,
});

const StyledModalSubHeading = styled(Typography)(({ theme }) => ({
	paddingBottom: theme.spacing(2),
	fontWeight: 500,
}));

const StyledDependencyListItem = styled("li")(({ theme }) => ({
	margin: `${theme.spacing(1)} 0`,
	padding: `0 ${theme.spacing(2)}`,
	gap: theme.spacing(2),
	display: "grid",
	gridTemplateColumns: "auto 1fr auto",
	alignItems: "center",
}));

const StyledCardImage = styled("img")({
	display: "flex",
	width: "50px",
	height: "50px",
	borderRadius: "8px",
	flexDirection: "column",
	justifyContent: "center",
	alignItems: "center",

	overflowClipMargin: "content-box",
	overflow: "clip",
	objectFit: "cover",
});

/**
 * Renders a modal to edit dependencies for an application.
 *
 * @component
 */
export const EditDependenciesModal = ({
	isOpen,
	onClose,
	appId,
}: EditDependenciesModalProps) => {
	/**
	 * Library Hooks
	 */
	const { configStore } = useRootStore();
	const notification = useNotification();
	const getEngines = usePixel<
		(MyEngineProjectEngine | MyEngineProjectProject)[]
	>("MyEngineProject();", undefined, configStore.store.insightID);

	/**
	 * State
	 */
	const [allDeps, setAllDeps] = useState<Dependency[]>([]);
	const [selectedDeps, setSelectedDeps] = useState<Dependency[]>([]);

	/**
	 * Functions
	 */
	const handleUpdateDependencies = async () => {
		const res = await SetProjectDependencies(
			configStore,
			appId,
			selectedDeps.map((dep: modelledDependency) => dep.id),
		);

		if (res.type === "success") {
			notification.add({
				color: "success",
				message: "Successfully updated dependencies",
			});
			onClose(true);
		} else {
			notification.add({
				color: "error",
				message: res.output,
			});
		}
	};

	const handleRemoveDependency = (id: string) => {
		const newDependencies = selectedDeps.filter(
			(dep: modelledDependency) => dep.id !== id,
		);
		setSelectedDeps(newDependencies);
	};

	/**
	 * Effects
	 */
	useEffect(() => {
		if (getEngines.status !== "SUCCESS") {
			return;
		}

		setAllDeps(
			getEngines.data.map((engineProject) => {
				const eng = engineProject as MyEngineProjectEngine;
				const proj = engineProject as MyEngineProjectProject;
				if (eng.app_id) {
					return {
						id: eng.app_id,
						name: eng.app_name,
						type: eng.app_type,
					};
				} else if (proj.project_id) {
					return {
						id: proj.project_id,
						name: proj.project_name,
						type: "PROJECT",
					};
				}
				return null;
			}),
		);
	}, [getEngines.status, getEngines.data]);

	return (
		<Modal open={isOpen} fullWidth onClose={() => onClose(false)}>
			<StyledModalHeading>
				<StyledHeader variant="h6">
					Add and Edit Dependencies
				</StyledHeader>

				<IconButton size="small" onClick={() => onClose(false)}>
					<Close />
				</IconButton>
			</StyledModalHeading>

			<Modal.Content>
				<StyledModalSubHeading variant="subtitle1">
					Linked Dependencies
				</StyledModalSubHeading>

				<Autocomplete
					options={allDeps}
					value={selectedDeps}
					fullWidth
					multiple
					onChange={(_, val: Dependency[]) => setSelectedDeps(val)}
					renderInput={(params) => (
						<TextField {...params} placeholder="Search..." />
					)}
					getOptionLabel={(option: modelledDependency) => option.name}
					isOptionEqualToValue={(
						option: modelledDependency,
						value: modelledDependency,
					) => {
						return option.id === value.id;
					}}
				/>

				{selectedDeps.map((dep, idx: number) => {
					return (
						<StyledDependencyListItem key={`${dep.id}-${idx}`}>
							<StyledCardImage
								src={
									dep.type === "PROJECT"
										? `${Env.MODULE}/api/project-${dep.id}/projectImage/download`
										: `${Env.MODULE}/api/e-${dep.id}/image/download`
								}
							/>
							<div>
								<Typography variant="h6">{dep.name}</Typography>
								<Stack direction="row">
									<Typography variant="body2">
										{`${dep.type} | Engine ID: ${dep.id}`}
									</Typography>
								</Stack>
							</div>
							<IconButton
								onClick={() => handleRemoveDependency(dep.id)}
							>
								<Close />
							</IconButton>
						</StyledDependencyListItem>
					);
				})}
			</Modal.Content>

			<Modal.Actions>
				<Button onClick={() => onClose(false)} variant="text">
					Cancel
				</Button>
				<Button onClick={handleUpdateDependencies} variant="contained">
					Save
				</Button>
			</Modal.Actions>
		</Modal>
	);
};
