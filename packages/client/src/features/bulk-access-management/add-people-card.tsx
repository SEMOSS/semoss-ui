import type { ReactNode } from "react";
import type { AccessPerson } from "@semoss/sdk";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	cn,
} from "@semoss/ui/next";
import { AccessPersonSearch } from "./access-person-search";
import {
	type BringInAccessItem,
	BringInAccessMenu,
} from "./bring-in-access-menu";

export interface AddPeopleCardProps {
	/** What adding people does here, under the title */
	description: string;
	/** The ways to bring access in from elsewhere, in the Bring In Access menu */
	menuItems: BringInAccessItem[];
	/** Whether the organization's Microsoft directory can be searched too */
	isDirectoryAvailable: boolean;
	/** Whether the changes already list a person, so they cannot be added twice */
	isStaged: (person: AccessPerson) => boolean;
	/** Called with the person to add */
	onAdd: (person: AccessPerson) => void;
	/** Disables adding people one by one */
	disabled?: boolean;
	/** Controls above the search, such as the level people are added with */
	children?: ReactNode;
	/** Classes for the card, such as its width */
	className?: string;
}

/**
 * The Add People card of Bulk Access Management: find people in the app and the organization
 * at the same time, or bring them in from elsewhere through the Bring In Access
 * menu.
 */
export const AddPeopleCard = ({
	description,
	menuItems,
	isDirectoryAvailable,
	isStaged,
	onAdd,
	disabled = false,
	children,
	className,
}: AddPeopleCardProps) => (
	<Card className={cn("w-full", className)}>
		<CardHeader>
			{/* the title and the menu share one centered row; the description runs under both */}
			<div className="flex items-center justify-between gap-2">
				<CardTitle>Add People</CardTitle>
				<BringInAccessMenu items={menuItems} />
			</div>
			<CardDescription>{description}</CardDescription>
		</CardHeader>
		<CardContent className="flex flex-col gap-4">
			{children}
			<AccessPersonSearch
				isDirectoryAvailable={isDirectoryAvailable}
				isStaged={isStaged}
				onAdd={onAdd}
				disabled={disabled}
			/>
		</CardContent>
	</Card>
);
