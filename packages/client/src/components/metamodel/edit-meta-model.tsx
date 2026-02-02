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
		<div className="flex flex-col gap-4 p-4">
			<Field>
				<FieldLabel className="mb-2 block text-xs">
					Column name
				</FieldLabel>
				<Input
					placeholder="Edit column name"
					value={singleNameVal}
					onChange={(e) => handleColumnNameChange(e.target.value)}
					className="w-full"
				/>
				{columnNameError && (
					<P className="mt-1 block text-destructive text-xs">
						{columnNameError}
					</P>
				)}
			</Field>

			<Field>
				<FieldLabel className="mb-2 block text-xs">
					Column Type
				</FieldLabel>
				<Select
					value={typeVal || typesList[0]}
					onValueChange={(value) => setTypeVal(value)}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Select column type" />
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
			<DialogContent className="max-w-[600px] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="pr-8">
						{isEdit ? `Edit ${initialName}` : "Add column"}
					</DialogTitle>
					<Button
						variant="ghost"
						size="icon"
						onClick={onClose}
						className="absolute top-3.5 right-2 h-8 w-8"
					>
						<X className="size-4" />
					</Button>
				</DialogHeader>

				{isEdit ? (
					<Tabs
						value={activeTab}
						onValueChange={setActiveTab}
						className="w-full"
					>
						<TabsList className="mb-4 ml-0 w-full justify-start border-border border-b bg-transparent p-0">
							<TabsTrigger
								value="edit"
								className="rounded-none border-transparent border-b-2 px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
							>
								Edit
							</TabsTrigger>
							<TabsTrigger
								value="description"
								className="rounded-none border-transparent border-b-2 px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
							>
								Description
							</TabsTrigger>
							<TabsTrigger
								value="logical-names"
								className="rounded-none border-transparent border-b-2 px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
							>
								Logical Names
							</TabsTrigger>
							<TabsTrigger
								value="sample-instances"
								disabled
								className="rounded-none border-transparent border-b-2 px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
							>
								Sample Instances
							</TabsTrigger>
						</TabsList>

						<TabsContent value="edit" className="p-0">
							{EditForm}
						</TabsContent>

						<TabsContent
							value="description"
							className="min-h-[120px] p-4"
						>
							<Field>
								<FieldLabel className="mb-2 block text-xs">
									Description
								</FieldLabel>
								<Textarea
									value={description}
									onChange={(e) =>
										setDescription(e.target.value)
									}
									rows={3}
									className="min-h-[80px] w-full resize-y"
								/>
							</Field>
						</TabsContent>

						<TabsContent value="logical-names" className="p-4">
							<Field>
								<div className="mb-2 max-h-[200px] overflow-auto rounded-md border border-border">
									<Table>
										<TableHeader className="bg-primary/10">
											<TableRow>
												<TableHead className="font-semibold text-primary">
													Name
												</TableHead>
												<TableHead className="w-20 font-semibold text-primary">
													Action
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{logicalNames.length === 0 ? (
												<TableRow>
													<TableCell
														colSpan={2}
														className="text-center text-muted-foreground"
													>
														No logical names added.
													</TableCell>
												</TableRow>
											) : (
												logicalNames.map((item) => (
													<TableRow
														key={item.id}
														data-testid={`engineMetadata-logicalname-${item.id}-btn`}
													>
														<TableCell className="text-muted-foreground">
															{item.name}
														</TableCell>
														<TableCell className="border-border border-l">
															<Button
																variant="ghost"
																size="icon"
																className="h-8 w-8"
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

								<div className="mt-2 flex items-center gap-2">
									<Input
										placeholder="Add logical name"
										value={newLogicalName}
										onChange={(e) => {
											setNewLogicalName(e.target.value);
											if (logicalNameError)
												setLogicalNameError("");
										}}
										className="flex-1"
									/>
									<Button
										variant="default"
										size="icon"
										onClick={handleAddLogicalName}
										disabled={!newLogicalName.trim()}
										data-testid="engineMetadata-logicalname-add"
									>
										<Plus className="size-4" />
									</Button>
								</div>

								{logicalNameError && (
									<P className="mt-1 block text-destructive text-xs">
										{logicalNameError}
									</P>
								)}
							</Field>
						</TabsContent>

						<TabsContent value="sample-instances" className="p-4">
							<P className="text-muted-foreground">
								Sample Instances feature comes here!
							</P>
						</TabsContent>
					</Tabs>
				) : (
					<div className="p-4">{EditForm}</div>
				)}

				<DialogFooter className="gap-2">
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
