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
} from "@semoss/ui/next";

interface CellReplacement {
	label: string;
	options: string[];
}

interface DependentBlocksModalProps {
	open: boolean;
	onClose: () => void;
	onDelete: () => void;
	onReplace: (replacements: { [blockId: string]: string }) => void;
	dependents: string[];
	replacementOptions?: CellReplacement[];
}

export const DependentBlocksModal = (props: DependentBlocksModalProps) => {
	const {
		open,
		onClose,
		onDelete,
		onReplace,
		dependents,
		replacementOptions = [],
	} = props;
	const { state } = useBlocks();
	const [replaceOption, setReplaceOption] = useState("replaceAll");
	const [selectedReplacement, setSelectedReplacement] = useState("");
	const [isUsageExpanded, setIsUsageExpanded] = useState(true);
	const [expandedCategories, setExpandedCategories] = useState<{
		[key: string]: boolean;
	}>({});
	const [individualReplacements, setIndividualReplacements] = useState<{
		[blockId: string]: string;
	}>({});

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

	const handleReplaceAll = () => {
		if (selectedReplacement) {
			const replacements: { [blockId: string]: string } = {};
			dependentBlocks.forEach((block) => {
				replacements[block.blockId] = selectedReplacement;
			});
			onReplace(replacements);
			onClose();
		}
	};

	const handleReplaceIndividual = () => {
		onReplace(individualReplacements);
		onClose();
	};

	const handleDeleteAnyway = () => {
		onDelete();
		onClose();
	};

	const toggleCategory = (label: string) => {
		setExpandedCategories((prev) => ({
			...prev,
			[label]: !prev[label],
		}));
	};

	const updateIndividualReplacement = (blockId: string, value: string) => {
		setIndividualReplacements((prev) => ({
			...prev,
			[blockId]: value,
		}));
	};

	const isReplaceIndividualDisabled = () => {
		return dependentBlocks.some(
			(block) => !individualReplacements[block.blockId],
		);
	};

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent
				className="gap-0 p-0 sm:max-w-3xl"
				data-testid="delete-cell-modal"
			>
				{/* Header */}
				<DialogHeader className="space-y-0 border-b px-6 py-4">
					<div className="flex items-center justify-between">
						<DialogTitle className="font-semibold text-base">
							Delete Cell?
						</DialogTitle>
					</div>
				</DialogHeader>

				{/* Content */}
				<div className="px-6 py-4">
					{/* Warning Alert */}
					<div className="mb-4 flex items-start gap-2 rounded border border-orange-300 bg-orange-50 p-3">
						<AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-600" />
						<p className="text-gray-800 text-sm leading-relaxed">
							This cell is linked to multiple components in your
							app. Deleting it may cause errors or broken
							connections.
						</p>
					</div>

					{/* Cell Usage Collapsible Section */}
					<Collapsible
						open={isUsageExpanded}
						onOpenChange={setIsUsageExpanded}
						className="mb-4"
					>
						<CollapsibleTrigger className="flex w-full items-center justify-between py-2 hover:no-underline">
							<p className="font-normal text-gray-700 text-sm">
								This cell is used in :
							</p>
							{isUsageExpanded ? (
								<ChevronUp className="h-4 w-4 text-gray-500" />
							) : (
								<ChevronDown className="h-4 w-4 text-gray-500" />
							)}
						</CollapsibleTrigger>
						<CollapsibleContent>
							<div
								className="mt-2 flex flex-wrap gap-2"
								data-testid="delete-cell-modal-usage-list"
							>
								{dependents.map((usage) => (
									<Badge
										key={usage}
										variant="outline"
										className="border-gray-300 bg-white font-normal text-gray-700 text-xs hover:bg-white"
										data-testid={`delete-cell-modal-usage-${usage}`}
									>
										{usage}
									</Badge>
								))}
							</div>
						</CollapsibleContent>
					</Collapsible>

					{/* Replace Options Section */}
					<div className="mb-4">
						<p className="mb-3 font-normal text-gray-700 text-sm">
							You can replace the links below before continuing.
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
									data-testid="delete-cell-modal-replace-all"
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
									data-testid="delete-cell-modal-replace-individual"
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

					{/* Replace All - "Replace With" dropdown is full width */}
					{replaceOption === "replaceAll" && (
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
										data-testid="delete-cell-modal-replacement-select"
									>
										<SelectValue placeholder="Select" />
									</SelectTrigger>
									{/* Ensure the content panel also fills min width */}
									<SelectContent className="max-h-[300px] w-full min-w-full">
										{replacementOptions.length === 0 ? (
											<SelectItem value="none" disabled>
												No options available
											</SelectItem>
										) : (
											replacementOptions.map(
												(category) => (
													<div key={category.label}>
														<Collapsible
															open={
																!!expandedCategories[
																	category
																		.label
																]
															}
															onOpenChange={() =>
																toggleCategory(
																	category.label,
																)
															}
														>
															<CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between px-2 py-1.5 text-sm hover:bg-gray-100">
																<span className="font-medium text-gray-900">
																	{
																		category.label
																	}
																</span>
																{expandedCategories[
																	category
																		.label
																] ? (
																	<ChevronDown className="h-4 w-4 text-gray-500" />
																) : (
																	<ChevronDown className="-rotate-90 h-4 w-4 text-gray-500" />
																)}
															</CollapsibleTrigger>
															<CollapsibleContent className="pl-4">
																{category.options.map(
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
																)}
															</CollapsibleContent>
														</Collapsible>
													</div>
												),
											)
										)}
									</SelectContent>
								</Select>
							</div>
							<div className="flex justify-end">
								<Button
									onClick={handleReplaceAll}
									disabled={!selectedReplacement}
									className="bg-blue-600 text-white hover:bg-blue-700"
									data-testid="delete-cell-modal-replace-all-button"
								>
									Replace
								</Button>
							</div>
						</div>
					)}

					{/* Replace Individual - Table w/ Replace With column using flex for full width, non-shrinking */}
					{replaceOption === "replaceIndividual" && (
						<div className="mt-4 space-y-3">
							<div className="overflow-hidden rounded-md border border-gray-200">
								<table className="w-full table-fixed">
									<colgroup>
										<col style={{ width: "30%" }} />
										<col style={{ width: "30%" }} />
										<col style={{ width: "40%" }} />
									</colgroup>
									<thead className="border-gray-200 border-b bg-gray-50">
										<tr>
											<th className="px-4 py-3 text-left font-medium text-gray-700 text-sm">
												Block Type
											</th>
											<th className="px-4 py-3 text-left font-medium text-gray-700 text-sm">
												Block ID
											</th>
											<th className="px-4 py-3 text-left font-medium text-gray-700 text-sm">
												Replace With
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-200 bg-white">
										{dependentBlocks.map((block) => {
											const selectId = `${radioGroupId}-select-${block.blockId}`;
											return (
												<tr key={block.blockId}>
													<td className="px-4 py-3 text-gray-900 text-sm">
														{block.blockType}
													</td>
													<td className="px-4 py-3 text-gray-900 text-sm">
														{block.blockId}
													</td>
													<td className="px-4 py-3">
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
																	data-testid={`delete-cell-modal-replacement-${block.blockId}`}
																>
																	<SelectValue placeholder="Select" />
																</SelectTrigger>
																<SelectContent className="max-h-[300px] w-full min-w-full">
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
																				category,
																			) => (
																				<div
																					key={
																						category.label
																					}
																				>
																					<Collapsible
																						open={
																							!!expandedCategories[
																								`${category.label}-${block.blockId}`
																							]
																						}
																						onOpenChange={() =>
																							toggleCategory(
																								`${category.label}-${block.blockId}`,
																							)
																						}
																					>
																						<CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between px-2 py-1.5 text-sm hover:bg-gray-100">
																							<span className="font-medium text-gray-900">
																								{
																									category.label
																								}
																							</span>
																							{expandedCategories[
																								`${category.label}-${block.blockId}`
																							] ? (
																								<ChevronDown className="h-4 w-4 text-gray-500" />
																							) : (
																								<ChevronDown className="-rotate-90 h-4 w-4 text-gray-500" />
																							)}
																						</CollapsibleTrigger>
																						<CollapsibleContent className="pl-4">
																							{category.options.map(
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
																							)}
																						</CollapsibleContent>
																					</Collapsible>
																				</div>
																			),
																		)
																	)}
																</SelectContent>
															</Select>
														</div>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
							<div className="flex justify-end">
								<Button
									onClick={handleReplaceIndividual}
									disabled={isReplaceIndividualDisabled()}
									className="bg-blue-600 text-white hover:bg-blue-700"
									data-testid="delete-cell-modal-replace-individual-button"
								>
									Replace
								</Button>
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				<DialogFooter className="flex flex-row items-center justify-between border-t px-6 py-3 sm:justify-between">
					<Button
						variant="ghost"
						onClick={onClose}
						className="text-gray-700 hover:bg-gray-100 hover:text-gray-900"
						data-testid="delete-cell-modal-cancel"
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={handleDeleteAnyway}
						className="bg-red-600 text-white hover:bg-red-700"
						data-testid="delete-cell-modal-delete-anyway"
					>
						Delete Anyway
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
