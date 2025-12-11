import { Close } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { Env, useDebouncedValue, usePixel } from "@semoss/sdk/react";
import {
	Autocomplete,
	Button,
	Chip,
	CircularProgress,
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
	currentDependencies: modelledDependency[];
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
 * Capitalizes the first letter of each word in a string
 */
const capitalizeType = (type: string): string => {
	return type
		.toLowerCase()
		.split("_")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
};

/**
 * Renders a modal to edit dependencies for an application.
 *
 * @component
 */
export const EditDependenciesModal = ({
	isOpen,
	onClose,
	appId,
	currentDependencies,
}: EditDependenciesModalProps) => {
	/**
	 * State
	 */
	const [allDeps, setAllDeps] = useState<Dependency[]>([]);
	const [selectedDeps, setSelectedDeps] =
		useState<Dependency[]>(currentDependencies);
	const [search, setSearch] = useState<string>("");

	/**
	 * Library Hooks
	 */
	const { configStore } = useRootStore();
	const notification = useNotification();
	const debouncedSearch = useDebouncedValue(search);
	const getEngines = usePixel<
		(MyEngineProjectEngine | MyEngineProjectProject)[]
	>(
		`MyEngineProject(filterWord=${JSON.stringify(debouncedSearch ?? "")});`,
		undefined,
		configStore.store.insightID,
	);

	/**
	 * Functions
	 */
	const handleUpdateDependencies = async () => {
		const res = await SetProjectDependencies(
			configStore,
			appId,
			selectedDeps.map((dep: modelledDependency) => ({
				id: dep.id,
				type: dep.type,
			})),
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

	useEffect(() => {
		setSelectedDeps(currentDependencies);
	}, [currentDependencies]);

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
						<TextField
							{...params}
							placeholder="Search..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							slotProps={{
								input: {
									...params.InputProps,
									endAdornment: (
										<>
											{search !== debouncedSearch ||
											getEngines.status !== "SUCCESS" ? (
												<CircularProgress size={24} />
											) : null}
											{params.InputProps.endAdornment}
										</>
									),
								},
							}}
							onKeyDown={() => {
								if (
									!(
										params.inputProps.ref as {
											current: { value: string };
										}
									)?.current?.value
								) {
									setSearch("");
								}
							}}
						/>
					)}
					getOptionLabel={(option: modelledDependency) => option.name}
					isOptionEqualToValue={(
						option: modelledDependency,
						value: modelledDependency,
					) => {
						return option.id === value.id;
					}}
					renderOption={(props, option: modelledDependency) => (
						<li {...props}>
							<Stack
								direction="row"
								spacing={1}
								alignItems="center"
							>
								<Chip
									label={capitalizeType(option.type)}
									size="small"
								/>
								<Typography variant="body1">
									{option.name}
								</Typography>
							</Stack>
						</li>
					)}
					filterOptions={(x) => x}
					disableCloseOnSelect
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
										{`${capitalizeType(dep.type)} | Engine ID: ${dep.id}`}
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
