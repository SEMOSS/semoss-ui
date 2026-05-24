import html2canvas from "html2canvas";
import { ArrowLeft, Eye, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useBlocks } from "@semoss/renderer";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";
import { getBlockElement } from "@/stores";
import { SECTION_ORDER } from "../blocks-workspace/menus/default-menu";
import type { DesignerMenuItem } from "../blocks-workspace/menus/menu-types";
import { CommunityLayers } from "./CommunityLayers";

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

	// biome-ignore lint/suspicious/noExplicitAny: recursive slot structure is untyped
	const processSlots = (value: any, blocks: Record<string, any>): any => {
		if (Array.isArray(value)) {
			return value.map((item) =>
				typeof item === "string" && item in blocks
					? Object.fromEntries(
							allowedKeys
								.filter((key) => key in blocks[item])
								.map((key) => [
									key,
									processSlots(blocks[item][key], blocks),
								]),
						)
					: processSlots(item, blocks),
			);
		} else if (typeof value === "object" && value !== null) {
			return Object.fromEntries(
				Object.entries(value).map(([key, val]) => [
					key,
					processSlots(val, blocks),
				]),
			);
		} else {
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

		// biome-ignore lint/suspicious/noExplicitAny: generic walk over untyped block tree
		function walk(root: any) {
			const seen = new WeakSet<object>();
			// biome-ignore lint/suspicious/noExplicitAny: untyped stack
			const stack: any[] = [root];

			while (stack.length) {
				const node = stack.pop();
				if (node == null) continue;

				if (Array.isArray(node)) {
					for (let i = node.length - 1; i >= 0; --i)
						stack.push(node[i]);
					continue;
				}

				if (typeof node === "object") {
					if (seen.has(node)) continue;
					seen.add(node);

					const queryId =
						// biome-ignore lint/suspicious/noExplicitAny: untyped node
						(node as any).payload?.queryId ??
						// biome-ignore lint/suspicious/noExplicitAny: untyped node
						(node as any).queryId ??
						// biome-ignore lint/suspicious/noExplicitAny: untyped node
						(node as any).id;

					if (typeof queryId === "string") qIds.add(queryId);

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

					for (const v of Object.values(node)) stack.push(v);
					continue;
				}

				if (typeof node === "string") {
					let m: RegExpExecArray | null;
					// biome-ignore lint/suspicious/noAssignInExpressions: standard regex exec loop pattern
					while ((m = mustacheRE.exec(node))) {
						const rootId = m[1].split(".")[0];
						if (rootId in allQueries) qIds.add(rootId);
						if (rootId in allVariables) vIds.add(rootId);
					}
				}
			}
		}

		walk(blocks);

		const processed = new Set<string>();
		const queue = Array.from(qIds);

		while (queue.length) {
			// biome-ignore lint/style/noNonNullAssertion: queue.length check ensures non-null
			const qId = queue.pop()!;
			if (processed.has(qId)) continue;
			processed.add(qId);

			const qObj = allQueries[qId];
			if (!qObj) continue;

			walk(qObj);

			for (const id of qIds) {
				if (!processed.has(id)) queue.push(id);
			}
		}

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
				state.notebooks,
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
				}"], json=["<encode>${JSON.stringify(newClientBlock)}</encode>"]);`,
			);
			const { output, operationType } = response.pixelReturn[0];

			if (operationType.indexOf("ERROR") === -1) {
				toast.success("Successfully added document");
			} else {
				toast.error(output);
			}

			reset(AddAsClientBlock);
			onClose();
			setShowPreviewModal(false);
		},
	);

	const handleSaveAsClientBlock = async () => {
		onClose();
		setShowPreviewModal(false);
	};

	const handleInputValidations = (val: string, _field: string) => {
		if (!/^[a-zA-Z_-]*$/.test(val)) {
			return false;
		}
		return true;
	};

	const handleCanvasPreview = async () => {
		const block = state.blocks[selected];
		if (block?.id) {
			const element = getBlockElement(block.id) as HTMLElement;
			if (element) {
				const elementWidth = element.offsetWidth;
				const elementHeight = element.offsetHeight;

				try {
					const canvas = await html2canvas(element, {
						backgroundColor: null,
					});
					const dataUrl = canvas.toDataURL("image/png");
					console.log("Generated Image:", dataUrl);

					setImageDimensions({
						width: elementWidth / 2,
						height: elementHeight / 2,
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
		setShowPreviewModal(false);
	};

	return (
		<>
			<Dialog
				open={isOpen && !showPreviewModal}
				onOpenChange={(open) => !open && handleCloseModals()}
			>
				<DialogContent showCloseButton={false}>
					<DialogHeader>
						<div className="flex items-center justify-between">
							<DialogTitle>
								{isEdit ? "Edit Block" : "Add Block"}
							</DialogTitle>
							<button
								type="button"
								className="flex size-8 items-center justify-center rounded hover:bg-accent"
								onClick={handleCloseModals}
							>
								<X className="size-4" />
							</button>
						</div>
					</DialogHeader>

					<div className="flex flex-col gap-4 pt-2">
						{isEdit && (
							<div className="flex flex-col gap-2">
								<span className="text-muted-foreground text-sm">
									Block Template
								</span>
								<CommunityLayers
									item={localBlockItem}
									onJsonUpdate={handleLayersPanelUpdate}
								/>
							</div>
						)}
						<Controller
							name="name"
							control={control}
							render={({ field }) => {
								const isValid = handleInputValidations(
									field.value,
									"name",
								);
								return (
									<div className="flex flex-col gap-2">
										<span className="text-muted-foreground text-sm">
											Block Name
										</span>
										<Input
											value={field.value}
											onChange={(e) => {
												field.onChange(e.target.value);
												handleFieldChange(
													"name",
													e.target.value,
												);
											}}
											className={
												!isValid
													? "border-destructive"
													: ""
											}
										/>
										{!isValid && (
											<span className="text-destructive text-xs">
												Name should only contain
												letters, hyphens, and
												underscores
											</span>
										)}
									</div>
								);
							}}
						/>
						<Controller
							name="section"
							control={control}
							render={({ field }) => {
								const isValid = handleInputValidations(
									field.value,
									"section",
								);
								return (
									<div className="flex flex-col gap-2">
										<span className="text-muted-foreground text-sm">
											Section
										</span>
										<Select
											value={field.value || undefined}
											onValueChange={(newValue) => {
												field.onChange(newValue);
												handleFieldChange(
													"section",
													newValue,
												);
											}}
										>
											<SelectTrigger
												className={
													!isValid
														? "border-destructive"
														: ""
												}
											>
												<SelectValue placeholder="Select section" />
											</SelectTrigger>
											<SelectContent>
												{SECTION_ORDER.map(
													(section) => (
														<SelectItem
															key={section}
															value={section}
														>
															{section}
														</SelectItem>
													),
												)}
											</SelectContent>
										</Select>
										{!isValid && (
											<span className="text-destructive text-xs">
												Section should only contain
												letters, hyphens, and
												underscores
											</span>
										)}
									</div>
								);
							}}
						/>
						{!isEdit && (
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<button
											type="button"
											className="inline-flex items-center gap-2 self-start font-medium text-primary text-sm hover:underline"
											onClick={handleCanvasPreview}
										>
											<Eye className="size-4" />
											Preview Block
										</button>
									</TooltipTrigger>
									<TooltipContent>
										Preview your block
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						)}
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={handleCloseModals}>
							Cancel
						</Button>
						{isEdit ? (
							<Button onClick={handleSaveAsClientBlock}>
								Save
							</Button>
						) : (
							<Button onClick={handleAddAsClientBlock}>
								Add
							</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={showPreviewModal}
				onOpenChange={(open) => !open && handleArrowBack()}
			>
				<DialogContent showCloseButton={false}>
					<DialogHeader>
						<div className="flex items-center justify-between">
							<button
								type="button"
								className="flex size-8 items-center justify-center rounded hover:bg-accent"
								onClick={handleArrowBack}
							>
								<ArrowLeft className="size-4" />
							</button>
							<DialogTitle>Add Block</DialogTitle>
							<button
								type="button"
								className="flex size-8 items-center justify-center rounded hover:bg-accent"
								onClick={handleCloseModals}
							>
								<X className="size-4" />
							</button>
						</div>
					</DialogHeader>

					<div className="flex flex-col gap-4 pt-2">
						{imagePreview && (
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<img
											src={imagePreview}
											alt="Canvas Preview"
											style={{
												width: imageDimensions.width,
												height: imageDimensions.height,
												border: "1px solid #ccc",
												borderRadius: 8,
												overflow: "auto",
												cursor: "pointer",
											}}
										/>
									</TooltipTrigger>
									<TooltipContent>
										{localBlockItem?.helperText || ""}
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						)}
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={handleCloseModals}>
							Cancel
						</Button>
						<Button onClick={handleAddAsClientBlock}>Add</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};
