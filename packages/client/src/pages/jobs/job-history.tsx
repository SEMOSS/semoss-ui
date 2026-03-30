import {
	Table,
	TableHeader,
	TableBody,
	TableFooter,
	TableRow,
	TableCell,
	TableHead,
  } from "@semoss/ui/next";
  import {
	Field,
	FieldContent,
  } from "@semoss/ui/next";
  import { Spinner } from "@semoss/ui/next";
  import { Table as TableUI } from "@semoss/ui";
  
  import { HistoryRow } from "./HistoryRow";
  import type { HistoryJob } from "./job.types";
  
  export const JobHistory = (props: {
	history: HistoryJob[];
	historyLoading: boolean;
	historyCount: number;
	historyPage: number;
	historyRowsPerPage: number;
	onPageChange?: (page: number) => void;
	onRowsPerPageChange?: (rowsPerPage: number) => void;
	onSearchChange?: (search: string) => void;
  }) => {
	const {
	  history,
	  historyLoading,
	  historyCount,
	  historyPage,
	  historyRowsPerPage,
	  onPageChange,
	  onRowsPerPageChange,
	} = props;
  
	return (
	  <Field className="border rounded-b-lg">
		<FieldContent>
  
		  <Table>
  
			<TableHeader>
			  <TableRow>
				<TableHead>Job Name</TableHead>
				<TableHead>Run Time</TableHead>
				<TableHead>Time</TableHead>
				<TableHead>Status</TableHead>
			  </TableRow>
			</TableHeader>
  
			<TableBody>
  
			  {historyLoading && (
				<TableRow>
				  <TableCell colSpan={5} className="p-0">
					<div className="flex justify-center py-4">
					  <Spinner />
					</div>
				  </TableCell>
				</TableRow>
			  )}
  
			  {!historyLoading && history.length === 0 && (
				<TableRow>
				  <TableCell colSpan={5} className="text-center py-4">
					No job history, please try again.
				  </TableCell>
				</TableRow>
			  )}
  
			  {!historyLoading &&
				history.map((row, i) => (
				  <HistoryRow key={i} row={row} />
				))}
  
			</TableBody>
  
			<TableFooter>
			<TableRow>
				<TableUI.Pagination
				rowsPerPageOptions={[5, 10, 25]}
				onPageChange={(e, v) => {
					onPageChange?.(v);
				}}
				page={historyPage}
				rowsPerPage={historyRowsPerPage}
				onRowsPerPageChange={(e) => {
					onRowsPerPageChange?.(Number(e.target.value));
				}}
				count={historyCount}
				/>
			</TableRow>
			</TableFooter>
  
		  </Table>
  
		</FieldContent>
	  </Field>
	);
  };