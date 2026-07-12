import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import {
	Badge,
	Button,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@semoss/ui/next";
import type { UserResourceAccess } from "@/api";
import type { Role } from "@/types";

/**
 * The permission levels an admin can assign, in priority order. Wire values
 * (OWNER/EDIT/READ_ONLY) are what the backend expects; labels mirror the
 * legacy BI app and the settings area's SETTINGS_ROLE.
 */
export const ACCESS_PERMISSIONS: { value: Role; label: string }[] = [
	{ value: "OWNER", label: "Author" },
	{ value: "EDIT", label: "Editor" },
	{ value: "READ_ONLY", label: "Read-Only" },
];

export const permissionLabel = (permission: string): string =>
	ACCESS_PERMISSIONS.find((option) => option.value === permission)?.label ??
	permission;

export interface UserAccessTableProps {
	/** Resources the selected user currently has access to */
	rows: UserResourceAccess[];
	/** Show a Type column (used for engines) */
	showType?: boolean;
	/** Loading state for the initial fetch */
	loading?: boolean;
	/** Disable controls while a mutation is in-flight */
	busy?: boolean;
	/** Optional leading logo/icon for each row */
	renderIcon?: (row: UserResourceAccess) => ReactNode;
	/** Change a resource's permission level */
	onEdit: (row: UserResourceAccess, permission: Role) => void;
	/** Revoke access to a resource */
	onRemove: (row: UserResourceAccess) => void;
	/** Message shown when the user has no access */
	emptyMessage?: string;
}

/**
 * Presentational table of the resources a single user can access, with an
 * inline permission selector and a remove action per row. The inverse of the
 * resource-centric MembersTable.
 */
export const UserAccessTable = ({
	rows,
	showType = false,
	loading = false,
	busy = false,
	renderIcon,
	onEdit,
	onRemove,
	emptyMessage = "No access",
}: UserAccessTableProps) => {
	const columnCount = showType ? 4 : 3;

	return (
		<div className="rounded-md border border-border/60">
			<Table className="[&_td]:py-1.5 [&_th]:h-9">
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						{showType ? <TableHead>Type</TableHead> : null}
						<TableHead className="w-[160px]">Permission</TableHead>
						<TableHead className="w-[80px] text-right">
							Actions
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{loading ? (
						<TableRow>
							<TableCell colSpan={columnCount}>
								<div className="flex h-24 items-center justify-center">
									<Spinner className="size-5" />
								</div>
							</TableCell>
						</TableRow>
					) : rows.length === 0 ? (
						<TableRow>
							<TableCell
								colSpan={columnCount}
								className="h-24 text-center text-muted-foreground text-sm"
							>
								{emptyMessage}
							</TableCell>
						</TableRow>
					) : (
						rows.map((row) => (
							<TableRow key={row.id}>
								<TableCell>
									<div className="flex items-center gap-2">
										{renderIcon ? (
											<span className="flex size-8 shrink-0 items-center justify-center overflow-hidden">
												{renderIcon(row)}
											</span>
										) : null}
										<div className="flex min-w-0 flex-col leading-tight">
											<span className="max-w-[280px] truncate font-medium">
												{row.name || row.id}
											</span>
											<span className="text-muted-foreground text-xs">
												id: {row.id}
											</span>
										</div>
									</div>
								</TableCell>
								{showType ? (
									<TableCell>
										{row.type ? (
											<Badge
												variant="secondary"
												className="rounded-full"
											>
												{row.type}
											</Badge>
										) : (
											"—"
										)}
									</TableCell>
								) : null}
								<TableCell>
									<Select
										value={row.permission}
										disabled={busy}
										onValueChange={(value) =>
											onEdit(row, value as Role)
										}
									>
										<SelectTrigger className="h-8 w-[150px]">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{ACCESS_PERMISSIONS.map(
												(option) => (
													<SelectItem
														key={option.value}
														value={option.value}
													>
														{option.label}
													</SelectItem>
												),
											)}
										</SelectContent>
									</Select>
								</TableCell>
								<TableCell className="text-right">
									<Button
										variant="ghost"
										size="icon-sm"
										disabled={busy}
										aria-label={`Remove access to ${row.name || row.id}`}
										onClick={() => onRemove(row)}
									>
										<Trash2 className="size-4" />
									</Button>
								</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</div>
	);
};
