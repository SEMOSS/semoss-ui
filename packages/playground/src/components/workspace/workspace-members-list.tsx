import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, Button, ScrollArea } from "@semoss/ui/next";
import { getProjectUsers } from "@/api";
import type { User } from "@/types";

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
	const [members, setMembers] = useState<User[]>([]);

	useEffect(() => {
		const fetchMembers = async () => {
			const { totalMembers, members } = await getProjectUsers(
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
			setMembers(members); // Update members with fetched data
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
			<div className="py-4">
				<div className="px-6 pb-2 text-muted-foreground">
					Who has access
				</div>
				{members.map((member) => {
					const initials = member.name
						.split(" ")
						.map((n) => n[0])
						.join("")
						.toUpperCase()
						.slice(-2);

					return (
						<div
							key={member.id}
							className="flex items-center gap-3 rounded p-2 px-6 hover:bg-accent"
						>
							<Avatar className="h-12 w-12 rounded-md">
								<AvatarFallback className="rounded-md">
									{initials}
								</AvatarFallback>
							</Avatar>
							<div className="flex flex-1 flex-col">
								<span className="font-medium text-sm">
									{member.name}
								</span>
								<span className="text-muted-foreground text-xs">
									{member.email}
								</span>
							</div>
							<Button variant="outline" size="sm">
								Todo
							</Button>
						</div>
					);
				})}
			</div>
		</ScrollArea>
	);
};
