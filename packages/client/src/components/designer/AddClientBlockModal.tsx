import { Close } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { Control, Controller, useForm } from "react-hook-form";
import { useBlocks } from "@semoss/renderer";
import {
	Autocomplete,
	Button,
	createFilterOptions,
	IconButton,
	Modal,
	styled,
	TextField,
	Typography,
	useNotification,
} from "@semoss/ui";
import { usePixel, useRootStore } from "@/hooks";
import { SECTION_ORDER } from "../blocks-workspace/menus/default-menu";

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

interface EditDetailsModalProps {
	isOpen: boolean;
	selected: any;
	onClose: (reset?: boolean) => void;
}

interface AddAsClientBlockTypes {
	name: string;
	section: string;
	block_json: any;
}

type Dict<T = any> = Record<string, T>;

interface ScanResult {
	queries: Dict;
	variables: Dict;
}

export const AddAsClientBlock: AddAsClientBlockTypes = {
	name: "",
	section: "",
	block_json: {},
};

export const AddClientBlockModal = (props: EditDetailsModalProps) => {
	const { isOpen, selected, onClose } = props;
	const { control, setValue, reset, handleSubmit } =
		useForm<AddAsClientBlockTypes>({ defaultValues: AddAsClientBlock });
	const { monolithStore, configStore } = useRootStore();
	const { registry, state } = useBlocks();
	const notification = useNotification();
	const allowedKeys = ["widget", "data", "listeners", "slots", "id"];

	/**
	 * Recursively processes the slots of a block to retain only the allowed keys.
	 *
	 * @param {any} value - The slots or part of slots to process.
	 * @param {Record<string, any>} blocks - The entire blocks object for reference.
	 * @returns {any} Processed slots with only allowed keys retained.
	 */
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
		blocks: any,
		allQueries: Dict,
		allVariables: Dict,
	): ScanResult => {
		const qIds = new Set<string>();
		const vIds = new Set<string>();

		const mustacheRE = /{{\s*([^{}\s]+?)\s*}}/g;

		/** push-based walk = no recursion, cycle-safe */
		function walk(root: any) {
			const seen = new WeakSet<object>();
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
						(node as any).payload?.queryId ??
						(node as any).queryId ??
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
			newClientBlock = {
				...newClientBlock,
				queries: result.queries,
				variables: result.variables,
			} as typeof newClientBlock & { queries: Dict; variables: Dict };

			const response = await monolithStore.runQuery<[true]>(
				`AddBlock(name=["${data.name}"], section=["${
					data.section
				}"], json=["<encode>${JSON.stringify(
					newClientBlock,
				)}</encode>"]);`,
			);

			const { output, operationType } = response.pixelReturn[0];

			if (operationType.indexOf("ERROR") === -1) {
				notification.add({
					color: "success",
					message: `Successfully added document`,
				});
			} else {
				notification.add({
					color: "error",
					message: output,
				});
			}

			reset(AddAsClientBlock);
			onClose();
		},
	);

	const handleInputValidations = (val: string, field: string) => {
		if (!/^[a-zA-Z_-]*$/.test(val)) {
			return false;
		}
		return true;
	};

	return (
		<Modal open={isOpen} fullWidth>
			<StyledModalHeading>
				<StyledTitle variant="h6">Add as client block</StyledTitle>

				<IconButton size="small" onClick={() => onClose(true)}>
					<Close />
				</IconButton>
			</StyledModalHeading>

			<StyledModalContent>
				<Controller
					name="name"
					control={control}
					render={({ field }) => {
						return (
							<TextField
								value={field.value}
								onChange={(val) => field.onChange(val)}
								fullWidth
								label="Name"
								error={
									!handleInputValidations(field.value, "name")
								}
								helperText={
									!handleInputValidations(field.value, "name")
										? "Name should only contain letters, hyphens, and underscores"
										: ""
								}
							/>
						);
					}}
				/>
				<Controller
					name="section"
					control={control}
					render={({ field }) => {
						return (
							<Autocomplete
								freeSolo
								fullWidth
								value={field.value}
								options={SECTION_ORDER}
								onChange={(_, newValue) =>
									field.onChange(newValue)
								}
								onInputChange={(_, newValue) =>
									field.onChange(newValue)
								}
								renderInput={(params) => (
									<TextField
										{...params}
										label="Section"
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
						);
					}}
				/>
			</StyledModalContent>

			<Modal.Actions>
				<Button onClick={() => onClose(true)} variant="text">
					Cancel
				</Button>
				<Button onClick={handleAddAsClientBlock} variant="contained">
					Add
				</Button>
			</Modal.Actions>
		</Modal>
	);
};
