import { ArrowRight, Edit, Eye, Trash2 } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Field,
	FieldLabel,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";

export type CustomNode = {
	id: string;
	type: string;
	data: {
		name: string;
		properties: {
			id: string;
			name: string;
			type: string;
		}[];
	};
	position: { x: number; y: number };
};

interface Conn {
	id?: string;
	parentTable: string;
	childTable: string;
}

interface ConnectionProps {
	open: boolean;
	onClose: () => void;
	nodes: CustomNode[];
	onCreateConnection: (params: Conn) => void;
	initialConnections?: Conn[];
	onEditConnection?: (updated: Conn) => void;
	onDeleteConnection?: (id: string) => void;
	isRdf?: boolean;
}

export const CreateConnection: React.FC<ConnectionProps> = ({
	open,
	onClose,
	nodes,
	onCreateConnection,
	initialConnections = [],
	onEditConnection,
	onDeleteConnection,
	isRdf = false,
}) => {
	const tableOptions = useMemo(() => nodes.map((n) => n.data.name), [nodes]);

	const [parentTable, setParentTable] = useState("");
	const [childTable, setChildTable] = useState("");
	const [connections, setConnections] = useState<Conn[]>([]);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [error, setError] = useState<string>("");
	const [save, setSave] = useState(true);

	// Snapshot of connections at dialog open — used to diff on Save
	const snapshotRef = useRef<Conn[]>([]);

	const makeId = (c: Conn) =>
		`${c.parentTable}_${c.childTable}`.replace(/\s+/g, "_");

	useEffect(() => {
		if (open) {
			const normalized = initialConnections.map((c) => {
				const copy = { ...c };
				if (!copy.id) copy.id = makeId(copy);
				return copy;
			});
			snapshotRef.current = normalized;
			setConnections(normalized);
			setEditingId(null);
			setParentTable("");
			setChildTable("");
			setError("");
		}
	}, [open, initialConnections]);

	useEffect(() => {
		if (parentTable && !tableOptions.includes(parentTable)) {
			setParentTable("");
		}
		if (childTable && !tableOptions.includes(childTable)) {
			setChildTable("");
		}
	}, [nodes, parentTable, childTable, tableOptions]);

	useEffect(() => {
		setSave(true);
	}, [open]);

	const sanitizeForForm = (c: Conn) => {
		const sanitized: Conn = { ...c };
		const parentNode = nodes.find((n) => n.data.name === c.parentTable);
		if (!parentNode) {
			sanitized.parentTable = "";
		}
		const childNode = nodes.find((n) => n.data.name === c.childTable);
		if (!childNode) {
			sanitized.childTable = "";
		}
		return sanitized;
	};

	const isFormValid = Boolean(
		parentTable?.toString().trim() && childTable?.toString().trim(),
	);

	const handleStartEdit = (conn: Conn) => {
		const id = conn.id ?? makeId(conn);
		setEditingId(id);

		const sanitized = sanitizeForForm(conn);
		setParentTable(sanitized.parentTable || "");
		setChildTable(sanitized.childTable || "");
		setError("");
	};

	const normalize = (s: string) => s.trim().toLowerCase();

	const connectionExists = (
		pt: string,
		ct: string,
		ignoreId?: string | null,
	) => {
		const npt = normalize(pt);
		const nct = normalize(ct);
		return connections.some((c) => {
			const cid = c.id ?? makeId(c);
			if (ignoreId && cid === ignoreId) return false;
			return (
				normalize(c.parentTable) === npt &&
				normalize(c.childTable) === nct
			);
		});
	};

	const handleAdd = () => {
		setError("");
		if (!isFormValid) return;

		const pt = parentTable.trim();
		const ct = childTable.trim();

		if (editingId) {
			if (connectionExists(pt, ct, editingId)) {
				setError(
					"A connection with the same parent and child already exists.",
				);
				return;
			}
		} else {
			if (connectionExists(pt, ct, null)) {
				setError(
					"A connection with the same parent and child already exists.",
				);
				return;
			}
		}

		const idToUse =
			editingId ?? makeId({ parentTable: pt, childTable: ct });

		const newConn: Conn = {
			id: idToUse,
			parentTable: pt,
			childTable: ct,
		};

		if (editingId) {
			setConnections((prev) =>
				prev.map((p) => (p.id === editingId ? newConn : p)),
			);
			setEditingId(null);
		} else {
			setConnections((prev) => [...prev, newConn]);
		}

		setParentTable("");
		setChildTable("");
		setError("");
		setSave(false);
	};

	const handleDelete = (conn: Conn) => {
		const id = conn.id ?? makeId(conn);
		setConnections((prev) =>
			prev.filter((c) => (c.id ?? makeId(c)) !== id),
		);

		if (editingId === id) {
			setEditingId(null);
			setParentTable("");
			setChildTable("");
		}
		setError("");
		setSave(false);
	};

	const handleSave = () => {
		const snapshot = snapshotRef.current;
		const snapshotIds = new Set(snapshot.map((c) => c.id ?? makeId(c)));
		const currentIds = new Set(connections.map((c) => c.id ?? makeId(c)));

		// Deleted: in snapshot but not in current
		for (const c of snapshot) {
			const id = c.id ?? makeId(c);
			if (!currentIds.has(id)) {
				onDeleteConnection?.(id);
			}
		}

		// Added: in current but not in snapshot
		for (const c of connections) {
			const id = c.id ?? makeId(c);
			if (!snapshotIds.has(id)) {
				onCreateConnection?.(c);
			}
		}

		// Edited: same id but different tables
		for (const c of connections) {
			const id = c.id ?? makeId(c);
			if (snapshotIds.has(id)) {
				const orig = snapshot.find(
					(ic) => (ic.id ?? makeId(ic)) === id,
				);
				if (
					orig &&
					(orig.parentTable !== c.parentTable ||
						orig.childTable !== c.childTable)
				) {
					onEditConnection?.(c);
				}
			}
		}

		onClose();
	};

	useEffect(() => {
		if (error) setError("");
	}, [parentTable, childTable]);

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogContent className="max-w-[600px] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="pr-8">
						Create Connection
					</DialogTitle>
				</DialogHeader>

				<div className="flex flex-col gap-4 pb-2">
					<Field>
						<FieldLabel className="mb-1.5 block text-xs">
							{isRdf ? "Start Node" : "Parent Table"}{" "}
							<span className="text-destructive">*</span>
						</FieldLabel>
						<Select
							value={parentTable || ""}
							onValueChange={(value) => setParentTable(value)}
						>
							<SelectTrigger className="w-full">
								<SelectValue
									placeholder={
										isRdf
											? "Select start node"
											: "Select parent table"
									}
								/>
							</SelectTrigger>
							<SelectContent>
								{tableOptions.map((table) => (
									<SelectItem key={table} value={table}>
										{table}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</Field>

					<Field>
						<FieldLabel className="mb-1.5 block text-xs">
							{isRdf ? "Child Node" : "Child Table"}{" "}
							<span className="text-destructive">*</span>
						</FieldLabel>
						<Select
							value={childTable || ""}
							onValueChange={(value) => setChildTable(value)}
						>
							<SelectTrigger className="w-full">
								<SelectValue
									placeholder={
										isRdf
											? "Select child node"
											: "Select child table"
									}
								/>
							</SelectTrigger>
							<SelectContent>
								{tableOptions.map((table) => (
									<SelectItem key={table} value={table}>
										{table}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</Field>

					{/* Live Relationship Preview */}
					<div className="flex h-11 w-full items-center gap-2 rounded-md border border-border bg-muted/40 px-3">
						<Eye className="size-4 shrink-0 text-muted-foreground" />
						{parentTable || childTable ? (
							<div className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
								<span
									className={`truncate font-medium ${parentTable ? "text-foreground" : "text-muted-foreground italic"}`}
								>
									{parentTable ||
										(isRdf ? "Start Node" : "Parent Table")}
								</span>
								<ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
								<span
									className={`truncate font-medium ${childTable ? "text-foreground" : "text-muted-foreground italic"}`}
								>
									{childTable ||
										(isRdf ? "Child Node" : "Child Table")}
								</span>
							</div>
						) : (
							<span className="text-muted-foreground text-sm">
								Select {isRdf ? "nodes" : "tables"} above to
								preview
							</span>
						)}
					</div>

					{/* Error Message */}
					{error && (
						<P className="mb-2 text-destructive text-sm">{error}</P>
					)}

					{/* Connections List */}
					<div className="mx-4 mb-2 max-h-[110px] overflow-auto">
						{connections.map((c) => {
							const id = c.id ?? makeId(c);
							return (
								<div
									key={id}
									className="mb-1 flex items-center"
								>
									<div className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
										<span className="truncate font-medium text-foreground">
											{c.parentTable}
										</span>
										<ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
										<span className="truncate font-medium text-foreground">
											{c.childTable}
										</span>
									</div>

									<div className="ml-auto flex gap-1">
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8"
											onClick={() => handleStartEdit(c)}
											aria-label="edit-connection"
											data-testid="edit-connection"
										>
											<Edit className="size-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8"
											onClick={() => handleDelete(c)}
											aria-label="delete-connection"
											data-testid="delete-connection"
										>
											<Trash2 className="size-4" />
										</Button>
									</div>
								</div>
							);
						})}
					</div>
				</div>

				<DialogFooter className="gap-2">
					<Button variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button
						variant="outline"
						onClick={handleAdd}
						disabled={!isFormValid || error !== ""}
						data-testid="add-connection"
					>
						{editingId ? "Update" : "Add"}
					</Button>
					<Button
						variant="default"
						onClick={handleSave}
						disabled={error !== "" || save}
						data-testid="save-connection"
					>
						Save
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default CreateConnection;
