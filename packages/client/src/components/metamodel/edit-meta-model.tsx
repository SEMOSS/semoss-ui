import { Plus, Trash2, X } from "lucide-react";
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

interface EditMetamodelProps {
	open: boolean;
	onClose: () => void;
	initialName?: string;
	initialType?: string;
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
}

export const Editmetamodel: React.FC<EditMetamodelProps> = ({
	open,
	onClose,
	initialName = "",
	initialType = "",
	initialDescription = "",
	initialLogicalNames = [],
	existingColumnNames = [],
	onSave,
	types,
	isEdit = true,
}) => {
	const typesList = useMemo(
		() =>
			types ?? [
				"int",
				"string",
				"float",
				"double",
				"varchar",
				"boolean",
				"date",
			],
		[types],
	);

	type LogicalNameItem = { id: string; name: string };

	const [singleNameVal, setSingleNameVal] = useState<string>(
		initialName ?? "",
	);
	const [typeVal, setTypeVal] = useState<string | null>(
		initialType ?? typesList[0],
	);
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
			setTypeVal(initialType ?? typesList[0]);
			setSingleNameVal(initialName ?? "");

			const initialItems = (initialLogicalNames || [])
				.filter((name) => name && name.trim())
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
					data-testid="edit-metamodel-column-name"
				/>
				{columnNameError && (
					<P className="mt-1 text-destructive text-xs">
						{columnNameError}
					</P>
				)}
			</Field>

			<Field>
				<FieldLabel className="mb-1.5 text-sm">Column Type</FieldLabel>
				<Select
					value={typeVal || typesList[0]}
					onValueChange={(value) => setTypeVal(value)}
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
		</div>
	);

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogContent
				className="max-w-[600px] p-0"
				data-testid="edit-metamodel-modal"
			>
				{/* Header */}
				<DialogHeader className="relative px-6 py-4">
					<DialogTitle className="pr-8 font-semibold text-lg">
						{isEdit ? `Edit ${initialName}` : "Add column"}
					</DialogTitle>
					<Button
						variant="ghost"
						size="icon"
						onClick={onClose}
						className="absolute top-3.5 right-4 size-8"
						data-testid="edit-metamodel-close-btn"
					>
						<X className="size-4" />
					</Button>
				</DialogHeader>

				{/* Content */}
				{isEdit ? (
					<Tabs
						value={activeTab}
						onValueChange={setActiveTab}
						className="w-full"
					>
						<TabsList className="h-auto w-full justify-start rounded-none border-border border-b bg-transparent p-0 px-6">
							<TabsTrigger
								value="edit"
								className="relative rounded-none border-transparent border-b-2 bg-transparent px-4 py-3 font-medium text-muted-foreground text-sm shadow-none transition-colors hover:text-foreground data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
								data-testid="edit-metamodel-tab-edit"
							>
								Edit
							</TabsTrigger>
							<TabsTrigger
								value="description"
								className="relative rounded-none border-transparent border-b-2 bg-transparent px-4 py-3 font-medium text-muted-foreground text-sm shadow-none transition-colors hover:text-foreground data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
								data-testid="edit-metamodel-tab-description"
							>
								Description
							</TabsTrigger>
							<TabsTrigger
								value="logical-names"
								className="relative rounded-none border-transparent border-b-2 bg-transparent px-4 py-3 font-medium text-muted-foreground text-sm shadow-none transition-colors hover:text-foreground data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
								data-testid="edit-metamodel-tab-logical-names"
							>
								Logical Names
							</TabsTrigger>
							<TabsTrigger
								value="sample-instances"
								disabled
								className="relative rounded-none border-transparent border-b-2 bg-transparent px-4 py-3 font-medium text-muted-foreground/50 text-sm shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
								data-testid="edit-metamodel-tab-sample-instances"
							>
								Sample Instances
							</TabsTrigger>
						</TabsList>

						<div className="px-6 py-5">
							<TabsContent value="edit" className="m-0">
								{EditForm}
							</TabsContent>

							<TabsContent value="description" className="m-0">
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
										data-testid="edit-metamodel-description"
									/>
								</Field>
							</TabsContent>

							<TabsContent
								value="logical-names"
								className="m-0 space-y-3"
							>
								<div className="max-h-[200px] overflow-auto rounded-md border border-border">
									<Table>
										<TableHeader className="sticky top-0 bg-muted/50">
											<TableRow>
												<TableHead className="h-10 font-medium">
													Name
												</TableHead>
												<TableHead className="h-10 w-16 text-center font-medium">
													Action
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{logicalNames.length === 0 ? (
												<TableRow>
													<TableCell
														colSpan={2}
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
														<TableCell className="border-border border-l py-1 text-center">
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
													</TableRow>
												))
											)}
										</TableBody>
									</Table>
								</div>

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
							</TabsContent>

							<TabsContent
								value="sample-instances"
								className="m-0"
							>
								<div className="flex h-24 items-center justify-center rounded-md border border-border border-dashed">
									<P className="text-muted-foreground text-sm">
										Sample instances coming soon
									</P>
								</div>
							</TabsContent>
						</div>
					</Tabs>
				) : (
					<div className="px-6 py-5">{EditForm}</div>
				)}

				{/* Footer */}
				<DialogFooter className="border-border border-t px-6 py-3">
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
						disabled={!singleNameVal.trim() || !!columnNameError}
						data-testid="engineMetadata-save-btn"
					>
						Save
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
