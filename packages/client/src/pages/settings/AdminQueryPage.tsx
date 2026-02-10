import {
	ArrowForward,
	Check,
	Close,
	OpenInFullSharp,
} from "@mui/icons-material";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Navigate } from "react-router-dom";
import {
	Alert,
	Box,
	Button,
	IconButton,
	Modal,
	Select,
	styled,
	Table,
	TextArea,
	TextField,
	useNotification,
} from "@semoss/ui";
import { useRootStore, useSettings } from "@/hooks";

const StyledContainer = styled("div")(() => ({
	display: "flex",
	width: "100%",
	gap: "24px",
}));

const StyledLeft = styled("div")(() => ({
	display: "flex",
	flexDirection: "column",
	width: "100%",
}));

const StyledRight = styled("div")(() => ({
	overflow: "scroll",
	width: "100%",
	marginTop: "20px",
}));
const PaginationContainer = styled(Box)(() => ({
	display: "flex",
	justifyContent: "flex-end",
	width: "100%",
}));
const Styledform = styled("div")(() => ({
	width: "100%",
}));
const StyledStack = styled("div")(() => ({
	width: "100%",
	gap: "20px",
	flexDirection: "column",
	display: "flex",
	marginBottom: "20px",
}));

const Field = styled(Box)(() => ({
	display: "flex",
	flexDirection: "column",
	width: "100%",
	gap: "8px",
}));

const Label = styled("label")(({ theme }) => ({
	fontSize: "0.875rem",
	lineHeight: 1.4,
	color: theme.palette.text.secondary,
}));
const TableContainer = styled(Table.Container)(() => ({
	maxHeight: "400px",
	overflow: "auto",
}));
const Pagination = styled(Table.Pagination)(() => ({
	border: "none",
	width: "auto",
}));
const TableHeader = styled(Table.Head)(({ theme }) => ({
	backgroundColor: theme.palette.primary.hover,
}));
const TableHeaderCell = styled(Table.Cell)(({ theme }) => ({
	padding: "10px",
	fontWeight: 600,
	color: theme.palette.primary.main,
}));
const StyledBox = styled(Box)({
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	minWidth: 32,
});
const CheckIcon = styled(Check)(({ theme }) => ({
	color: theme.palette.success.main,
}));
const CloseIcon = styled(Close)(({ theme }) => ({
	color: theme.palette.error.main,
}));

const StyledSelect = styled(Select)(() => ({
	width: "100%",
}));

const StyledTextArea = styled(TextArea)({
	width: "100%",
	overflow: "none",
	"& .MuiInputBase-root.MuiOutlinedInput-root": {
		alignItems: "flex-start",
	},
});

const StyledTextAreaPopup = styled(TextArea)({
	width: "100%",
	overflow: "none",
});

const StyledIconButton = styled(IconButton)({
	padding: 0,
	color: "text.secondary",
});
const StyledCloseIconButton = styled(IconButton)({
	position: "absolute",
	right: "8px",
	top: "15px",
});
const ModalTitle = styled(Modal.Title)({
	m: 0,
	p: 2,
});
const ModalActions = styled(Modal.Actions)({
	p: 2,
});
const StyledTableCell = styled(Table.Cell)<{ $isBoolean?: boolean }>(
	({ $isBoolean }) => ({
		padding: "10px",
		textAlign: $isBoolean ? "center" : "left",
	}),
);
const StyledButton = styled(Button)({
	marginTop: "16px",
});

const DATABASE_OPTIONS = [
	"AuditLogs",
	"LocalMasterDatabase",
	"scheduler",
	"security",
	"themes",
	"UserTrackingDatabase",
	"Notification",
];

interface TypeDbQuery {
	SELECTED_DATABASE: string;
	QUERY: string;
	ROWS: number;
}

