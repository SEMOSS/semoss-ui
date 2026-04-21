import { ArrowBack, Close, PreviewOutlined } from "@mui/icons-material";
import html2canvas from "html2canvas";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useBlocks } from "@semoss/renderer";
import {
	Autocomplete,
	Box,
	Button,
	IconButton,
	Modal,
	styled,
	TextField,
	Tooltip,
	Typography,
} from "@semoss/ui";
import { toast } from "@semoss/ui/next";
import { useRootStore } from "@/hooks";
import { getBlockElement } from "@/stores";
import { SECTION_ORDER } from "../blocks-workspace/menus/default-menu";
import type { DesignerMenuItem } from "../blocks-workspace/menus/menu-types";
import { CommunityLayers } from "./CommunityLayers";
import { refreshCommunityTab } from "../blocks-workspace";

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
	width: "100%",
}));

const StyledButtonGroupIconButton = styled(IconButton)(({ theme }) => ({
	backgroundColor: "white",
	borderRadius: theme.shape.borderRadius,
	color: theme.palette.primary.dark,
	alignSelf: "flex-start",
	fontSize: theme.typography.pxToRem(16),
	fontWeight: 500,
	"&:hover": {
		backgroundColor: "transparent",
	},
	padding: "0px",
}));

interface EditDetailsModalProps {
	isOpen: boolean;
	// biome-ignore lint/suspicious/noExplicitAny: complex nested block shape
	selected: any;
	onClose: (reset?: boolean) => void;
	isEdit?: boolean;
	block_json?: DesignerMenuItem;
}

interface AddAsClientBlockTypes {
	name: string;
	section: string;
	helperText: string;
	visibility: "private" | "public";
	// biome-ignore lint/suspicious/noExplicitAny: block JSON is untyped
	block_json: any;
}

// biome-ignore lint/suspicious/noExplicitAny: generic dict type
type Dict<T = any> = Record<string, T>;

interface ScanResult {
	queries: Dict;
	variables: Dict;
}

export const AddAsClientBlock: AddAsClientBlockTypes = {
	name: "",
	section: "",
	helperText: "",
	visibility: "private",
	block_json: {},
};

