import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Field,
	FieldLabel,
	Input,
	P,
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
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	Textarea,
} from "@semoss/ui/next";
import { formatOptions } from "./formatOptions.constants";

interface ColumnEditModalProps {
	open: boolean;
	onClose: () => void;
	selectedColumn: string | null;
	columnMetadata: {
		[column: string]: {
			alias?: string;
			dataType?: string;
			format?: string;
			description?: string;
			logicalName?: string[];
		};
	};
	setColumnMetadata: React.Dispatch<
		React.SetStateAction<{
			[column: string]: {
				alias?: string;
				dataType?: string;
				format?: string;
				description?: string;
				logicalName?: string[];
			};
		}>
	>;
}

const ColumnEditModal = ({
	open,
	onClose,
	selectedColumn,
	columnMetadata,
	setColumnMetadata,
}: ColumnEditModalProps) => {
	const [tab, setTab] = useState<string>("settings");
	const [editAlias, setEditAlias] = useState("");
	const [selectedDataType, setSelectedDataType] = useState("");
	const [selectedFormat, setSelectedFormat] = useState("");
	const [description, setDescription] = useState("");
	const [logicalName, setLogicalName] = useState("");
	const [logicalNamesList, setLogicalNamesList] = useState<string[]>([]);
	const [availableFormats, setAvailableFormats] = useState<
		{ display: string; value: string }[]
	>([]);

	const dataTypeOptions = [
		{ label: "String", value: "STRING" },
		{ label: "Integer", value: "INT" },
		{ label: "Double", value: "DOUBLE" },
		{ label: "Date", value: "DATE" },
		{ label: "Timestamp", value: "TIMESTAMP" },
	];

	// Generate dynamic IDs based on selectedColumn to avoid conflicts
	const fieldIdPrefix = `column-edit-${selectedColumn || "default"}`;

	useEffect(() => {
		if (selectedColumn && columnMetadata[selectedColumn]) {
			const meta = columnMetadata[selectedColumn];
			setEditAlias(meta.alias || "");
			setSelectedDataType(meta.dataType || "STRING");
			setSelectedFormat(meta.format || "");
			setDescription(meta.description || "");
			setLogicalNamesList(meta.logicalName || []);
		}
	}, [selectedColumn, columnMetadata, open]);

	useEffect(() => {
		if (selectedDataType) {
			const optionsList = formatOptions.find(
				(opt) => opt.value === selectedDataType,
			);
			if (optionsList) {
				setAvailableFormats(optionsList.formats || []);
				const defaultFormat = optionsList.formats?.find(
					(f) => f.isDefault,
				);
				if (!selectedFormat) {
					setSelectedFormat(defaultFormat?.value || "");
				}
			} else {
				setAvailableFormats([]);
				setSelectedFormat("");
			}
		}
	}, [selectedDataType]);

	const handleAddLogicalName = () => {
		if (logicalName.trim()) {
			setLogicalNamesList((prev) => [...prev, logicalName.trim()]);
			setLogicalName("");
		}
	};

	const handleDeleteLogicalName = (index: number) => {
		setLogicalNamesList((prev) => prev.filter((_, i) => i !== index));
	};

	const handleSaveMetadata = () => {
		if (!selectedColumn) return;

		setColumnMetadata((prev) => ({
			...prev,
			[selectedColumn]: {
				...prev[selectedColumn],
				alias: editAlias,
				dataType: selectedDataType,
				format: selectedFormat,
				description,
				logicalName: logicalNamesList,
			},
		}));

		onClose();
	};

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent
				className="flex max-h-[90vh] max-w-2xl flex-col"
				data-testid="column-edit-modal"
			>
				<DialogHeader>
					<DialogTitle data-testid="column-edit-modal-title">
						Edit {selectedColumn}
					</DialogTitle>
				</DialogHeader>

				<Tabs
					value={tab}
					onValueChange={setTab}
					className="mb-2 flex flex-1 flex-col"
					data-testid="column-edit-tabs"
				>
					<TabsList className="self-start">
						<TabsTrigger
							value="settings"
							data-testid="tab-settings"
						>
							Settings
						</TabsTrigger>
						<TabsTrigger
							value="description"
							data-testid="tab-description"
						>
							Description
						</TabsTrigger>
						<TabsTrigger
							value="logical-names"
							data-testid="tab-logical-names"
						>
							Logical Names
						</TabsTrigger>
						<TabsTrigger
							value="sample-instances"
							disabled
							data-testid="tab-sample-instances"
						>
							Sample Instances
						</TabsTrigger>
					</TabsList>

					{/* Settings Tab */}
					<TabsContent
						value="settings"
						className="flex-1 overflow-y-auto px-0 pt-6 pb-2"
						data-testid="tab-content-settings"
					>
						<div className="flex flex-col gap-6">
							<Field>
								<FieldLabel htmlFor={`${fieldIdPrefix}-alias`}>
									Edit Alias
								</FieldLabel>
								<Input
									id={`${fieldIdPrefix}-alias`}
									value={editAlias}
									onChange={(e) =>
										setEditAlias(e.target.value)
									}
									autoComplete="off"
									data-testid="input-edit-alias"
								/>
							</Field>

							<Field>
								<FieldLabel
									htmlFor={`${fieldIdPrefix}-datatype`}
								>
									Select a DataType
								</FieldLabel>
								<Select
									value={selectedDataType}
									onValueChange={setSelectedDataType}
								>
									<SelectTrigger
										id={`${fieldIdPrefix}-datatype`}
										className="w-full"
										data-testid="select-datatype-trigger"
									>
										<SelectValue placeholder="Select a DataType" />
									</SelectTrigger>
									<SelectContent data-testid="select-datatype-content">
										{dataTypeOptions.map((option) => (
											<SelectItem
												key={option.value}
												value={option.value}
												data-testid={`select-datatype-option-${option.value}`}
											>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</Field>

							{selectedDataType !== "STRING" &&
								availableFormats.length > 0 && (
									<Field>
										<FieldLabel
											htmlFor={`${fieldIdPrefix}-format`}
										>
											Select a Format
										</FieldLabel>
										<Select
											value={selectedFormat}
											onValueChange={setSelectedFormat}
										>
											<SelectTrigger
												id={`${fieldIdPrefix}-format`}
												className="w-full"
												data-testid="select-format-trigger"
											>
												<SelectValue placeholder="Select a Format" />
											</SelectTrigger>
											<SelectContent data-testid="select-format-content">
												{availableFormats.map((fmt) => (
													<SelectItem
														key={fmt.value}
														value={fmt.value}
														data-testid={`select-format-option-${fmt.value}`}
													>
														{fmt.display}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</Field>
								)}
						</div>
					</TabsContent>

					{/* Description Tab */}
					<TabsContent
						value="description"
						className="flex-1 overflow-y-auto px-0 pt-6 pb-2"
						data-testid="tab-content-description"
					>
						<Field>
							<FieldLabel
								htmlFor={`${fieldIdPrefix}-description`}
							>
								Edit Description
							</FieldLabel>
							<Textarea
								id={`${fieldIdPrefix}-description`}
								rows={4}
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								data-testid="textarea-edit-description"
							/>
						</Field>
					</TabsContent>

					{/* Logical Names Tab */}
					<TabsContent
						value="logical-names"
						className="flex-1 overflow-y-auto px-0 pt-6 pb-2"
						data-testid="tab-content-logical-names"
					>
						<div className="flex flex-col gap-4">
							<div>
								<P className="mb-1 font-semibold text-muted-foreground text-sm">
									Current Logical Name(s):
								</P>
								<div className="mb-4 overflow-hidden rounded-md border border-border">
									<Table data-testid="logical-names-table">
										<TableHeader>
											<TableRow>
												<TableHead className="w-[95%] bg-secondary">
													Name
												</TableHead>
												<TableHead className="w-[5%] bg-secondary" />
											</TableRow>
										</TableHeader>
										<TableBody>
											{logicalNamesList.length > 0 ? (
												logicalNamesList.map(
													(name, index) => (
														<TableRow
															key={`${name}-${
																// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
																index
															}`}
															data-testid={`logical-name-row-${index}`}
														>
															<TableCell
																className="border-b p-2"
																data-testid={`logical-name-cell-${index}`}
															>
																{name}
															</TableCell>
															<TableCell className="border-b p-2">
																<Button
																	variant="ghost"
																	size="icon"
																	onClick={() =>
																		handleDeleteLogicalName(
																			index,
																		)
																	}
																	data-testid={`logical-name-delete-${index}`}
																>
																	<Trash2 className="size-4 text-destructive" />
																</Button>
															</TableCell>
														</TableRow>
													),
												)
											) : (
												<TableRow>
													<TableCell
														colSpan={2}
														className="p-4 text-center text-muted-foreground text-sm"
														data-testid="logical-names-empty-state"
													>
														No logical names added
														yet
													</TableCell>
												</TableRow>
											)}
										</TableBody>
									</Table>
								</div>
							</div>

							<div>
								<P className="mb-2 font-semibold text-muted-foreground text-sm">
									Enter New Logical Name:
								</P>
								<div className="flex flex-row items-center gap-2">
									<Input
										id={`${fieldIdPrefix}-logical-name-input`}
										value={logicalName}
										onChange={(e) =>
											setLogicalName(e.target.value)
										}
										onKeyDown={(e) => {
											if (
												e.key === "Enter" &&
												logicalName.trim()
											) {
												e.preventDefault();
												handleAddLogicalName();
											}
										}}
										placeholder="Enter logical name"
										className="flex-1"
										data-testid="input-new-logical-name"
									/>
									<Button
										variant="ghost"
										size="icon"
										onClick={handleAddLogicalName}
										disabled={!logicalName.trim()}
										data-testid="button-add-logical-name"
									>
										<Plus className="size-4" />
									</Button>
								</div>
							</div>
						</div>
					</TabsContent>

					{/* Sample Instances Tab (Disabled) */}
					<TabsContent
						value="sample-instances"
						className="flex-1 overflow-y-auto px-0 pt-6 pb-2"
						data-testid="tab-content-sample-instances"
					>
						<Field>
							<FieldLabel htmlFor={`${fieldIdPrefix}-search`}>
								Search
							</FieldLabel>
							<Input
								id={`${fieldIdPrefix}-search`}
								placeholder="Search..."
								data-testid="input-search"
							/>
						</Field>
					</TabsContent>
				</Tabs>

				<DialogFooter className="flex justify-end gap-2 pt-2">
					<Button
						variant="outline"
						onClick={onClose}
						data-testid="button-cancel"
					>
						Cancel
					</Button>
					<Button
						variant="default"
						onClick={handleSaveMetadata}
						data-testid="button-save"
					>
						Save
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default ColumnEditModal;
