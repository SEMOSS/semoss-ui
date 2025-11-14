import {
	ArrowRightAlt,
	Close,
	Delete,
	Edit,
	Preview,
} from "@mui/icons-material";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import {
	Autocomplete,
	Box,
	Button,
	FormControl,
	IconButton,
	Modal,
	styled,
	TextField,
	Typography,
} from "@semoss/ui";

const StyledBox = styled(Box)(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	height: "44px",
	gap: 1,
	backgroundColor: theme.palette.primary.selected,
	borderRadius: "6px",
	padding: "6px 10px",
	width: "100%",
	cursor: "pointer",
	border: `1px solid ${theme.palette.primary.selected}`,
}));

const PreviewIcon = styled(Preview)(({ theme }) => ({
	color: theme.palette.primary.main,
	fontSize: 18,
	marginRight: "4px",
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
	color: theme.palette.primary.main,
	fontWeight: 500,
}));

const StyledList = styled(Box)(() => ({
	marginBottom: "8px",
	marginLeft: "16px",
	marginRight: "16px",
	maxHeight: "110px",
	overflow: "auto",
}));

const StyledInnerList = styled(Box)(() => ({
	display: "flex",
	alignItems: "center",
	marginBottom: "4px",
}));

const StyledTypographyLeft = styled(Typography)(() => ({
	fontWeight: 400,
	mr: 2,
}));

const StyledTypographyRight = styled(Typography)(() => ({
	fontWeight: 400,
	ml: 2,
}));

const ButtonBox = styled(Box)(() => ({
	marginLeft: "auto",
	display: "flex",
	gap: 1,
}));

const StyledError = styled(Typography)(({ theme }) => ({
	color: theme.palette.error.main,
	mb: 1,
}));

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

const ModalTitle = styled(Modal.Title)(() => ({ m: 0, p: 1 }));
const StyledCloseIconButton = styled(IconButton)(() => ({
	position: "absolute",
	right: "8px",
	top: "15px",
}));
const ModalActions = styled(Modal.Actions)(() => ({
	padding: "0px 18px 18px 0px",
}));

const StyledContent = styled(Box)(() => ({
	display: "flex",
	flexDirection: "column",
	gap: 16,
	paddingBottom: "8px",
}));

const StyledLabel = styled(Typography)(() => ({
	marginBottom: 6,
	display: "block",
	fontSize: 13,
}));

const StyledRequired = styled("span")(({ theme }) => ({
	color: theme.palette.error.main,
}));
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
		<Modal
			open={open}
			onClose={onClose}
			fullWidth
			maxWidth="sm"
			scroll="paper"
		>
			<ModalTitle>
				Create Connection
				<StyledCloseIconButton
					onClick={onClose}
					aria-label="close"
					size="small"
					data-testid="close-btn"
				>
					<Close fontSize="small" />
				</StyledCloseIconButton>
			</ModalTitle>

			<Modal.Content>
				<StyledContent>
					<FormControl fullWidth>
						<StyledLabel variant={"subtitle1"}>
							Parent Table <StyledRequired>*</StyledRequired>
						</StyledLabel>
						<Autocomplete
							options={tableOptions}
							value={parentTable ? [parentTable] : []}
							onChange={(e, val) => {
								const newVal = Array.isArray(val)
									? (val[0] ?? "")
									: (val ?? "");
								setParentTable(String(newVal));
							}}
							renderInput={(params) => (
								<TextField
									{...params}
									variant="outlined"
									placeholder="Select or type parent table"
									inputProps={{ ...params.inputProps }}
								/>
							)}
						/>
					</FormControl>

					<FormControl fullWidth>
						<StyledLabel variant={"subtitle1"}>
							Child Table <StyledRequired>*</StyledRequired>
						</StyledLabel>
						<Autocomplete
							options={tableOptions}
							value={childTable ? [childTable] : []}
							onChange={(e, val) => {
								const newVal = Array.isArray(val)
									? (val[0] ?? "")
									: (val ?? "");
								setChildTable(String(newVal));
							}}
							renderInput={(params) => (
								<TextField
									{...params}
									variant="outlined"
									placeholder="Select or type child table"
									inputProps={{ ...params.inputProps }}
								/>
							)}
						/>
					</FormControl>

					<StyledBox>
						<PreviewIcon />
						<StyledTypography variant="body2">
							Relationship Preview
						</StyledTypography>
					</StyledBox>
					{error ? (
						<StyledError variant="body2">{error}</StyledError>
					) : null}
					<StyledList>
						{connections.map((c) => {
							const id = c.id ?? makeId(c);
							return (
								<StyledInnerList key={id}>
									<StyledTypographyLeft variant="body2">
										{c.parentTable}
									</StyledTypographyLeft>
									<ArrowRightAlt />
									<StyledTypographyRight variant="body2">
										{c.childTable}
									</StyledTypographyRight>

									<ButtonBox>
										<IconButton
											size="small"
											onClick={() => handleStartEdit(c)}
											aria-label="edit-connection"
											data-testid="edit-connection"
										>
											<Edit fontSize="small" />
										</IconButton>
										<IconButton
											size="small"
											onClick={() => handleDelete(c)}
											aria-label="delete-connection"
											data-testid="delete-connection"
										>
											<Delete fontSize="small" />
										</IconButton>
									</ButtonBox>
								</StyledInnerList>
							);
						})}
					</StyledList>
				</StyledContent>
			</Modal.Content>

			<ModalActions>
				<Button onClick={onClose}>Cancel</Button>
				<Button
					variant="outlined"
					onClick={handleAdd}
					disabled={!isFormValid || error !== ""}
					data-testid="add-connection"
				>
					{editingId ? "Update" : "Add"}
				</Button>
				<Button
					variant="contained"
					onClick={() => {
						onClose();
					}}
					disabled={error !== "" || save}
					data-testid="save-connection"
				>
					Save
				</Button>
			</ModalActions>
		</Modal>
	);
};

export default CreateConnection;
