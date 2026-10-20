import type { ComponentProps } from "react";
import {
	cn,
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { ALL_OPERATIONS, OPERATION_GROUPS } from "./sql-query-policy";

/** Props for {@link SqlOperationSelect}. */
export interface SqlOperationSelectProps
	extends Omit<ComponentProps<typeof SelectTrigger>, "children"> {
	/** The operation, group or * the rule applies to; empty when none is chosen. */
	value: string;
	/** Called with the operation, group or * chosen. */
	onValueChange: (value: string) => void;
	/** Whether the picker is locked, as it is while the form saves. */
	disabled?: boolean;
}

/**
 * Picks what an operation rule applies to: every operation (*), a group, or
 * one operation, listed by group. A group whose one operation shares its name
 * is listed once. Other props, such as the ref the form focuses on a problem,
 * go to the picker's button.
 */
export const SqlOperationSelect = ({
	value,
	onValueChange,
	disabled = false,
	className,
	...triggerProps
}: SqlOperationSelectProps) => (
	<Select value={value} onValueChange={onValueChange} disabled={disabled}>
		<SelectTrigger {...triggerProps} className={cn("w-full", className)}>
			<SelectValue placeholder="Choose an operation" />
		</SelectTrigger>
		<SelectContent>
			<SelectItem value={ALL_OPERATIONS}>Every operation (*)</SelectItem>
			{OPERATION_GROUPS.map((group) => (
				<SelectGroup key={group.name}>
					<SelectSeparator />
					<SelectLabel>{group.name}</SelectLabel>
					{group.operations.some(
						(operation) => operation !== group.name,
					) && (
						<SelectItem value={group.name}>
							Every {group.name} operation
						</SelectItem>
					)}
					{group.operations.map((operation) => (
						<SelectItem key={operation} value={operation}>
							{operation}
						</SelectItem>
					))}
				</SelectGroup>
			))}
		</SelectContent>
	</Select>
);
