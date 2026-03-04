import { observer } from "mobx-react-lite";
import { useMemo, useRef } from "react";
import { useBlocks, useBlocksPixel } from "@semoss/renderer";
import { LinearProgress, styled, Table, Typography } from "@semoss/ui";

const StyledTableContainer = styled(Table.Container)<{ $width?: number }>(
	({ $width }) => ({
		height: "200px",
		width: $width ? `${$width}px` : "auto",
	}),
);

const StyledLoadingTableCell = styled(Table.Cell)(() => ({
	padding: "0!important",
}));

export interface FrameOperationProps {
	/** Output returned that can render a preview of the frame */
	output: {
		/** Name of the frame  */
		name: string;

		/** Type of the frame */
		type: "NATIVE" | "PY" | "GRID" | "R";
	};
	cellData?: {
		cellId: string;
		queryId: string;
	};
}
export const FrameOperation = observer((props: FrameOperationProps) => {
	const { output } = props;
	const { state } = useBlocks();

	let cellDetail = null;
	if (props?.cellData) {
		const queryDetail = state.getQuery(props.cellData.queryId.toString());
		cellDetail = queryDetail.getCell(props.cellData.cellId.toString());
	}

	const getCount = useBlocksPixel<number>(
		`Frame(frame=[${output.name}] )|QueryAll()|QueryRowCount();`,
	);

	// Determine the limit to use
	const rowCount = getCount.status === "SUCCESS" ? getCount.data : 0;
	const hasDataLimit = cellDetail?.parameters?.dataLimit;
	const addLimit = hasDataLimit
		? (Number(cellDetail.parameters.dataLimit) ?? -1)
		: rowCount > 500
			? 20
			: -1;

	const queryToRun = useMemo(
		() =>
			`Frame(frame=[${output.name}] )|QueryAll()|Limit(${addLimit})|CollectAll();`,
		[output, addLimit],
	);

	// get the data from the frame
	const getData = useBlocksPixel<{
		data: {
			values: (string | number | boolean)[][];
			headers: string[];
		};
	}>(queryToRun);

	// get the statuses
	const isLoading =
		getData.status === "LOADING" || getCount.status === "LOADING";
	const isError = getData.status === "ERROR" || getCount.status === "ERROR";
	const isSuccess =
		getData.status === "SUCCESS" && getCount.status === "SUCCESS";

	const tableRef = useRef<HTMLTableElement | null>(null);

	const parent = tableRef?.current?.parentElement;
	const parentParent = parent?.parentElement as HTMLElement | null;
	const isTimestamp = (value: unknown): value is string => {
		return (
			typeof value === "string" &&
			/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/.test(value)
		);
	};

	return (
		<>
			<StyledTableContainer
				$width={parentParent?.getBoundingClientRect().width}
			>
				<Table ref={tableRef} stickyHeader size="small">
					<Table.Head>
						<Table.Row>
							{getData.status === "SUCCESS" &&
								getData.data.data.headers.map((h, _hIdx) => (
									<Table.Cell
										key={`header-${_hIdx}-${h[_hIdx]}`}
									>
										{h}
									</Table.Cell>
								))}
						</Table.Row>
					</Table.Head>
					<Table.Body>
						{isLoading && (
							<StyledLoadingTableCell>
								<LinearProgress variant="indeterminate" />
							</StyledLoadingTableCell>
						)}
						{isError && (
							<Table.Cell>
								There was an issue generating a preview.
							</Table.Cell>
						)}
						{getData.status === "SUCCESS" &&
							getData.data.data.values.map((r, _rIdx) => (
								<Table.Row
									key={`data-row-${getData.data.data.headers[_rIdx]}-${_rIdx}`}
								>
									{r.map((v, _vIdx) => (
										<Table.Cell
											key={`data-row-col-${getData.data.data.headers[_rIdx]}-${_rIdx}-${_vIdx}`}
										>
											{isTimestamp(v)
												? v.split(".")[0]
												: v}
										</Table.Cell>
									))}
								</Table.Row>
							))}
					</Table.Body>
				</Table>
			</StyledTableContainer>
			<Typography variant="caption">
				{isSuccess &&
					`Showing ${getData.data.data.values.length} of ${getCount.data}. This is a preview of ingested data`}
			</Typography>
		</>
	);
});
