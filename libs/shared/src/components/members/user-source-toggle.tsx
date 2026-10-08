import { useId } from "react";
import { useTranslation } from "@semoss/i18n";
import { cn, ToggleGroup, ToggleGroupItem } from "@semoss/ui/next";

/**
 * Where a people search looks: people who already have an account, or the
 * organization's Microsoft directory
 */
export type UserSource = "existing" | "directory";

/** Narrows a toggle value to a source */
const isUserSource = (value: string): value is UserSource =>
	value === "existing" || value === "directory";

/** Lets a choice's label wrap instead of overflowing a narrow dialog */
const SOURCE_ITEM_CLASS = "h-auto min-h-9 flex-1 whitespace-normal py-1.5";

export interface UserSourceToggleProps {
	/** The selected source */
	value: UserSource;
	/** Called with the source the person picks */
	onValueChange: (value: UserSource) => void;
	/** Disables both choices */
	disabled?: boolean;
	/** Classes for the wrapper */
	className?: string;
}

/**
 * Lets a person choose between searching existing users and searching
 * everyone in their organization, with a line that explains the current
 * choice. Show it only when the server has the directory available.
 */
export const UserSourceToggle = ({
	value,
	onValueChange,
	disabled = false,
	className,
}: UserSourceToggleProps) => {
	const { t } = useTranslation("members");
	const labelId = useId();
	const hintId = useId();

	return (
		<div className={cn("flex flex-col gap-2", className)}>
			<span id={labelId} className="font-medium text-sm">
				{t("source.label")}
			</span>
			<ToggleGroup
				type="single"
				variant="outline"
				value={value}
				onValueChange={(next) => {
					// a single toggle group sends "" when the active item is
					// pressed again; keep the current choice
					if (isUserSource(next)) {
						onValueChange(next);
					}
				}}
				disabled={disabled}
				aria-labelledby={labelId}
				aria-describedby={hintId}
				className="w-full"
			>
				<ToggleGroupItem value="existing" className={SOURCE_ITEM_CLASS}>
					{t("source.existing")}
				</ToggleGroupItem>
				<ToggleGroupItem
					value="directory"
					className={SOURCE_ITEM_CLASS}
				>
					{t("source.directory")}
				</ToggleGroupItem>
			</ToggleGroup>
			<p id={hintId} className="text-muted-foreground text-xs">
				{value === "directory"
					? t("source.directoryHint")
					: t("source.existingHint")}
			</p>
		</div>
	);
};
