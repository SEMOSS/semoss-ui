import { Search, Trash2, Undo2 } from "lucide-react";
import { useState } from "react";
import type { AccessPerson, TeamRole } from "@semoss/sdk";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { TablePagination } from "@/components/ui/table-pagination/table-pagination";
import { AccessIdentity } from "@/features/bulk-access-management/access-identity";
import {
	getPersonName,
	getTeamPersonKey,
	type TeamPeopleEdits,
} from "./team-changes";
import { TEAM_ROLE_COPY } from "./team-role-copy";

/** People shown per page; most teams fit on one */
const PAGE_SIZE = 1000;

/** Someone in the list, or someone the changes add, as the list shows them */
interface PersonRow {
	/** Their key */
	key: string;
	/** The person */
	person: AccessPerson;
	/** Whether the changes add them, remove them, or leave them */
	status: "ADDED" | "REMOVED" | "UNCHANGED";
}

/**
 * @param people - the people in the list now
 * @param edits - the staged changes to the list
 * @returns the people the changes add, then the people in the list, each with what the changes do to them
 */
const getPersonRows = (
	people: AccessPerson[],
	edits: TeamPeopleEdits,
): PersonRow[] => [
	...[...edits.adds].map(([key, person]) => ({
		key,
		person,
		status: "ADDED" as const,
	})),
	...people.map((person) => {
		const key = getTeamPersonKey(person);
		return {
			key,
			person,
			status: edits.removals.has(key)
				? ("REMOVED" as const)
				: ("UNCHANGED" as const),
		};
	}),
];

export interface TeamRoleListProps {
	/** Which of the team's lists this is: its members or its managers */
	role: TeamRole;
	/** The people in the list now */
	people: AccessPerson[];
	/** The staged changes to the list */
	edits: TeamPeopleEdits;
	/** Whether the signed in user can change the list */
	canChange: boolean;
	/** Called with someone to remove from the list */
	onRemove: (person: AccessPerson) => void;
	/** Called with the key of a staged change to undo */
	onUndo: (key: string) => void;
}

/**
 * One of a team's lists, its members or its managers, with the people the
 * staged changes add and remove. The user removes people and undoes changes
 * here; nothing is saved until the changes are reviewed.
 */
export const TeamRoleList = ({
	role,
	people,
	edits,
	canChange,
	onRemove,
	onUndo,
}: TeamRoleListProps) => {
	const copy = TEAM_ROLE_COPY[role];
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(0);
	const normalizedSearch = search.trim().toLowerCase();
	const rows = getPersonRows(people, edits);
	const visible = rows.filter(
		(row) =>
			!normalizedSearch ||
			[row.person.id, row.person.name, row.person.email]
				.filter((value): value is string => typeof value === "string")
				.some((value) =>
					value.toLowerCase().includes(normalizedSearch),
				),
	);
	const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
	const currentPage = Math.min(page, totalPages - 1);
	const pageRows = visible.slice(
		currentPage * PAGE_SIZE,
		currentPage * PAGE_SIZE + PAGE_SIZE,
	);

	return (
		<Card className="w-full grow">
			<CardHeader>
				<CardTitle>{copy.title}</CardTitle>
				<CardDescription>{copy.description}</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				<InputGroup className="w-full sm:max-w-sm">
					<InputGroupAddon>
						<Search className="size-4" aria-hidden />
					</InputGroupAddon>
					<InputGroupInput
						aria-label={copy.searchLabel}
						placeholder={copy.searchLabel}
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(0);
						}}
					/>
				</InputGroup>
				{pageRows.length === 0 ? (
					<p className="py-6 text-center text-muted-foreground text-sm">
						{rows.length === 0 ? copy.emptyText : copy.noMatchText}
					</p>
				) : (
					<ul className="flex flex-col divide-y divide-border rounded-md border border-border">
						{pageRows.map((row) => {
							const name = getPersonName(row.person);
							return (
								<li
									key={row.key}
									className="flex items-center justify-between gap-3 px-3 py-2"
								>
									<AccessIdentity
										kind="USER"
										type={row.person.type}
										name={name}
										id={row.person.id}
										email={row.person.email}
										nameClassName={
											row.status === "REMOVED"
												? "text-muted-foreground line-through"
												: undefined
										}
									/>
									<div className="flex shrink-0 items-center gap-2">
										{row.status === "ADDED" ? (
											<Badge
												variant="outline"
												className="text-success"
											>
												Added
											</Badge>
										) : null}
										{row.status === "REMOVED" ? (
											<Badge
												variant="outline"
												className="text-destructive"
											>
												Removed
											</Badge>
										) : null}
										{row.status === "UNCHANGED" ? (
											canChange ? (
												<Tooltip>
													<TooltipTrigger asChild>
														<Button
															variant="ghost"
															size="icon-sm"
															aria-label={copy.getRemoveName(
																name,
															)}
															onClick={() =>
																onRemove(
																	row.person,
																)
															}
														>
															<Trash2
																className="size-4"
																aria-hidden
															/>
														</Button>
													</TooltipTrigger>
													<TooltipContent>
														{copy.removeLabel}
													</TooltipContent>
												</Tooltip>
											) : null
										) : (
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														variant="ghost"
														size="icon-sm"
														aria-label={`Undo the change for ${name}`}
														onClick={() =>
															onUndo(row.key)
														}
													>
														<Undo2
															className="size-4"
															aria-hidden
														/>
													</Button>
												</TooltipTrigger>
												<TooltipContent>
													Undo
												</TooltipContent>
											</Tooltip>
										)}
									</div>
								</li>
							);
						})}
					</ul>
				)}
				{visible.length > PAGE_SIZE ? (
					<TablePagination
						startRow={currentPage * PAGE_SIZE + 1}
						endRow={Math.min(
							(currentPage + 1) * PAGE_SIZE,
							visible.length,
						)}
						totalCount={visible.length}
						page={currentPage}
						totalPages={totalPages}
						rowsPerPage={PAGE_SIZE}
						onPageChange={setPage}
						onRowsPerPageChange={() => setPage(0)}
						rowsPerPageOptions={[PAGE_SIZE]}
					/>
				) : null}
			</CardContent>
		</Card>
	);
};
