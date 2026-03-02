import { ArrowRight, Edit, Eye, Trash2} from "lucide-react";
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
}

export const CreateConnection: React.FC<ConnectionProps> = ({
	open,
	onClose,
	nodes,
	onCreateConnection,
	initialConnections = [],
	onEditConnection,
	onDeleteConnection,
}) => {
	const tableOptions = useMemo(() => nodes.map((n) => n.data.name), [nodes]);

	const [parentTable, setParentTable] = useState("");
	const [childTable, setChildTable] = useState("");
	const [connections, setConnections] = useState<Conn[]>([]);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [error, setError] = useState<string>("");
	const [save, setSave] = useState(true);

	const makeId = (c: Conn) =>
		`${c.parentTable}_${c.childTable}`.replace(/\s+/g, "_");

	useEffect(() => {
		if (open) {
			const normalized = initialConnections.map((c) => {
				const copy = { ...c };
				if (!copy.id) copy.id = makeId(copy);
				return copy;
			});
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
			onEditConnection?.(newConn);
			setEditingId(null);
		} else {
			setConnections((prev) => [...prev, newConn]);
			onCreateConnection?.(newConn);
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
		if (id && onDeleteConnection) onDeleteConnection(id);

		if (editingId === id) {
			setEditingId(null);
			setParentTable("");
			setChildTable("");
		}
		setError("");
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
							Parent Table{" "}
							<span className="text-destructive">*</span>
						</FieldLabel>
						<Select
							value={parentTable || ""}
							onValueChange={(value) => setParentTable(value)}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select or type parent table" />
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
							Child Table{" "}
							<span className="text-destructive">*</span>
						</FieldLabel>
						<Select
							value={childTable || ""}
							onValueChange={(value) => setChildTable(value)}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select or type child table" />
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

					{/* Relationship Preview Box */}
					<div className="flex h-11 w-full cursor-pointer items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1.5">
						<Eye className="mr-1 size-[18px] text-primary" />
						<P className="font-medium text-primary">
							Relationship Preview
						</P>
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
									<P className="mr-4 font-normal text-foreground">
										{c.parentTable}
									</P>
									<ArrowRight className="size-5 text-muted-foreground" />
									<P className="ml-4 font-normal text-foreground">
										{c.childTable}
									</P>

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
						onClick={() => {
							onClose();
						}}
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
