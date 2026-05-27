import { Plus, Trash2 } from "lucide-react";
import type React from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
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

export type LogicalDataType =
	| "BOOLEAN"
	| "INT"
	| "DOUBLE"
	| "STRING"
	| "DATE"
	| "TIMESTAMP";

export const LOGICAL_DATA_TYPES: LogicalDataType[] = [
	"BOOLEAN",
	"INT",
	"DOUBLE",
	"STRING",
	"DATE",
	"TIMESTAMP",
];

interface ImportEditMetamodelProps {
	open: boolean;
	onClose: () => void;
	initialName?: string;
	initialType?: string;
	initialRawType?: string;
	onSave: (payload: {
		name: string;
		type: string;
		logicalNames?: string[];
		description?: string;
	}) => void;
	types?: string[];
	isEdit?: boolean;
	initialDescription?: string;
	initialLogicalNames?: string[];
	existingColumnNames?: string[];
	readOnly?: boolean;
}

export const ImportEditMetamodel: React.FC<ImportEditMetamodelProps> = ({
	open,
	onClose,
	initialName = "",
	initialType = "",
	initialRawType,
	initialDescription = "",
	initialLogicalNames = [],
	existingColumnNames = [],
	onSave,
	types,
	isEdit = true,
	readOnly = false,
}) => {
	const typesList = useMemo(() => types ?? LOGICAL_DATA_TYPES, [types]);

	type LogicalNameItem = { id: string; name: string };

	const resolveType = (raw: string) =>
		typesList.includes(raw) ? raw : typesList[0];

	const [singleNameVal, setSingleNameVal] = useState<string>(
		initialName ?? "",
	);
	const [typeVal, setTypeVal] = useState<string>(resolveType(initialType));
	const [activeTab, setActiveTab] = useState<string>("edit");
	const [logicalNames, setLogicalNames] = useState<LogicalNameItem[]>([]);
	const [newLogicalName, setNewLogicalName] = useState<string>("");
	const [description, setDescription] = useState<string>(initialDescription);
	const [logicalNameError, setLogicalNameError] = useState<string>("");
	const [columnNameError, setColumnNameError] = useState<string>("");

	const baseId = useId();
	const idCounterRef = useRef(0);
	const openPrevRef = useRef<boolean>(false);

	useEffect(() => {
		if (open && !openPrevRef.current) {
			setTypeVal(resolveType(initialType));
			setSingleNameVal(initialName ?? "");

			const initialItems = (initialLogicalNames || [])
				.filter((name) => name?.trim())
				.map((name) => {
					idCounterRef.current += 1;
					return {
						id: `${baseId}-${idCounterRef.current}`,
						name: name.trim(),
					};
				});
			setLogicalNames(initialItems);
			setDescription(initialDescription || "");
			setNewLogicalName("");
			setActiveTab("edit");
			setLogicalNameError("");
			setColumnNameError("");
		}
		openPrevRef.current = open;
	}, [
		open,
		initialType,
		initialName,
		initialLogicalNames,
		initialDescription,
		typesList,
		baseId,
	]);

	const handleAddLogicalName = () => {
		const trimmed = (newLogicalName || "").trim();
		if (!trimmed) return;

		if (
			logicalNames.some(
				(item) => item.name.toLowerCase() === trimmed.toLowerCase(),
			)
		) {
			setLogicalNameError("Logical name already exists");
			return;
		}

		const id =
			crypto && typeof crypto.randomUUID === "function"
				? crypto.randomUUID()
				: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

		setLogicalNames((prev) => [...prev, { id, name: trimmed }]);
		setNewLogicalName("");
		setLogicalNameError("");
	};

	const handleRemoveLogicalName = (id: string) => {
		setLogicalNames((prev) => prev.filter((it) => it.id !== id));
		setLogicalNameError("");
	};

	const handleColumnNameChange = (value: string) => {
		setSingleNameVal(value);

		const trimmedValue = value.trim();
		if (!trimmedValue) {
			setColumnNameError("");
			return;
		}

		const isDuplicate = existingColumnNames.some(
			(existingName) => existingName === trimmedValue.toLowerCase(),
		);

		if (isDuplicate) {
			setColumnNameError("The same name already exists");
		} else {
			setColumnNameError("");
		}
	};

	const handleSave = () => {
		const type = (typeVal ?? "").trim() || typesList[0];
		const name = (singleNameVal ?? "").trim();

		if (!name) return;

		const isDuplicate = existingColumnNames.some(
			(existingName) => existingName === name.toLowerCase(),
		);

		if (isDuplicate) {
			setColumnNameError("The same name already exists");
			return;
		}

		const namesOnly: string[] = logicalNames.map((item) =>
			typeof item === "string" ? item : item.name,
		);

		onSave({
			name,
			type,
			logicalNames: namesOnly,
			description: description?.trim() || undefined,
		});

		onClose();
	};

	const EditForm = (
		<div className="space-y-4">
			<Field>
				<FieldLabel className="mb-1.5 text-sm">Column name</FieldLabel>
				<Input
					placeholder="Enter column name"
					value={singleNameVal}
					onChange={(e) => handleColumnNameChange(e.target.value)}
					className="w-full"
					disabled={readOnly}
					data-testid="edit-metamodel-column-name"
				/>
				{columnNameError && (
					<P className="mt-1 text-destructive text-xs">
						{columnNameError}
					</P>
				)}
			</Field>

			<Field>
				<FieldLabel className="mb-1.5 text-sm">
					Logical Data Type
				</FieldLabel>
				<Select
					value={typeVal || typesList[0]}
					onValueChange={(value) => setTypeVal(value)}
					disabled={readOnly}
				>
					<SelectTrigger
						className="w-full"
						data-testid="edit-metamodel-column-type"
					>
						<SelectValue placeholder="Select type" />
					</SelectTrigger>
					<SelectContent>
						{typesList.map((type) => (
							<SelectItem key={type} value={type}>
								{type}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</Field>

			{initialRawType && (
				<Field>
					<FieldLabel className="mb-1.5 text-sm">
						Physical Data Type
					</FieldLabel>
					<Input
						value={initialRawType}
						readOnly
						disabled
						className="w-full cursor-default"
						data-testid="edit-metamodel-raw-type"
					/>
				</Field>
			)}
		</div>
	);

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogContent
				className="max-w-[600px]"
				data-testid="edit-metamodel-modal"
			>
				<DialogHeader>
					<DialogTitle className="font-semibold text-lg">
						{isEdit
							? readOnly
								? `View ${initialName}`
								: `Edit ${initialName}`
							: "Add column"}
					</DialogTitle>
				</DialogHeader>

				{isEdit ? (
					<Tabs
						value={activeTab}
						onValueChange={setActiveTab}
						className="w-full"
					>
						<TabsList className="grid w-full grid-cols-3">
							<TabsTrigger
								value="edit"
								data-testid="edit-metamodel-tab-edit"
							>
								Edit
							</TabsTrigger>
							<TabsTrigger
								value="description"
								data-testid="edit-metamodel-tab-description"
							>
								Description
							</TabsTrigger>
							<TabsTrigger
								value="logical-names"
								data-testid="edit-metamodel-tab-logical-names"
							>
								Logical Names
							</TabsTrigger>
						</TabsList>

						<TabsContent value="edit" className="mt-4">
							{EditForm}
						</TabsContent>

						<TabsContent value="description" className="mt-4">
							<Field>
								<FieldLabel className="mb-1.5 text-sm">
									Description
								</FieldLabel>
								<Textarea
									value={description}
									onChange={(e) =>
										setDescription(e.target.value)
									}
									placeholder="Enter description"
									rows={4}
									className="min-h-[100px] w-full resize-y"
									disabled={readOnly}
									data-testid="edit-metamodel-description"
								/>
							</Field>
						</TabsContent>

						<TabsContent
							value="logical-names"
							className="mt-4 space-y-3"
						>
							<div className="max-h-[200px] overflow-auto rounded-md border border-border">
								<Table>
									<TableHeader className="sticky top-0 bg-muted/50">
										<TableRow>
											<TableHead className="h-10 font-medium">
												Name
											</TableHead>
											{!readOnly && (
												<TableHead className="h-10 w-16 text-center font-medium">
													Action
												</TableHead>
											)}
										</TableRow>
									</TableHeader>
									<TableBody>
										{logicalNames.length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={readOnly ? 1 : 2}
													className="h-20 text-center text-muted-foreground text-sm"
												>
													No logical names added
												</TableCell>
											</TableRow>
										) : (
											logicalNames.map((item) => (
												<TableRow
													key={item.id}
													data-testid={`engineMetadata-logicalname-${item.id}-row`}
												>
													<TableCell className="py-2">
														{item.name}
													</TableCell>
													{!readOnly && (
														<TableCell className="border-border border-s py-1 text-center">
															<Button
																variant="ghost"
																size="icon"
																className="size-8"
																onClick={() =>
																	handleRemoveLogicalName(
																		item.id,
																	)
																}
																data-testid={`engineMetadata-logicalname-${item.id}-remove`}
															>
																<Trash2 className="size-4" />
															</Button>
														</TableCell>
													)}
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							</div>

							{!readOnly && (
								<div className="space-y-1">
									<div className="flex gap-2">
										<Input
											placeholder="Add logical name"
											value={newLogicalName}
											onChange={(e) => {
												setNewLogicalName(
													e.target.value,
												);
												if (logicalNameError)
													setLogicalNameError("");
											}}
											onKeyDown={(e) => {
												if (
													e.key === "Enter" &&
													newLogicalName.trim()
												) {
													handleAddLogicalName();
												}
											}}
											className="flex-1"
											data-testid="edit-metamodel-logical-name-input"
										/>
										<Button
											variant="default"
											size="icon"
											onClick={handleAddLogicalName}
											disabled={!newLogicalName.trim()}
											className="size-9 shrink-0"
											data-testid="engineMetadata-logicalname-add"
										>
											<Plus className="size-4" />
										</Button>
									</div>

									{logicalNameError && (
										<P className="text-destructive text-xs">
											{logicalNameError}
										</P>
									)}
								</div>
							)}
						</TabsContent>
					</Tabs>
				) : (
					EditForm
				)}

				<DialogFooter>
					{readOnly ? (
						<Button
							variant="outline"
							onClick={onClose}
							data-testid="engineMetadata-close-btn"
						>
							Close
						</Button>
					) : (
						<>
							<Button
								variant="outline"
								onClick={onClose}
								data-testid="engineMetadata-cancel-btn"
							>
								Cancel
							</Button>
							<Button
								variant="default"
								onClick={handleSave}
								disabled={
									!singleNameVal.trim() || !!columnNameError
								}
								data-testid="engineMetadata-save-btn"
							>
								Save
							</Button>
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
