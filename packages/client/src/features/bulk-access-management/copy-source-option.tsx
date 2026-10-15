import {
	Badge,
	cn,
	Field,
	FieldContent,
	FieldDescription,
	FieldLabel,
	FieldTitle,
	RadioGroupItem,
	Spinner,
} from "@semoss/ui/next";
import { type CopySource, canCopyFrom } from "./use-team-people-to-copy";

export interface CopySourceOptionProps {
	/** One of the chosen team's lists */
	source: CopySource;
	/** The id of its radio, unique in the dialog */
	id: string;
}

/**
 * One of the chosen team's lists, as a card to pick in Copy People From a
 * Team: how many people it holds and how many are new, or why it cannot be
 * copied from (empty, everyone already there, not readable, or the list being
 * changed), in which case it is disabled.
 */
export const CopySourceOption = ({ source, id }: CopySourceOptionProps) => {
	const isEnabled = canCopyFrom(source);
	const title = source.role === "MANAGERS" ? "Managers" : "Members";
	const total = source.rows.length;
	const fresh = source.newRows.length;

	let description: string;
	if (source.status === "LOADING") {
		description = `Reading its ${title.toLowerCase()}...`;
	} else if (source.status === "SAME_LIST") {
		description = "This is the list you are changing";
	} else if (source.status === "ERROR") {
		description = source.error ?? "Could not be read";
	} else if (total === 0) {
		description = `No one is in its ${title.toLowerCase()}`;
	} else if (fresh === 0) {
		description = "Everyone in it is already here";
	} else if (fresh === total) {
		description = `${fresh} ${fresh === 1 ? "person" : "people"} to add`;
	} else {
		description = `${fresh} of ${total} are new here`;
	}

	return (
		<FieldLabel
			htmlFor={id}
			className={cn(isEnabled ? "cursor-pointer" : "cursor-not-allowed")}
		>
			<Field orientation="horizontal" data-disabled={!isEnabled}>
				<FieldContent>
					<FieldTitle>
						{title}
						{source.status === "READY" ? (
							<Badge variant="secondary" className="font-normal">
								{total}
							</Badge>
						) : null}
					</FieldTitle>
					<FieldDescription className="flex items-center gap-1.5">
						{source.status === "LOADING" ? (
							<Spinner className="size-3" aria-hidden />
						) : null}
						{description}
					</FieldDescription>
				</FieldContent>
				<RadioGroupItem
					value={source.role}
					id={id}
					disabled={!isEnabled}
				/>
			</Field>
		</FieldLabel>
	);
};
