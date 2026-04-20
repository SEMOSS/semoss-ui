import { observer } from "mobx-react-lite";
import { useMemo, useRef } from "react";
import { useBlocks, useBlocksPixel } from "@semoss/renderer";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@semoss/ui/next";

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
			<div
				style={{
					height: "200px",
					width: parentParent?.getBoundingClientRect().width
						? `${parentParent.getBoundingClientRect().width}px`
						: "auto",
					overflow: "auto",
				}}
			>
				<Table ref={tableRef} className="text-xs">
					<TableHeader className="sticky top-0 bg-background">
						<TableRow>
							{getData.status === "SUCCESS" &&
								getData.data.data.headers.map((h, _hIdx) => (
									<TableHead
										key={`header-${_hIdx}-${h[_hIdx]}`}
									>
										{h}
									</TableHead>
								))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading && (
							<TableRow>
								<TableCell colSpan={9999} style={{ padding: 0 }}>
									<div className="h-1 w-full overflow-hidden bg-primary/20">
										<div className="h-full w-1/3 animate-[indeterminate_1.5s_ease-in-out_infinite] bg-primary" />
									</div>
								</TableCell>
							</TableRow>
						)}
						{isError && (
							<TableRow>
								<TableCell>
									There was an issue generating a preview.
								</TableCell>
							</TableRow>
						)}
						{getData.status === "SUCCESS" &&
							getData.data.data.values.map((r, _rIdx) => (
								<TableRow
									key={`data-row-${getData.data.data.headers[_rIdx]}-${_rIdx}`}
								>
									{r.map((v, _vIdx) => (
										<TableCell
											key={`data-row-col-${getData.data.data.headers[_rIdx]}-${_rIdx}-${_vIdx}`}
										>
											{isTimestamp(v)
												? v.split(".")[0]
												: v}
										</TableCell>
									))}
								</TableRow>
							))}
					</TableBody>
				</Table>
			</div>
			<span className="text-xs">
				{isSuccess &&
					`Showing ${getData.data.data.values.length} of ${getCount.data}. This is a preview of ingested data`}
			</span>
		</>
	);
});
