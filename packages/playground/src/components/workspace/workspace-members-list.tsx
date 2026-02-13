import { useEffect, useRef } from "react";
import { ScrollArea } from "@semoss/ui/next";
import { getProjectUsers } from "@/api";

export interface WorkspaceMembersListProps {
	/**
	 * WorkspaceId
	 */
	workspaceId: string;

	/**
	 * Search the members by name
	 */
	search: string;

	paginationControl: {
		rowsPerPage: number;
		offset: number;
		totalRows: number;
		setTotalRows: (rows: number) => void;
		setCurrentPage: (currentPage: number) => void;
	};
}

export const WorkspaceMembersList = ({
	workspaceId,
	paginationControl,
	search,
}: WorkspaceMembersListProps) => {
	const { rowsPerPage, offset, setTotalRows, setCurrentPage } =
		paginationControl;
	const prevSearchRef = useRef(search);

	useEffect(() => {
		const fetchMembers = async () => {
			const { totalMembers } = await getProjectUsers(
				workspaceId,
				search,
				undefined,
				rowsPerPage,
				offset,
			);
			setTotalRows(totalMembers);
			// If the search term has changed, reset to the first page
			if (prevSearchRef.current !== search) {
				setCurrentPage(1);
				prevSearchRef.current = search;
			}
			console.log(
				`Fetched members for workspace ${workspaceId} with search "${search}", total members: ${totalMembers}`,
			);
		};
		fetchMembers();
	}, [
		workspaceId,
		rowsPerPage,
		offset,
		search,
		setTotalRows,
		setCurrentPage,
	]);

	return (
		<ScrollArea className="h-full w-full">
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
			<div>{workspaceId}</div>
		</ScrollArea>
	);
};
