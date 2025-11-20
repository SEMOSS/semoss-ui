import { Close } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import {
	Autocomplete,
	Button,
	createFilterOptions,
	IconButton,
	Modal,
	styled,
	TextField,
	Typography,
} from "@semoss/ui";
import { usePixel, useRootStore } from "@/hooks";
import { removeUnderscores } from "@/utility";
import { MarkdownEditor } from "../common";

const StyledModalHeading = styled(Modal.Title)({
	display: "flex",
	justifyContent: "space-between",
	alignItems: "center",
});

const StyledTitle = styled(Typography)({
	fontWeight: 500,
});

const StyledModalContent = styled(Modal.Content)(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(2),
	paddingTop: `${theme.spacing(1)}!important`,
}));

const StyledSubtitle = styled(Typography)(({ theme }) => ({
	fontWeight: 500,
	paddingBottom: theme.spacing(1),
}));

const StyledEditorContainer = styled("div")(({ theme }) => ({
	marginBottom: theme.spacing(1),
}));

interface EditDetailsModalProps {
	isOpen: boolean;
	onClose: (reset?: boolean) => void;
	control;
	onSubmit;
}

export const EditDetailsModal = (props: EditDetailsModalProps) => {
	const { isOpen, onClose, control, onSubmit } = props;
	const { configStore } = useRootStore();

	const filter = createFilterOptions<string>();

	const handleEditAppDetails = () => {
		onSubmit();
	};

	// filter metakeys to the ones we want
	const projectMetaKeys = configStore.store.config.projectMetaKeys.filter(
		(k) => {
			return (
				k.metakey !== "description" &&
				k.metakey !== "markdown" &&
				k.metakey !== "tag" &&
				k.metakey !== "tags"
			);
		},
	);

	// track the options
	const [filterOptions, setFilterOptions] = useState<
		Record<string, string[]>
	>(() => {
		return projectMetaKeys.reduce((prev, current) => {
			prev[current.metakey] = [];

			return prev;
		}, {});
	});

	// get the values
	const projectMetaValues = usePixel<
		{
			METAKEY: string;
			METAVALUE: string;
			count: number;
		}[]
	>(`META | GetProjectMetaValues ( metaKeys = ['tag'] ) ;`);

	useEffect(() => {
		if (projectMetaValues.status !== "SUCCESS") {
			return;
		}

		// format the engine meta into a map
		const updated = projectMetaValues.data.reduce((prev, current) => {
			if (!prev[current.METAKEY]) {
				prev[current.METAKEY] = [];
			}

			prev[current.METAKEY].push(current.METAVALUE);

			return prev;
		}, {});

		// add metakeys that don't get options from projects/engines but stored in config call
		const metaKeysWithOpts = projectMetaKeys.filter((k) => {
			return k.display_options === "select-box";
		});

		metaKeysWithOpts.forEach((filter) => {
			if (filter.display_values) {
				const split = filter.display_values.split(",");
				const formatted = [];
				split.forEach((val) => {
					formatted.push(val);
				});

				updated[filter.metakey] = formatted;
			}
		});

		setFilterOptions(updated);
	}, [projectMetaValues.status, projectMetaValues.data]);

	return (
		<Modal open={isOpen} fullWidth data-testid="edit-app-details-modal">
			<StyledModalHeading>
				<StyledTitle variant="h6">Edit App Details</StyledTitle>

				<IconButton size="small" onClick={() => onClose(true)}>
					<Close />
				</IconButton>
			</StyledModalHeading>

			<StyledModalContent>
				<Controller
					name="detailsForm.description"
					control={control}
					render={({ field }) => {
						return (
							<TextField
								value={field.value}
								onChange={(val) => field.onChange(val)}
								fullWidth
								multiline
								label="Description"
								rows={3}
								data-testid="description"
							/>
						);
					}}
				/>
				<Controller
					name="detailsForm.markdown"
					control={control}
					render={({ field }) => {
						return (
							<TextField
								value={field.value}
								onChange={(val) => field.onChange(val)}
								fullWidth
								multiline
								label="Main Uses"
								rows={7}
								data-testid="markdown"
							/>
						);
					}}
				/>
				<Controller
					name="detailsForm.tag"
					control={control}
					render={({ field }) => {
						return (
							<Autocomplete
								options={[]}
								value={field.value}
								fullWidth
								multiple
								freeSolo
								onChange={(_, val) => field.onChange(val)}
								renderInput={(params) => (
									<TextField
										{...params}
										label="Tags"
										data-testid="tags"
									/>
								)}
								filterOptions={(options, params) => {
									const filtered = filter(options, params);

									const { inputValue } = params;
									const isExisting = options.some(
										(option) => inputValue === option,
									);
									if (inputValue !== "" && !isExisting) {
										filtered.push(inputValue);
									}

									return filtered;
								}}
							/>
						);
					}}
				/>
				<Controller
					name="detailsForm.appImage"
					control={control}
					render={({ field }) => {
						return (
							<TextField
								label="Image"
								variant="outlined"
								type="file"
								inputProps={{
									accept: "image/*",
								}}
								InputLabelProps={{
									shrink: true,
								}}
								onChange={(e) => {
									const value = (e.target as HTMLInputElement)
										.files;
									if (value && value.length > 0) {
										field.onChange(value[0]);
									}
								}}
								data-testid="app-image"
							/>
						);
					}}
				/>
				{projectMetaKeys.map((key) => {
					const { metakey, display_options } = key;
					const label =
						metakey.slice(0, 1).toUpperCase() + metakey.slice(1);

					if (display_options === "markdown") {
						return (
							<StyledEditorContainer key={metakey}>
								<StyledSubtitle variant="subtitle1">
									{removeUnderscores(metakey)}
								</StyledSubtitle>
								<Controller
									name={`detailsForm.${metakey}`}
									control={control}
									render={({ field }) => {
										return (
											<MarkdownEditor
												value={
													(field.value as string) ||
													""
												}
												onChange={(value) =>
													field.onChange(value)
												}
												data-testid="markdown-editor"
											/>
										);
									}}
								/>
							</StyledEditorContainer>
						);
					} else if (display_options === "textarea") {
						return (
							<Controller
								key={metakey}
								name={`detailsForm.${metakey}`}
								control={control}
								render={({ field }) => {
									return (
										<TextField
											multiline
											minRows={3}
											maxRows={3}
											label={label}
											value={
												(field.value as string) || ""
											}
											onChange={(e) =>
												field.onChange(e.target.value)
											}
										/>
									);
								}}
							/>
						);
					} else if (display_options === "single-typeahead") {
						return (
							<Controller
								key={metakey}
								name={`detailsForm.${metakey}`}
								control={control}
								render={({ field }) => {
									return (
										<Autocomplete<string, false>
											label={label}
											options={
												filterOptions[metakey]
													? filterOptions[metakey]
													: []
											}
											value={
												(field.value as string) || ""
											}
											onChange={(_event, newValue) => {
												field.onChange(newValue);
											}}
										/>
									);
								}}
							/>
						);
					} else if (display_options === "multi-typeahead") {
						return (
							<Controller
								key={metakey}
								name={`detailsForm.${metakey}`}
								control={control}
								render={({ field }) => {
									return (
										<Autocomplete<string, true, false, true>
											freeSolo={true}
											multiple={true}
											label={label}
											options={
												filterOptions[metakey]
													? filterOptions[metakey]
													: []
											}
											value={
												(field.value as string[]) || []
											}
											onChange={(_event, newValue) => {
												field.onChange(newValue);
											}}
										/>
									);
								}}
							/>
						);
					} else if (display_options === "select-box") {
						return (
							<Controller
								key={metakey}
								name={`detailsForm.${metakey}`}
								control={control}
								render={({ field }) => {
									const formattedValue =
										typeof field.value === "string"
											? [field.value]
											: field.value;

									return (
										<Autocomplete<string, true, false, true>
											multiple={true}
											label={label}
											options={
												filterOptions[metakey]
													? filterOptions[metakey]
													: []
											}
											value={
												(formattedValue as string[]) ||
												[]
											}
											onChange={(_event, newValue) => {
												field.onChange(newValue);
											}}
										/>
									);
								}}
							/>
						);
					}

					return null;
				})}
			</StyledModalContent>

			<Modal.Actions data-testid="edit-app-details-modal-actions">
				<Button
					onClick={() => onClose(true)}
					variant="text"
					data-testid="cancel"
				>
					Cancel
				</Button>
				<Button
					onClick={handleEditAppDetails}
					variant="contained"
					data-testid="save"
				>
					Save
				</Button>
			</Modal.Actions>
		</Modal>
	);
};