export const AdminQueryPage = () => {
	const { monolithStore } = useRootStore();
	const { adminMode } = useSettings();
	const notification = useNotification();
	const [output, setOutput] = useState<{
		type: string;
		value;
	}>({
		type: "",
		value: "",
	});
	const [showRowsField, setShowRowsField] = useState(false);
	const { control, watch, setValue, handleSubmit } = useForm<{
		SELECTED_DATABASE: string;
		QUERY: string;
		ROWS: number;
	}>({
		defaultValues: {
			SELECTED_DATABASE: "",
			QUERY: "",
			ROWS: 100,
		},
	});

	const [open, setOpen] = useState(false);
	const [draft, setDraft] = useState("");
	const [page, setPage] = useState<number>(0);
	const [rowsPerPage, setRowsPerPage] = useState<number>(10);

	const openModal = (value: string) => {
		setDraft(value ?? "");
		setOpen(true);
	};

	const closeModal = () => {
		setOpen(false);
	};

	const handleDone = useCallback(
		(onChange: (v: string) => void) => {
			onChange(draft);
			setOpen(false);
		},
		[draft],
	);
	const query = watch("QUERY");
	const selectedDatabase = watch("SELECTED_DATABASE");

	const verifySelectQuery = useCallback(() => {
		if (query?.toUpperCase()?.startsWith("SELECT")) {
			setShowRowsField(true);
		} else {
			if (showRowsField) {
				setShowRowsField(false);
				setValue("ROWS", 1);
			}
		}
	}, [query, showRowsField, setValue]);

	useEffect(() => {
		verifySelectQuery();
	}, [verifySelectQuery]);

	const trimmedQuery = query?.trim() || "";

	// Final condition to enable Run button
	const disableButton = Boolean(selectedDatabase) && trimmedQuery.length > 0;
	useEffect(() => {
		setPage(0);
		setRowsPerPage(10);
	}, [output]);

	if (!adminMode) {
		return <Navigate to={"/settings"} />;
	}

	/**
	 * @name submitQuery
	 * @desc make runQuery API call based on submitted fields
	 */
	const submitQuery = handleSubmit((data: TypeDbQuery) => {
		const trimmedQuery = data.QUERY?.trim() ?? "";
		let pixelString = `META | AdminDatabase("${data.SELECTED_DATABASE}") | Query("<encode>${trimmedQuery}</encode>")`;

		if (showRowsField) {
			pixelString += `| Collect(${data.ROWS});`;
		} else {
			pixelString += "| AdminExecQuery();";
		}
		monolithStore
			.runQuery(pixelString)
			.then((response) => {
				let output: string | { data: { headers: string[]; values } };
				let type: string = response?.pixelReturn[0]?.operationType[0];

				output = response?.pixelReturn[0]?.output;
				type = response?.pixelReturn[0]?.operationType[0];

				if (type.indexOf("ERROR") > -1) {
					setOutput({
						type: "error",
						value: output,
					});
					notification.add({
						color: "error",
						message:
							typeof output === "string"
								? output
								: JSON.stringify(output),
					});

					return;
				} else if (output instanceof Object) {
					setOutput({
						type: "table",
						value: {
							headers: output?.data?.headers,
							values: output?.data?.values,
						},
					});
				} else {
					setOutput({
						type: "success",
						value: "",
					});
				}

				notification.add({
					color: "success",
					message: "Successfully submitted query",
				});
			})
			.catch((error) => {
				notification.add({
					color: "error",
					message: error,
				});
			});
	});

	const isBooleanColumn = (colIndex: number): boolean => {
		const response = output?.value?.headerInfo?.[colIndex];
		if (response && typeof response?.dataType === "string") {
			const dt = response?.dataType?.toUpperCase();
			if (dt === "BOOLEAN" || dt === "BOOL") return true;
		}
		return false;
	};

	const renderCell = (val, colIndex: number) => {
		const isBool = isBooleanColumn(colIndex);
		const normalized = typeof val === "boolean" ? Boolean(val) : null;

		if (isBool || normalized !== null) {
			const b = normalized;
			return (
				<StyledBox>
					{b === true && <CheckIcon fontSize="small" />}
					{b === false && <CloseIcon fontSize="small" />}
				</StyledBox>
			);
		}
		return String(val ?? "");
	};

	const handleChangePage = (_event: unknown, newPage: number) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (
		event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const next = parseInt(event.target.value, 10);
		setRowsPerPage(next);
		setPage(0);
	};

	const displayQueryOutput = (): JSX.Element | null => {
		if (output.type === "success") {
			return <Alert color={"success"}>Successful query!</Alert>;
		} else if (output.type === "error") {
			return <Alert color={"error"}>{output.value}</Alert>;
		} else if (output.type === "table") {
			const headers = output?.value?.headers ?? [];
			const rows = output?.value?.values ?? [];

			// slice rows for current page
			const start = page * rowsPerPage;
			const end = start + rowsPerPage;
			const paginatedRows = rows.slice(start, end);
			console.log(paginatedRows, "paginatedRows");
			return (
				<>
					<TableContainer>
						<Table stickyHeader aria-label="sticky table">
							<TableHeader>
								<Table.Row>
									{headers.map(
										(header: string, index: number) => (
											<TableHeaderCell
												key={header || index}
												data-testid={`adminQueryPage-table-header-c${index}`}
											>
												{header}
											</TableHeaderCell>
										),
									)}
								</Table.Row>
							</TableHeader>
							<Table.Body>
								{paginatedRows?.length > 0 &&
								paginatedRows.some((row) => row.length > 0) ? (
									paginatedRows?.map((row, rIdx: number) => (
										<Table.Row key={row}>
											{row?.map((col, cIdx) => (
												<StyledTableCell
													key={col}
													data-testid={`adminQueryPage-table-r${rIdx}-c${cIdx}`}
												>
													{renderCell(col, cIdx)}
												</StyledTableCell>
											))}
										</Table.Row>
									))
								) : (
									<Table.Row>
										<Table.Cell
											colSpan={Math.max(
												headers.length,
												1,
											)}
											align="center"
										>
											No data
										</Table.Cell>
									</Table.Row>
								)}
							</Table.Body>
						</Table>
					</TableContainer>
					{paginatedRows?.length > 0 &&
						paginatedRows.some((row) => row.length > 0) && (
							<PaginationContainer>
								<Pagination
									count={rows.length}
									page={page}
									rowsPerPage={rowsPerPage}
									onPageChange={handleChangePage}
									onRowsPerPageChange={
										handleChangeRowsPerPage
									}
									rowsPerPageOptions={[5, 10, 25]}
								/>
							</PaginationContainer>
						)}
				</>
			);
		}

		return null;
	};

	return (
		<StyledContainer>
			<StyledLeft>
				<Styledform>
					<StyledStack>
						<Controller
							name="SELECTED_DATABASE"
							control={control}
							rules={{ required: true }}
							render={({ field }) => (
								<Field>
									<Label htmlFor="db-select">Database</Label>
									<StyledSelect
										size="small"
										value={field.value ?? ""}
										onChange={(e) =>
											field.onChange(e.target.value)
										}
									>
										{DATABASE_OPTIONS?.map((option, i) => (
											<Select.Item
												value={option}
												key={option}
												data-testid={`adminQueryPage-db-option-${i}`}
											>
												{option}
											</Select.Item>
										))}
									</StyledSelect>
								</Field>
							)}
						/>
					</StyledStack>

					<StyledStack>
						<Controller
							name="ROWS"
							control={control}
							rules={{ min: 1 }}
							render={({ field }) => (
								<Field>
									<Label htmlFor="rows-input">
										Max # Rows to Collect
									</Label>
									<TextField
										fullWidth
										size="small"
										value={field.value ?? ""}
										onChange={(e) =>
											field.onChange(e.target.value)
										}
										type="number"
										placeholder="100"
									/>
								</Field>
							)}
						/>
					</StyledStack>
					<Controller
						name={"QUERY"}
						control={control}
						rules={{ required: true }}
						render={({ field }) => {
							return (
								<>
									<Field>
										<Label htmlFor="query-textarea">
											Enter query to run on database
										</Label>
										<StyledTextArea
											value={field.value ?? ""}
											onChange={(e) =>
												field.onChange(e.target.value)
											}
											minRows={4}
											maxRows={4}
											placeholder="SELECT * FROM engine"
											InputProps={{
												endAdornment: (
													<StyledIconButton
														size="small"
														onClick={() =>
															openModal(
																field.value ??
																	"",
															)
														}
													>
														<OpenInFullSharp />
													</StyledIconButton>
												),
											}}
										/>
									</Field>
									<Modal
										open={open}
										onClose={closeModal}
										fullWidth
										maxWidth="md"
										scroll="paper"
									>
										<ModalTitle>
											Enter query to run on database
											<StyledCloseIconButton
												onClick={closeModal}
												aria-label="close"
												size="small"
											>
												<Close fontSize="small" />
											</StyledCloseIconButton>
										</ModalTitle>

										<Modal.Content>
											<StyledTextAreaPopup
												minRows={16}
												maxRows={16}
												value={draft}
												onChange={(
													e: React.ChangeEvent<HTMLInputElement>,
												) => setDraft(e.target.value)}
											/>
										</Modal.Content>

										<ModalActions>
											<Button
												onClick={closeModal}
												data-testid="adminQueryPage-modal-cancel-btn"
											>
												Cancel
											</Button>
											<Button
												variant="contained"
												onClick={() =>
													handleDone(field.onChange)
												}
												data-testid="adminQueryPage-modal-done-btn"
											>
												Done
											</Button>
										</ModalActions>
									</Modal>
								</>
							);
						}}
					/>
					<StyledButton
						size="large"
						variant={"contained"}
						onClick={() => submitQuery()}
						disabled={!disableButton}
						data-testid={"adminQueryPage-run-btn"}
						endIcon={<ArrowForward />}
					>
						Run Query
					</StyledButton>
					<StyledRight>
						{!output.type
							? "Execute a query to display the results here."
							: displayQueryOutput()}
					</StyledRight>
				</Styledform>
			</StyledLeft>
		</StyledContainer>
	);
};
