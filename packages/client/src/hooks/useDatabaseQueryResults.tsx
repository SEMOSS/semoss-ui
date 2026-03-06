import { CheckCircle, Error as ErrorIcon, Info } from "@mui/icons-material";
import React from "react";
import { Alert, Box, styled, Table, Typography } from "@semoss/ui";
import {
	getErrorMessage,
	hasTabularData,
	isErrorResponse,
	type QueryResult,
} from "./useDatabaseQueryExecution";

// Styled components
const StyledEmptyStateContainer = styled(Box)(() => ({
	display: "flex",
	justifyContent: "center",
	alignItems: "center",
	height: "100%",
	color: "secondary",
}));

const StyledResultsContainer = styled(Box)(({ theme }) => ({
	padding: theme.spacing(2),
}));

const StyledExecutionTimeContainer = styled(Box)(({ theme }) => ({
	padding: theme.spacing(1),
	backgroundColor: theme.palette.grey[100],
	borderRadius: theme.spacing(1),
	fontSize: "12px",
}));

const StyledExecutionTimeContainerWithMargin = styled(
	StyledExecutionTimeContainer,
)(({ theme }) => ({
	marginBottom: theme.spacing(2),
}));

const StyledTableContainer = styled(Table.Container)(({ theme }) => ({
	padding: theme.spacing(2),
	paddingTop: 0,
	overflow: "auto",
	width: "100%",
}));

const StyledTable = styled(Table)(() => ({
	border: "none",
	display: "table",
	width: "100%",
}));

const StyledTableHeader = styled(Table.Head)(() => ({
	display: "flex",
	fontWeight: "bold",
	backgroundColor: "#F5F9FE",
	color: "#0471F0",
	borderBottom: "1px solid #e0e0e0",
	position: "sticky",
	top: 0,
	zIndex: 1,
}));

const StyledHeaderCell = styled(Table.Cell)(() => ({
	flex: 1,
	padding: "8px",
	fontSize: "12px",
	borderRight: "none",
	minWidth: "100px",
	overflow: "hidden",
	textOverflow: "ellipsis",
	whiteSpace: "nowrap",
	color: "#0471F0",
	backgroundColor: "#F5F9FE",
}));

const StyledTableBody = styled(Table.Body)<{ isExpanded: boolean }>(
	({ isExpanded }) => ({
		maxHeight: isExpanded ? "calc(100vh - 200px)" : "180px",
	}),
);

const StyledEmptyDataContainer = styled(Box)(({ theme }) => ({
	padding: theme.spacing(3),
	textAlign: "center",
	color: "secondary",
}));

const StyledTableRow = styled(Table.Row)(({ theme }) => ({
	display: "flex",
	borderBottom: "1px solid #e0e0e0",
	"&:hover": {
		backgroundColor: theme.palette.grey[50],
	},
}));

const StyledDataCell = styled(Table.Cell)(() => ({
	flex: 1,
	padding: "8px",
	fontSize: "12px",
	borderRight: "none",
	minWidth: "100px",
	overflow: "hidden",
	textOverflow: "ellipsis",
	whiteSpace: "nowrap",
}));

const StyledOutputContainer = styled(Box)(({ theme }) => ({
	marginTop: theme.spacing(2),
}));

const StyledOutputLabel = styled(Typography)(({ theme }) => ({
	fontWeight: 600,
	display: "block",
	marginBottom: theme.spacing(1),
}));

const StyledOutputContent = styled(Box)(({ theme }) => ({
	padding: theme.spacing(1),
	backgroundColor: theme.palette.grey[50],
	border: "1px solid",
	borderColor: theme.palette.grey[300],
	borderRadius: theme.spacing(1),
	fontSize: "12px",
	fontFamily: "monospace",
	whiteSpace: "pre-wrap",
	maxHeight: "200px",
	overflow: "auto",
}));

const StyledPreBlock = styled("pre")(() => ({
	fontSize: "11px",
	overflow: "auto",
	margin: 0,
	whiteSpace: "pre-wrap",
	padding: "8px",
	maxHeight: "150px",
	backgroundColor: "#f5f5f5",
	border: "1px solid #ddd",
	borderRadius: "4px",
}));

const StyledAlert = styled(Alert)(({ theme }) => ({
	marginBottom: theme.spacing(2),
}));

const StyledErrorTypography = styled(Typography)(({ theme }) => ({
	marginTop: theme.spacing(1),
	whiteSpace: "pre-wrap",
}));

const StyledOperationTypography = styled(Typography)(() => ({
	display: "block",
}));

const StyledSuccessTypography = styled(Typography)(({ theme }) => ({
	fontWeight: 600,
}));

const StyledInfoTypography = styled(Typography)(({ theme }) => ({
	fontWeight: 600,
}));

const StyledInfoBodyTypography = styled(Typography)(({ theme }) => ({
	marginTop: theme.spacing(1),
}));

