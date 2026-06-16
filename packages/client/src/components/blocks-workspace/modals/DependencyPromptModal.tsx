import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { useBlocks } from "@semoss/renderer";
import {
	Badge,
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Label,
	RadioGroup,
	RadioGroupItem,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@semoss/ui/next";

interface DependencyPromptModalProps {
	open: boolean;
	onClose: () => void;
	onDelete: () => void;
	onReplace?: (replacements: { [blockId: string]: string }) => void;
	dependents: string[];
	replacementOptions?: string[];
	showReplaceOptions?: boolean;
	cosmetics?: {
		title: string;
		desc: string;
	};
}

export const DependencyPromptModal = (props: DependencyPromptModalProps) => {
	const {
		open,
		onClose,
		onDelete,
		onReplace,
		dependents,
		replacementOptions = [],
		showReplaceOptions = true,
		cosmetics = {
			title: "Delete Cell?",
			desc: "This cell is linked to multiple components in your app. Deleting it may cause errors or broken connections.",
		},
	} = props;

	const { state } = useBlocks();
	const [replaceOption, setReplaceOption] = useState("replaceAll");
	const [selectedReplacement, setSelectedReplacement] = useState("");
	const [isUsageExpanded, setIsUsageExpanded] = useState(true);
	const [individualReplacements, setIndividualReplacements] = useState<{
		[blockId: string]: string;
	}>({});
	const type: string = cosmetics.title
		.split(" ")[1]
		.replace("?", "")
		.toUpperCase();

	// Unique IDs
	const radioGroupId = useId();
	const replaceAllId = `${radioGroupId}-replaceAll`;
	const replaceIndividualId = `${radioGroupId}-replaceIndividual`;
	const selectAllId = `${radioGroupId}-selectAll`;

	// Extract blocks for table use
	const dependentBlocks = useMemo(
		() =>
			dependents.map((blockId) => {
				const block = state.getBlock(blockId);
				return {
					blockType: block?.widget || "Unknown",
					blockId: block?.id || blockId,
				};
			}),
		[dependents, state],
	);

	const handleReplaceAndDelete = () => {
		if (!onReplace) return;
		if (replaceOption === "replaceAll" && selectedReplacement) {
			const replacements: { [blockId: string]: string } = {};
			dependentBlocks.forEach((block) => {
				replacements[block.blockId] = selectedReplacement;
			});
			onReplace(replacements);
			handleClose();
		} else if (replaceOption === "replaceIndividual") {
			onReplace(individualReplacements);
			handleClose();
		}
	};

	const handleDeleteAnyway = () => {
		onDelete();
		handleClose();
	};

	const updateIndividualReplacement = (blockId: string, value: string) => {
		setIndividualReplacements((prev) => ({
			...prev,
			[blockId]: value,
		}));
	};

	const isReplaceAndDeleteDisabled = () => {
		if (!showReplaceOptions) return false;
		if (replaceOption === "replaceAll") {
			return !selectedReplacement;
		}
		return dependentBlocks.some(
			(block) => !individualReplacements[block.blockId],
		);
	};

	const handleClose = () => {
		onClose();
		setReplaceOption("replaceAll");
		setSelectedReplacement("");
		setIndividualReplacements({});
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent
				className={`gap-0 p-0 ${showReplaceOptions ? "sm:max-w-3xl" : "sm:max-w-2xl"}`}
				data-testid={`delete-${type.toLowerCase()}-modal`}
			>
				<DialogHeader className="space-y-0 border-b px-6 py-4">
					<div className="flex items-center justify-between">
						<DialogTitle className="font-semibold text-base">
							{cosmetics.title}
						</DialogTitle>
					</div>
				</DialogHeader>

				<div className="px-6 py-4">
					{/* Warning Alert */}
					<div className="mb-4 flex items-start gap-2 rounded border border-orange-300 bg-orange-50 p-3">
						<AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-600" />
						<p className="text-gray-800 text-sm leading-relaxed">
							{cosmetics.desc}
						</p>
					</div>

					{/* Cell Usage Collapsible Section with max 3 rows */}
					<Collapsible
						open={isUsageExpanded}
						onOpenChange={setIsUsageExpanded}
						className="mb-4"
					>
						<CollapsibleTrigger className="flex w-full items-center justify-between py-2 hover:no-underline">
							<p className="font-normal text-gray-700 text-sm">
								{`This ${type.toLowerCase()} is used in :`}
							</p>
							{isUsageExpanded ? (
								<ChevronUp className="h-4 w-4 text-gray-500" />
							) : (
								<ChevronDown className="h-4 w-4 text-gray-500" />
							)}
						</CollapsibleTrigger>
						<CollapsibleContent>
							<div
								className="mt-2 flex max-h-[96px] flex-wrap gap-2 overflow-y-auto"
								data-testid={`delete-${type.toLowerCase()}-modal-usage-list`}
							>
								{dependents.map((usage) => (
									<Badge
										key={usage}
										variant="outline"
										className="border-gray-300 bg-white font-normal text-gray-700 text-xs hover:bg-white"
										data-testid={`delete-${type.toLowerCase()}-modal-usage-${usage}`}
									>
										{usage}
									</Badge>
								))}
							</div>
						</CollapsibleContent>
					</Collapsible>

					{/* Conditional Replace Options Section */}
					{showReplaceOptions && onReplace && (
						<div className="mb-4">
							<p className="mb-3 font-normal text-gray-700 text-sm">
								You can replace the links below before
								continuing.
							</p>
							<RadioGroup
								value={replaceOption}
								onValueChange={setReplaceOption}
								className="flex items-center gap-6"
								id={radioGroupId}
							>
								<div className="flex items-center space-x-2">
									<RadioGroupItem
										value="replaceAll"
										id={replaceAllId}
										data-testid={`delete-${type.toLowerCase()}-modal-replace-all`}
									/>
									<Label
										htmlFor={replaceAllId}
										className="cursor-pointer font-normal text-gray-900 text-sm"
									>
										Replace all
									</Label>
								</div>
								<div className="flex items-center space-x-2">
									<RadioGroupItem
										value="replaceIndividual"
										id={replaceIndividualId}
										data-testid={`delete-${type.toLowerCase()}-modal-replace-individual`}
									/>
									<Label
										htmlFor={replaceIndividualId}
										className="cursor-pointer font-normal text-gray-900 text-sm"
									>
										Replace individual
									</Label>
								</div>
							</RadioGroup>
						</div>
					)}

					{/* Conditional Replace All */}
					{showReplaceOptions &&
						onReplace &&
						replaceOption === "replaceAll" && (
							<div className="mt-4 space-y-3">
								<Label
									htmlFor={selectAllId}
									className="block font-normal text-gray-700 text-sm"
								>
									Replace With
								</Label>
								<div className="w-full rounded-md border border-gray-300 bg-white">
									<Select
										value={selectedReplacement}
										onValueChange={setSelectedReplacement}
									>
										<SelectTrigger
											id={selectAllId}
											className="w-full min-w-0 border-0 focus:ring-0"
											data-testid={`delete-${type.toLowerCase()}-modal-replacement-select`}
										>
											<SelectValue placeholder="Select" />
										</SelectTrigger>
										<SelectContent className="max-h-[300px]">
											{replacementOptions.length === 0 ? (
												<SelectItem
													value="none"
													disabled
												>
													No options available
												</SelectItem>
											) : (
												replacementOptions.map(
													(option) => (
														<SelectItem
															key={option}
															value={option}
															className="text-gray-700 text-sm"
														>
															{option}
														</SelectItem>
													),
												)
											)}
										</SelectContent>
									</Select>
								</div>
							</div>
						)}

					{/* Conditional Replace Individual Table */}
					{showReplaceOptions &&
						onReplace &&
						replaceOption === "replaceIndividual" && (
							<div className="mt-4 space-y-3">
								<div className="max-h-[256px] overflow-hidden overflow-y-auto rounded-md border border-gray-200">
									<Table className="table-fixed">
										<colgroup>
											<col style={{ width: "30%" }} />
											<col style={{ width: "30%" }} />
											<col style={{ width: "40%" }} />
										</colgroup>
										<TableHeader className="sticky top-0 z-10 bg-gray-50">
											<TableRow className="border-gray-200 border-b">
												<TableHead className="px-4 py-3 text-left font-medium text-gray-700 text-sm">
													Block Type
												</TableHead>
												<TableHead className="px-4 py-3 text-left font-medium text-gray-700 text-sm">
													Block ID
												</TableHead>
												<TableHead className="px-4 py-3 text-left font-medium text-gray-700 text-sm">
													Replace With
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody className="bg-white">
											{dependentBlocks.map((block) => {
												const selectId = `${radioGroupId}-select-${block.blockId}`;
												return (
													<TableRow
														key={block.blockId}
														className="border-gray-200 border-b"
													>
														<TableCell className="px-4 py-3 text-gray-900 text-sm">
															{block.blockType}
														</TableCell>
														<TableCell className="px-4 py-3 text-gray-900 text-sm">
															{block.blockId}
														</TableCell>
														<TableCell className="px-4 py-3">
															<div className="flex w-full">
																<Select
																	value={
																		individualReplacements[
																			block
																				.blockId
																		] || ""
																	}
																	onValueChange={(
																		value,
																	) =>
																		updateIndividualReplacement(
																			block.blockId,
																			value,
																		)
																	}
																>
																	<SelectTrigger
																		id={
																			selectId
																		}
																		className="w-full min-w-0 border-gray-300"
																		data-testid={`delete-${type.toLowerCase()}-modal-replacement-${block.blockId}`}
																	>
																		<SelectValue placeholder="Select" />
																	</SelectTrigger>
																	<SelectContent className="max-h-[300px]">
																		{replacementOptions.length ===
																		0 ? (
																			<SelectItem
																				value="none"
																				disabled
																			>
																				No
																				options
																				available
																			</SelectItem>
																		) : (
																			replacementOptions.map(
																				(
																					option,
																				) => (
																					<SelectItem
																						key={
																							option
																						}
																						value={
																							option
																						}
																						className="text-gray-700 text-sm"
																					>
																						{
																							option
																						}
																					</SelectItem>
																				),
																			)
																		)}
																	</SelectContent>
																</Select>
															</div>
														</TableCell>
													</TableRow>
												);
											})}
										</TableBody>
									</Table>
								</div>
							</div>
						)}
				</div>

				{/* Footer with Replace and Delete button in BLUE */}
				<DialogFooter className="flex flex-row items-center justify-between border-t px-6 py-3 sm:justify-between">
					<Button
						variant="ghost"
						onClick={handleClose}
						className="text-gray-700 hover:bg-gray-100 hover:text-gray-900"
						data-testid={`delete-${type.toLocaleLowerCase()}-modal-cancel`}
					>
						Cancel
					</Button>
					<div className="flex gap-2">
						{showReplaceOptions && onReplace && (
							<Button
								onClick={handleReplaceAndDelete}
								disabled={isReplaceAndDeleteDisabled()}
								className="bg-blue-600 text-white hover:bg-blue-700"
								data-testid={`delete-${type.toLocaleLowerCase()}-modal-replace-and-delete`}
								title={`This will replace the selected instances and delete the ${type.toLocaleLowerCase()}`}
							>
								Replace and Delete
							</Button>
						)}
						<Button
							variant="destructive"
							onClick={handleDeleteAnyway}
							className="bg-red-600 text-white hover:bg-red-700"
							data-testid={`delete-${type.toLocaleLowerCase()}-modal-delete-anyway`}
						>
							Delete Anyway
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
