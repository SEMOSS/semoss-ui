import { X } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
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
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	Textarea,
} from "@semoss/ui/next";
import type { ColumnOption } from "../import/database/MetamodelTypes";

interface NodeShape {
	id: string;
	data: {
		name: string;
		description?: string;
		properties?: {
			id: string;
			name: string;
			type?: string;
			isSelected?: boolean;
		}[];
	};
}

interface Option {
	id?: string;
	name: string;
	label: string;
}

interface EditTableProps {
	open: boolean;
	onClose: () => void;
	node?: NodeShape | null;
	columnOptions?: ColumnOption[];
	initialAlias?: string;
	onSave: (payload: {
		nodeId: string;
		names: string[];
		description?: string;
		alias?: string;
	}) => void;
}

const EditTable: React.FC<EditTableProps> = ({
	open,
	onClose,
	node = null,
	columnOptions = [],
	onSave,
}) => {
	const [selectedNames, setSelectedNames] = useState<Option[]>([]);
	const [tabIndex, setTabIndex] = useState<string>("columns");
	const [inputValue, setInputValue] = useState<string>("");

	const nodeId = node?.id ?? null;
	const nodeName = node?.data?.name ?? "";
	const nodeDescription = node?.data?.description ?? "";

	const [descriptionVal, setDescriptionVal] = useState<string>(
		nodeDescription ?? "",
	);
	const [aliasVal, setAliasVal] = useState<string>(nodeName ?? "");

	useEffect(() => {
		if (!open) return;

		const props = (node?.data?.properties || []).map((p) => ({
			...p,
			isSelected: true,
		}));
		setAliasVal(node?.data?.name ?? "");
		setDescriptionVal(node?.data?.description ?? "");

		if (node && node.data) {
			node.data = {
				...node.data,
				properties: props,
			};
		}

		const available = columnOptions ?? [];

		const availableKeys = new Set(
			available.map((c) => c.id ?? c.name).filter(Boolean),
		);
		const existing: Option[] = props
			.filter((p) => {
				if (!p?.isSelected) return false;
				const key = p.id ?? p.name;
				return availableKeys.has(key);
			})
			.map((p) => {
				const match = available.find(
					(c) => c.id === p.id || c.name === p.name,
				);
				return {
					id: p.id,
					name: match?.name ?? p.name,
					label: match?.name ?? p.name,
				};
			});
		setSelectedNames(existing);
	}, [open, node, columnOptions]);

	useEffect(() => {
		if (open) setTabIndex("columns");
	}, [open]);

	const handleSave = () => {
		if (!nodeId) return;

		const cleaned = Array.from(
			new Set(
				(selectedNames || [])
					.map((s) =>
						typeof s === "string" ? s : s.name || s.label || "",
					)
					.map((v) => v.trim())
					.filter((v) => v.length > 0),
			),
		);

		onSave({
			nodeId,
			names: cleaned,
			description: descriptionVal?.trim() || undefined,
			alias: aliasVal?.trim() || undefined,
		});

		onClose();
	};

	const safeOptions: Option[] = useMemo(() => {
		return (columnOptions ?? []).map((opt) => ({
			id: opt.id,
			label: opt.name,
			name: opt.name,
		}));
	}, [columnOptions]);

	const handleAddColumn = (value: string) => {
		const trimmed = value.trim();
		if (!trimmed) return;

		const exists = selectedNames.some(
			(item) => item.name === trimmed || item.label === trimmed,
		);

		if (!exists) {
			const matchingOption = safeOptions.find(
				(opt) => opt.name === trimmed || opt.label === trimmed,
			);

			if (matchingOption) {
				setSelectedNames([...selectedNames, matchingOption]);
			} else {
				setSelectedNames([
					...selectedNames,
					{ id: undefined, name: trimmed, label: trimmed },
				]);
			}
		}

		setInputValue("");
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && inputValue.trim()) {
			e.preventDefault();
			handleAddColumn(inputValue);
		}
	};

	const handleRemoveColumn = (optionToRemove: Option) => {
		setSelectedNames(
			selectedNames.filter(
				(item) =>
					item.id !== optionToRemove.id &&
					item.name !== optionToRemove.name,
			),
		);
	};

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogContent className="max-w-[600px] overflow-y-auto">
				<DialogHeader className="relative">
					<DialogTitle>Edit {nodeName || "Table"}</DialogTitle>
				</DialogHeader>

				<Tabs
					value={tabIndex}
					onValueChange={setTabIndex}
					className="w-full"
				>
					<TabsList className="grid w-full grid-cols-2 bg-muted p-1">
						<TabsTrigger
							value="columns"
							className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
						>
							Edit Columns
						</TabsTrigger>
						<TabsTrigger
							value="settings"
							className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
						>
							Settings
						</TabsTrigger>
					</TabsList>

					<TabsContent value="columns" className="mt-4 space-y-4">
						<Field>
							<FieldLabel className="block font-medium text-sm">
								Table
							</FieldLabel>
							<Input
								value={nodeName}
								disabled
								className="w-full"
							/>
						</Field>

						<Field>
							<FieldLabel className="block font-medium text-sm">
								Add or Remove Columns
							</FieldLabel>

							{selectedNames.length > 0 && (
								<div className="mb-2 flex flex-wrap gap-2 rounded-md border border-border bg-muted/30 p-2">
									{selectedNames.map((item) => (
										<div
											key={item.id ?? item.name}
											className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-sm"
										>
											<span className="text-secondary-foreground">
												{item.label}
											</span>
											<button
												type="button"
												onClick={() =>
													handleRemoveColumn(item)
												}
												className="ml-1 rounded-full text-secondary-foreground/60 transition-colors hover:text-secondary-foreground"
											>
												<X className="size-3" />
											</button>
										</div>
									))}
								</div>
							)}

							<Input
								value={inputValue}
								onChange={(e) => setInputValue(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder="Type column name and press Enter"
								className="w-full"
							/>

							{inputValue && (
								<div className="mt-2 max-h-[200px] overflow-y-auto rounded-md border border-border bg-card shadow-sm">
									{safeOptions
										.filter((opt) =>
											opt.name
												.toLowerCase()
												.includes(
													inputValue.toLowerCase(),
												),
										)
										.filter(
											(opt) =>
												!selectedNames.some(
													(s) =>
														s.id === opt.id ||
														s.name === opt.name,
												),
										)
										.map((option) => (
											<button
												key={option.id ?? option.name}
												type="button"
												onClick={() => {
													setSelectedNames([
														...selectedNames,
														option,
													]);
													setInputValue("");
												}}
												className="flex w-full items-center px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
											>
												{option.label}
											</button>
										))}
								</div>
							)}
						</Field>
					</TabsContent>

					<TabsContent value="settings" className="mt-4 space-y-4">
						<Field>
							<FieldLabel className="block font-medium text-sm">
								Table Alias
							</FieldLabel>
							<Input
								value={aliasVal}
								onChange={(e) => setAliasVal(e.target.value)}
								placeholder="Alias or display name for the table"
								className="w-full"
							/>
						</Field>

						<Field>
							<FieldLabel className="block font-medium text-sm">
								Description
							</FieldLabel>
							<Textarea
								value={descriptionVal}
								onChange={(e) =>
									setDescriptionVal(e.target.value)
								}
								rows={3}
								className="min-h-[80px] w-full resize-y"
							/>
						</Field>
					</TabsContent>
				</Tabs>

				<DialogFooter className="gap-2">
					<Button
						variant="outline"
						onClick={onClose}
						data-testid="edit-table-cancel"
					>
						Cancel
					</Button>
					<Button
						variant="default"
						onClick={handleSave}
						data-testid="edit-table-save"
					>
						Save
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default EditTable;
