import { useCallback, useEffect, useRef, useState } from "react";
import {
	Avatar,
	AvatarFallback,
	ScrollArea,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Skeleton,
	toast,
} from "@semoss/ui/next";
import { editProjectUserPermissions, getProjectUsers } from "@/api";
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
	const [isLoading, setIsLoading] = useState(true);

	const fetchMembers = useCallback(async () => {
		setIsLoading(true);
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
		setIsLoading(false);
	}, [
		workspaceId,
		search,
		rowsPerPage,
		offset,
		setTotalRows,
		setCurrentPage,
	]);

	useEffect(() => {
		fetchMembers();
	}, [fetchMembers]);

	const handlePermissionChange = async (
		userId: string,
		newPermission: string,
	) => {
		// Optimistically update the UI immediately
		const previousMembers = members;
		setMembers((prevMembers) =>
			prevMembers.map((member) =>
				member.id === userId
					? { ...member, permission: newPermission }
					: member,
			),
		);

		try {
			// Update the permission on the server
			await editProjectUserPermissions(workspaceId, [
				{ userid: userId, permission: newPermission },
			]);
			toast.success("Permission updated successfully");
		} catch (error) {
			// Revert the optimistic update on error
			setMembers(previousMembers);
			toast.error(
				`Failed to update permission${error ? `: ${error instanceof Error ? error.message : "Unknown error"}` : ""}`,
			);
			// TODO: Show error toast notification
		}
	};

	return (
		<ScrollArea className="h-full w-full">
			<div className="py-4">
				<div className="px-6 pb-2 text-muted-foreground">
					Who has access
				</div>
				{isLoading
					? // Loading skeleton
						Array.from({ length: rowsPerPage }).map((_, index) => (
							<div
								key={`skeleton-${
									// biome-ignore lint/suspicious/noArrayIndexKey: loading state
									index
								}`}
								className="flex items-center gap-3 rounded p-2 px-6"
							>
								<Skeleton className="h-12 w-12 rounded-md" />
								<div className="flex flex-1 flex-col gap-2">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-3 w-48" />
								</div>
								<Skeleton className="h-8 w-24" />
							</div>
						))
					: members.map((member) => {
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
									<Select
										value={member.permission}
										onValueChange={(newPermission) =>
											handlePermissionChange(
												member.id,
												newPermission,
											)
										}
									>
										<SelectTrigger size="sm">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="OWNER">
												Owner
											</SelectItem>
											<SelectItem value="EDIT">
												Editor
											</SelectItem>
											<SelectItem value="READ_ONLY">
												Read-only
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							);
						})}
			</div>
		</ScrollArea>
	);
};