export const AddClientBlockModal = (props: EditDetailsModalProps) => {
	const { isOpen, selected, onClose, isEdit, block_json } = props;
	const { control, setValue, reset, handleSubmit } =
		useForm<AddAsClientBlockTypes>({ defaultValues: AddAsClientBlock });
	const { monolithStore } = useRootStore();
	const { state } = useBlocks();
	const allowedKeys = ["widget", "data", "listeners", "slots", "id"];
	const [showPreviewModal, setShowPreviewModal] = useState(false);
	const [imageDimensions, setImageDimensions] = useState<{
		width: number;
		height: number;
	}>({ width: 0, height: 0 });
	// biome-ignore lint/suspicious/noExplicitAny: block item shape varies
	const [localBlockItem, setLocalBlockItem] = useState<any>([]);
	const [imagePreview, setImagePreview] = useState<string | null>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only
	useEffect(() => {
		if (block_json) {
			setLocalBlockItem(structuredClone(block_json));
		}
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional — isOpen triggers re-sync
	useEffect(() => {
		if (isEdit && block_json) {
			setValue("name", block_json.name ?? "");
			setValue("section", block_json.section ?? "");
			setValue("helperText", block_json.helperText ?? "");
		}
	}, [isEdit, block_json, setValue, isOpen]);

	// biome-ignore lint/suspicious/noExplicitAny: block JSON is untyped
	const handleLayersPanelUpdate = (updatedJson: any) => {
		// biome-ignore lint/suspicious/noExplicitAny: block JSON is untyped
		setLocalBlockItem((prev: any) => ({
			...prev,
			json: updatedJson.json,
		}));
	};

	const handleFieldChange = (field: string, value: string) => {
		// biome-ignore lint/suspicious/noExplicitAny: block item shape varies
		setLocalBlockItem((prev: any) => ({
			...prev,
			[field]: value,
		}));
	};

	/**
	 * Recursively processes the slots of a block to retain only the allowed keys.
	 *
	 * @param value - The slots or part of slots to process.
	 * @param blocks - The entire blocks object for reference.
	 */
	// biome-ignore lint/suspicious/noExplicitAny: recursive slot structure is untyped
	const processSlots = (value: any, blocks: Record<string, any>): any => {
		// Check if the current value is an array
		if (Array.isArray(value)) {
			return value.map(
				(item) =>
					// If the item is a string and exists in blocks, process it
					typeof item === "string" && item in blocks
						? Object.fromEntries(
								allowedKeys
									.filter((key) => key in blocks[item]) // Filter allowed keys
									.map((key) => [
										key,
										processSlots(blocks[item][key], blocks),
									]), // Process each key recursively
							)
						: processSlots(item, blocks), // Recursively process item if not a string or not in blocks
			);
			// Check if the current value is an object
		} else if (typeof value === "object" && value !== null) {
			return Object.fromEntries(
				Object.entries(value).map(([key, val]) => [
					key,
					processSlots(val, blocks), // Recursively process each entry
				]),
			);
		} else {
			// Return value if it's neither an array nor an object
			return value;
		}
	};

	const scanBlocks = (
		// biome-ignore lint/suspicious/noExplicitAny: block structure is untyped
		blocks: any,
		allQueries: Dict,
		allVariables: Dict,
	): ScanResult => {
		const qIds = new Set<string>();
		const vIds = new Set<string>();

		const mustacheRE = /{{\s*([^{}\s]+?)\s*}}/g;

		/** push-based walk = no recursion, cycle-safe */
		// biome-ignore lint/suspicious/noExplicitAny: generic walk over untyped block tree
		function walk(root: any) {
			const seen = new WeakSet<object>();
			// biome-ignore lint/suspicious/noExplicitAny: untyped stack
			const stack: any[] = [root];

			while (stack.length) {
				const node = stack.pop();
				if (node == null) continue;

				/* ---------- arrays ---------- */
				if (Array.isArray(node)) {
					for (let i = node.length - 1; i >= 0; --i)
						stack.push(node[i]);
					continue;
				}

				/* ---------- objects ---------- */
				if (typeof node === "object") {
					// avoid revisiting the same object (break cycles)
					if (seen.has(node)) continue;
					seen.add(node);

					const queryId =
						// biome-ignore lint/suspicious/noExplicitAny: untyped node
						(node as any).payload?.queryId ??
						// biome-ignore lint/suspicious/noExplicitAny: untyped node
						(node as any).queryId ??
						// biome-ignore lint/suspicious/noExplicitAny: untyped node
						(node as any).id;

					// query found, maybe add
					if (typeof queryId === "string") qIds.add(queryId);

					// NEW LOGIC — check for { queryId, cellId }
					if (
						node.payload &&
						typeof node.payload.queryId === "string" &&
						typeof node.payload.cellId === "string"
					) {
						const alias = state.getAlias(
							node.payload.queryId,
							node.payload.cellId,
						);
						if (alias && alias in allVariables) {
							vIds.add(alias);
						}
					}

					// enqueue own values
					for (const v of Object.values(node)) stack.push(v);
					continue;
				}

				/* ---------- strings ---------- */
				if (typeof node === "string") {
					let m: RegExpExecArray | null;
					// biome-ignore lint/suspicious/noAssignInExpressions: standard regex exec loop pattern
					while ((m = mustacheRE.exec(node))) {
						const rootId = m[1].split(".")[0]; // trim .prop chain
						if (rootId in allQueries) qIds.add(rootId);
						if (rootId in allVariables) vIds.add(rootId);
					}
				}
			}
		}

		/* pass #1 – widget tree */
		walk(blocks);

		/* pass #2 – transitive scan of every used query */
		const processed = new Set<string>();
		const queue = Array.from(qIds);

		while (queue.length) {
			// biome-ignore lint/style/noNonNullAssertion: queue.length check ensures non-null
			const qId = queue.pop()!;
			if (processed.has(qId)) continue;
			processed.add(qId);

			const qObj = allQueries[qId];
			if (!qObj) continue; // missing def – ignore

			walk(qObj); // scan its internals

			// if walk() encountered further queries, they’re now in qIds
			for (const id of qIds) {
				if (!processed.has(id)) queue.push(id);
			}
		}

		/* shape the result */
		const queries: Dict = {};
		const variables: Dict = {};

		qIds.forEach((id) => {
			if (allQueries[id]) queries[id] = allQueries[id];
		});
		vIds.forEach((id) => {
			if (allVariables[id]) variables[id] = allVariables[id];
		});

		return { queries, variables };
	};

	/**
	 * This function is a wrapper around the useForm's handleSubmit function.
	 * It processes the block's slots to remove any unnecessary keys and
	 * recursively calls itself until all the slots are processed.
	 *
	 * Once the slots are processed, it calls the monolith's AddBlock query to
	 * add the block to the monolith's database.
	 *
	 * @param {AddAsClientBlockTypes} data - The data to be sent to the monolith.
	 *
	 * @returns {Promise<void>}
	 */
	const handleAddAsClientBlock = handleSubmit(
		async (data: AddAsClientBlockTypes) => {
			const block = state.blocks[selected];
			let newClientBlock = {
				widget: block.widget,
				data: block.data,
				listeners: block.listeners,
				slots: processSlots(block.slots, state.blocks),
				id: block.id,
			};
			const result = scanBlocks(
				newClientBlock,
				state.queries,
				state.variables,
			);

			const response = await monolithStore.runQuery<[true]>(
                `AddBlock(name=["${data.name}"], section=["${
                data.section
                }"], json=["<encode>${JSON.stringify(
                newClientBlock
                )}</encode>"], queries=["<encode>${JSON.stringify(
                result.queries
                )}</encode>"], variable=["<encode>${JSON.stringify(
                result.variables
                )}</encode>"]);`
            );
			const { output, operationType } = response.pixelReturn[0];

			if (operationType.indexOf("ERROR") === -1) {
				toast.success("Successfully added document");
			} else {
				toast.error(output);
			}
            refreshCommunityTab.setRefresh(true);
			reset(AddAsClientBlock);
			onClose();
			setShowPreviewModal(false);
		},
	);

	const handleSaveAsClientBlock = async () => {
		const itemToSave = localBlockItem;
		if (!itemToSave) return;
		const _updatedClientBlock = {
			widget: itemToSave.json?.widget,
			data: itemToSave.json?.data,
			listeners: itemToSave.json?.listeners,
			slots: itemToSave.json?.slots,
		};
		// try {
		//     const response = await monolithStore.runQuery<[true]>(
		//         `AddBlock(name=["${itemToSave.name}"], section=["${
		//             itemToSave.section
		//         }"], helperText=["${
		//             itemToSave.helperText
		//         }"], json=["<encode>${JSON.stringify(
		//             updatedClientBlock,
		//         )}</encode>"]);`,
		//     );

		//     console.log('Save response:', response);
		//     const { output, operationType } = response.pixelReturn[0];

		//     if (operationType.indexOf('ERROR') === -1) {
		//         notification.add({
		//             color: 'success',
		//             message: 'Successfully saved updated block',
		//         });
		//     } else {
		//         notification.add({
		//             color: 'error',
		//             message: output,
		//         });
		//     }
		// } catch (error) {
		//     console.error('Save error:', error);
		//     notification.add({
		//         color: 'error',
		//         message: 'Error occurred while saving block',
		//     });
		// }
		// reset(AddAsClientBlock);
		onClose();
		setShowPreviewModal(false);
	};
	const handleInputValidations = (val: string, _field: string) => {
		if (!/^[a-zA-Z_-]*$/.test(val)) {
			return false;
		}
		return true;
	};

	/** html2canvas to PNG conversion */
	const handleCanvasPreview = async () => {
		const block = state.blocks[selected];
		if (block?.id) {
			const element = getBlockElement(block.id) as HTMLElement;
			if (element) {
				// Capture the element's dimensions
				const elementWidth = element.offsetWidth;
				const elementHeight = element.offsetHeight;

				try {
					const canvas = await html2canvas(element, {
						backgroundColor: null,
					});
					const dataUrl = canvas.toDataURL("image/png");
					console.log("Generated Image:", dataUrl);

					// Scale the dimensions to be 1/2 of the original size
					const scaledWidth = elementWidth / 2;
					const scaledHeight = elementHeight / 2;

					// Set the scaled dimensions
					setImageDimensions({
						width: scaledWidth,
						height: scaledHeight,
					});
					setImagePreview(dataUrl);
					setShowPreviewModal(true);
				} catch (error) {
					console.error("Error generating image:", error);
					setShowPreviewModal(false);
				}
			} else {
				console.warn(`No element found with data-block: ${block.id}`);
				setShowPreviewModal(false);
			}
		}
	};

	const handleCloseModals = () => {
		setLocalBlockItem([]);
		setShowPreviewModal(false);
		onClose();
	};

	const handleArrowBack = () => {
		setShowPreviewModal(false); // Close the second modal and show the first modal
	};

	return (
		<>
			<Modal open={isOpen && !showPreviewModal} fullWidth>
				<StyledModalHeading>
					<StyledTitle variant="h6">
						{isEdit ? "Edit Block" : "Add Block"}
					</StyledTitle>
					<IconButton size="small" onClick={handleCloseModals}>
						<Close />
					</IconButton>
				</StyledModalHeading>

				<StyledModalContent>
					{isEdit && (
						<Box sx={{ gap: "8px" }}>
							<Typography
								variant="subtitle1"
								color="text.secondary"
							>
								Block Template
							</Typography>
							<CommunityLayers
								item={localBlockItem}
								onJsonUpdate={handleLayersPanelUpdate}
							/>
						</Box>
					)}
					<Controller
						name="name"
						control={control}
						render={({ field }) => {
							return (
								<Box sx={{ gap: "8px" }}>
									<Typography
										variant="subtitle1"
										color="text.secondary"
									>
										Block Name
									</Typography>
									<TextField
										value={field.value}
										onChange={(e) => {
											field.onChange(e.target.value);
											handleFieldChange(
												"name",
												e.target.value,
											);
										}}
										fullWidth
										//label="Name"
										error={
											!handleInputValidations(
												field.value,
												"name",
											)
										}
										helperText={
											!handleInputValidations(
												field.value,
												"name",
											)
												? "Name should only contain letters, hyphens, and underscores"
												: ""
										}
									/>
								</Box>
							);
						}}
					/>
					<Controller
						name="section"
						control={control}
						render={({ field }) => {
							return (
								<Box sx={{ gap: "8px" }}>
									<Typography
										variant="subtitle1"
										color="text.secondary"
									>
										Section
									</Typography>
									<Autocomplete
										freeSolo
										fullWidth
										value={field.value}
										options={SECTION_ORDER}
										onChange={(_, newValue) => {
											field.onChange(newValue);
											handleFieldChange(
												"section",
												newValue,
											);
										}}
										onInputChange={(_, newValue) => {
											field.onChange(newValue);
											handleFieldChange(
												"section",
												newValue,
											);
										}}
										renderInput={(params) => (
											<TextField
												{...params}
												error={
													!handleInputValidations(
														field.value,
														"section",
													)
												}
												helperText={
													!handleInputValidations(
														field.value,
														"section",
													)
														? "Section should only contain letters, hyphens, and underscores"
														: ""
												}
											/>
										)}
										multiple={false}
									/>
								</Box>
							);
						}}
					/>
					{/* This section is commented out since the backend functionality is not implemented yet. */}
					{/* <Controller
                        name="helperText"
                        control={control}
                        render={({ field }) => {
                            return (
                                <Box sx={{ gap: '8px' }}>
                                    <Typography
                                        variant="subtitle1"
                                        color="text.secondary"
                                    >
                                        Tooltip Description
                                    </Typography>
                                    <TextField
                                        value={field.value}
                                        onChange={(e) => {
                                            field.onChange(e.target.value);
                                            handleFieldChange(
                                                'helperText',
                                                e.target.value,
                                            );
                                        }}
                                        fullWidth
                                    />
                                </Box>
                            );
                        }}
                    />
                    <Controller
                        name="visibility"
                        control={control}
                        render={({ field }) => (
                            <Box sx={{ gap: 0 }}>
                                <Typography variant="subtitle1">
                                    Visibility
                                </Typography>
                                <RadioGroup {...field} row>
                                    <RadioGroup.Item
                                        value="Private"
                                        label="Private"
                                    />
                                    <RadioGroup.Item
                                        value="Public"
                                        label="Public"
                                    />
                                </RadioGroup>
                            </Box>
                        )}
                    /> */}
					{!isEdit && (
						<StyledButtonGroupIconButton
							onClick={handleCanvasPreview}
						>
							<PreviewOutlined sx={{ mr: 1 }} /> Preview Block
						</StyledButtonGroupIconButton>
					)}
				</StyledModalContent>

				<Modal.Actions>
					<Button onClick={handleCloseModals} variant="text">
						Cancel
					</Button>

					{isEdit ? (
						<Button
							onClick={handleSaveAsClientBlock}
							variant="contained"
						>
							Save
						</Button>
					) : (
						<Button
							onClick={handleAddAsClientBlock}
							variant="contained"
						>
							Add
						</Button>
					)}
				</Modal.Actions>
			</Modal>

			<Modal open={showPreviewModal} maxWidth={false}>
				<StyledModalHeading>
					<IconButton size="small" onClick={handleArrowBack}>
						<ArrowBack />
					</IconButton>
					<StyledTitle variant="h6">Add Block</StyledTitle>
					<IconButton size="small" onClick={handleCloseModals}>
						<Close />
					</IconButton>
				</StyledModalHeading>

				<StyledModalContent>
					{imagePreview && (
						<Tooltip title={localBlockItem?.helperText || ""} arrow>
							<img
								src={imagePreview}
								alt="Canvas Preview"
								style={{
									width: imageDimensions.width,
									height: imageDimensions.height,
									border: "1px solid #ccc",
									borderRadius: 8,
									overflow: "auto",
									cursor: "pointer", // Optional: show pointer on hover
								}}
							/>
						</Tooltip>
					)}
				</StyledModalContent>

				<Modal.Actions>
					<Button onClick={handleCloseModals} variant="text">
						Cancel
					</Button>
					<Button
						onClick={handleAddAsClientBlock}
						variant="contained"
					>
						Add
					</Button>
				</Modal.Actions>
			</Modal>
		</>
	);
};
