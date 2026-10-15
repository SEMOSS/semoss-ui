import { SquareArrowOutUpRightIcon } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "@semoss/i18n";
import { Badge, Button, Checkbox, Label, Muted } from "@semoss/ui/next";
import type { MCP, MCPConfig } from "../../types";
import { getMcpTypeIcon } from "./mcp-utils";

interface MCPListItemProps {
	/** Catalog entry or an already selected room entry. */
	item: MCPConfig & { description?: string };
	/** Current selection. */
	isSelected: boolean;
	/** Selection is temporarily locked. */
	disabled?: boolean;
	/** Preserve catalog access information and links in compact pickers. */
	permission?:
		| MCP["permission"]
		| "REQUESTED"
		| "DISCOVERABLE"
		| "FULLY_PRIVATE";
	missingSubDependencies?: boolean;
	platformUrl?: string;
	/** Changes selection without executing the tool. */
	onToggle: () => void;
}

/** Compact, keyboard-accessible MCP selection with explicit ownership labels. */
export function MCPListItem({
	item,
	isSelected,
	disabled,
	permission,
	missingSubDependencies,
	platformUrl,
	onToggle,
}: MCPListItemProps) {
	const { t } = useTranslation(["mcp", "common"]);
	const id = useId();
	const Icon = getMcpTypeIcon(item.type);
	const isInherited =
		item.fromWorkspace || item.fromRoom || item.type === "ROOM";
	const permissionKey =
		permission === "OWNER"
			? "owner"
			: permission === "EDIT"
				? "editor"
				: permission === "READ_ONLY"
					? "readOnly"
					: permission === "REQUESTED"
						? "accessRequested"
						: permission === "DISCOVERABLE"
							? "requestAccess"
							: permission === "FULLY_PRIVATE"
								? "noAccess"
								: undefined;
	const accessMissing =
		permission === "REQUESTED" ||
		permission === "DISCOVERABLE" ||
		permission === "FULLY_PRIVATE";
	return (
		<div className="flex items-center gap-3 rounded-lg p-3 hover:bg-accent">
			<Icon
				aria-hidden="true"
				className="size-4 shrink-0 text-muted-foreground"
			/>
			<Label
				htmlFor={id}
				className="flex min-w-0 flex-1 cursor-pointer flex-col items-start gap-1"
			>
				<span className="break-words font-medium">{item.name}</span>
				{item.description && (
					<Muted className="line-clamp-2 text-xs">
						{item.description}
					</Muted>
				)}
				{isInherited && (
					<Badge variant="outline">
						{item.fromWorkspace
							? t("common:badges.fromAgent")
							: t("selector.fromRoom")}
					</Badge>
				)}
				{permissionKey && (
					<Muted
						className={
							accessMissing
								? "text-destructive text-xs"
								: "text-xs"
						}
					>
						{t(`permission.${permissionKey}`)}
					</Muted>
				)}
				{missingSubDependencies && (
					<Muted className="text-xs">
						{t("permission.tooltipMissingDependencies", {
							type: item.name,
						})}
					</Muted>
				)}
			</Label>
			{platformUrl && (
				<Button asChild variant="ghost" size="icon-sm">
					<a
						href={platformUrl}
						target="_blank"
						rel="noopener noreferrer"
						aria-label={t("permission.tooltipOpen", {
							type: item.name,
						})}
					>
						<SquareArrowOutUpRightIcon aria-hidden="true" />
					</a>
				</Button>
			)}
			<Checkbox
				id={id}
				checked={isSelected}
				disabled={disabled || isInherited}
				onCheckedChange={onToggle}
			/>
		</div>
	);
}