export function useQueryResults() {
	const renderResults = (
		previewData: QueryResult | null,
		previewLimit: number,
		isExpanded: boolean = false,
	) => {
		if (!previewData) {
			return (
				<StyledEmptyStateContainer>
					<Typography variant="body2">
						Click "RUN" to see query results here
					</Typography>
				</StyledEmptyStateContainer>
			);
		}

		if (isErrorResponse(previewData)) {
			const errorMessage = getErrorMessage(previewData);
			return (
				<StyledResultsContainer>
					<StyledAlert severity="error" icon={<ErrorIcon />}>
						<StyledSuccessTypography variant="subtitle2">
							Query Error
						</StyledSuccessTypography>
						<StyledErrorTypography variant="body2">
							{errorMessage}
						</StyledErrorTypography>
					</StyledAlert>

					<StyledExecutionTimeContainer>
						<Typography variant="caption">
							Execution time: {previewData.timeToRun || 0}ms
						</Typography>
					</StyledExecutionTimeContainer>
				</StyledResultsContainer>
			);
		}

		if (previewData.queryType && previewData.queryType !== "SELECT") {
			const isSuccess = previewData.isSuccess !== false;

			return (
				<StyledResultsContainer>
					<StyledAlert
						severity={isSuccess ? "success" : "warning"}
						icon={isSuccess ? <CheckCircle /> : <Info />}
					>
						<StyledSuccessTypography variant="subtitle2">
							{isSuccess
								? `Statement Executed`
								: `Statement Completed`}
						</StyledSuccessTypography>
					</StyledAlert>

					<StyledExecutionTimeContainerWithMargin>
						<Typography variant="caption">
							Execution time: {previewData.timeToRun || 0}ms
						</Typography>
						{previewData.queryText && (
							<StyledOperationTypography variant="caption">
								Query: {previewData.queryText}
							</StyledOperationTypography>
						)}
						{previewData.operationType && (
							<StyledOperationTypography variant="caption">
								Operation:{" "}
								{Array.isArray(previewData.operationType)
									? previewData.operationType.join(", ")
									: previewData.operationType}
							</StyledOperationTypography>
						)}
					</StyledExecutionTimeContainerWithMargin>

					{previewData.output && (
						<StyledOutputContainer>
							<StyledOutputLabel variant="caption">
								Database Response:
							</StyledOutputLabel>
							<StyledOutputContent>
								{typeof previewData.output === "string"
									? previewData.output
									: JSON.stringify(
											previewData.output,
											null,
											2,
										)}
							</StyledOutputContent>
						</StyledOutputContainer>
					)}
				</StyledResultsContainer>
			);
		}

		if (hasTabularData(previewData)) {
			return (
				<StyledTableContainer data-testid="query-results-table-container">
					<StyledTable
						aria-label="sticky table"
						data-testid="query-results-table"
					>
						{previewData.output.data.headers && (
							<StyledTableHeader>
								{previewData.output.data.headers.map(
									(header: string, index: number) => (
										<StyledHeaderCell key={index}>
											{header}
										</StyledHeaderCell>
									),
								)}
							</StyledTableHeader>
						)}

						{previewData.output.data.values && (
							<StyledTableBody
								isExpanded={isExpanded}
								data-testid="query-results-table-body"
							>
								{previewData.output.data.values.length === 0 ? (
									<StyledEmptyDataContainer>
										<Typography variant="body2">
											No data returned
										</Typography>
									</StyledEmptyDataContainer>
								) : (
									previewData.output.data.values.map(
										(row: any[], rowIndex: number) => (
											<StyledTableRow key={rowIndex}>
												{row.map(
													(
														cell: any,
														cellIndex: number,
													) => (
														<StyledDataCell
															key={cellIndex}
														>
															{cell !== null &&
															cell !== undefined
																? String(cell)
																: "(null)"}
														</StyledDataCell>
													),
												)}
											</StyledTableRow>
										),
									)
								)}
							</StyledTableBody>
						)}
					</StyledTable>
				</StyledTableContainer>
			);
		}

		return (
			<StyledResultsContainer>
				<StyledAlert severity="info" icon={<Info />}>
					<StyledInfoTypography variant="subtitle2">
						Query Executed
					</StyledInfoTypography>
					<StyledInfoBodyTypography variant="body2">
						The query was executed successfully but returned no
						tabular data
					</StyledInfoBodyTypography>
				</StyledAlert>

				<StyledExecutionTimeContainer>
					<Typography variant="caption">
						Execution time: {previewData.timeToRun || 0}ms
					</Typography>
					{previewData.queryText && (
						<StyledOperationTypography variant="caption">
							Query: {previewData.queryText}
						</StyledOperationTypography>
					)}
				</StyledExecutionTimeContainer>

				{previewData.output && (
					<StyledOutputContainer>
						<StyledOutputLabel variant="caption">
							Raw Output:
						</StyledOutputLabel>
						<StyledPreBlock>
							{typeof previewData.output === "string"
								? previewData.output
								: JSON.stringify(previewData.output, null, 2)}
						</StyledPreBlock>
					</StyledOutputContainer>
				)}
			</StyledResultsContainer>
		);
	};

	return renderResults;
}
