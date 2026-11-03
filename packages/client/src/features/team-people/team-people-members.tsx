import { Search } from "lucide-react";
import { useCallback, useState } from "react";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Spinner,
	useDebouncedValue,
} from "@semoss/ui/next";
import {
	type GroupAccessTarget,
	getTeamUsers,
	getTeamUsersCount,
	type TeamMember,
	toTeamMembers,
} from "@/api/teams";
import { TablePagination } from "@/components/ui/table-pagination/table-pagination";
import { AccessIdentity } from "@/features/bulk-access-management/access-identity";
import { usePagedList } from "@/hooks/use-paged-list";

/** Members shown per page; the sheet is narrow, so pages are short */
const ROWS_PER_PAGE_OPTIONS = [25, 50, 100];

export interface TeamPeopleMembersProps {
	/** The custom team */
	groupId: string;
	/** The project or engine the members are read through */
	target: GroupAccessTarget;
	/** Whether to read them as an admin, in admin mode, instead of through the target */
	admin?: boolean;
}

/**
 * A custom team's members, searchable and paged, read through a project or
 * engine: its owners see who a team would give access to before they give it
 * access, and its editors see them once the team can use it. In admin mode an
 * admin reads them directly.
 */
export const TeamPeopleMembers = ({
	groupId,
	target,
	admin = false,
}: TeamPeopleMembersProps) => {
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search.trim(), 300);
	const { resource, resourceId } = target;

	const loadPage = useCallback(
		async (limit: number, offset: number): Promise<TeamMember[]> =>
			toTeamMembers(
				await getTeamUsers(
					groupId,
					limit,
					offset,
					debouncedSearch,
					admin,
					admin ? undefined : { resource, resourceId },
				),
			),
		[groupId, debouncedSearch, admin, resource, resourceId],
	);
	const countRows = useCallback(
		async (): Promise<number> =>
			Number(
				await getTeamUsersCount(
					groupId,
					debouncedSearch || undefined,
					admin,
					admin ? undefined : { resource, resourceId },
				),
			) || 0,
		[groupId, debouncedSearch, admin, resource, resourceId],
	);
	const { rows, totalCount, isLoading, error, pagination } = usePagedList({
		loadPage,
		countRows,
		initialRowsPerPage: ROWS_PER_PAGE_OPTIONS[0],
		errorMessage: "Could not load the team's members",
	});

	return (
		<div className="flex flex-col gap-3">
			<InputGroup>
				<InputGroupAddon>
					<Search className="size-4" aria-hidden />
				</InputGroupAddon>
				<InputGroupInput
					aria-label="Search members"
					placeholder="Search members"
					value={search}
					onChange={(e) => {
						setSearch(e.target.value);
						pagination.resetPage();
					}}
				/>
			</InputGroup>
			{error ? (
				<p role="alert" className="text-destructive text-sm">
					{error}
				</p>
			) : null}
			{isLoading && rows.length === 0 ? (
				<div className="flex items-center justify-center gap-2 py-6 text-muted-foreground text-sm">
					<Spinner className="size-4" />
					Loading members...
				</div>
			) : rows.length === 0 ? (
				// a failed read says why above, not that the team is empty
				error ? null : (
					<p className="py-6 text-center text-muted-foreground text-sm">
						{debouncedSearch
							? "No members match this search"
							: "This team has no members yet"}
					</p>
				)
			) : (
				<ul className="flex flex-col divide-y divide-border rounded-md border border-border">
					{rows.map((member) => (
						<li
							key={`${member.type}:${member.userId}`}
							className="px-3 py-2"
						>
							<AccessIdentity
								category="USER"
								type={member.type}
								name={
									member.name || member.email || member.userId
								}
								id={member.userId}
								email={member.email}
							/>
						</li>
					))}
				</ul>
			)}
			{totalCount > ROWS_PER_PAGE_OPTIONS[0] ? (
				<TablePagination
					startRow={pagination.startRow}
					endRow={pagination.endRow}
					totalCount={totalCount}
					page={pagination.page}
					totalPages={pagination.totalPages}
					rowsPerPage={pagination.rowsPerPage}
					onPageChange={pagination.setPage}
					onRowsPerPageChange={pagination.setRowsPerPage}
					rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
					disabled={isLoading}
				/>
			) : null}
		</div>
	);
};
