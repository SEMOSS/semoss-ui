import { Search } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import {
	Button,
	cn,
	H3,
	H4,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	P,
	Small,
	Spinner,
} from "@semoss/ui/next";
import { givenFirst } from "@/lib/person-name";
import { PersonAvatar } from "./person-avatar";

/** The popover box the people picker sits in. */
export const peoplePickerContentClassName =
	"flex max-h-(--radix-popover-content-available-height) w-96 max-w-(--radix-popover-content-available-width) flex-col overflow-hidden rounded-xl p-0";

// a coarse pointer gets a 44px target in this dense list
export const peoplePickerRowButtonClassName = "pointer-coarse:min-h-11";

export interface PickerPerson {
	id: string;
	name: string;
	initials?: string;
	email?: string | null;
	/** One short line under the name, such as a title or how often they appear. */
	detail?: string;
}

interface PeoplePickerPanelProps {
	/** Prefix for the title, description and group ids. */
	fieldId: string;
	title: string;
	description?: string;
	query: string;
	onQuery: (query: string) => void;
	searchRef?: RefObject<HTMLInputElement | null>;
	/** Heading over the list before a search. */
	groupLabel: string;
	people: PickerPerson[];
	/** The row's buttons, such as Add or Ignore. */
	actions: (person: PickerPerson) => ReactNode;
	isSearching?: boolean;
	/** Shown when there is no search and no one to suggest. */
	emptyText: string;
	/** How many more matched than are listed. */
	hiddenCount?: number;
	status?: string;
}

/** Search plus a list of people with photos and per-row actions; the content of a people popover. */
export function PeoplePickerPanel({
	fieldId,
	title,
	description,
	query,
	onQuery,
	searchRef,
	groupLabel,
	people,
	actions,
	isSearching = false,
	emptyText,
	hiddenCount = 0,
	status = "",
}: PeoplePickerPanelProps) {
	const text = query.trim();
	return (
		<>
			<div className="shrink-0 space-y-4 p-5 pb-3">
				<div className="space-y-1">
					<H3 id={`${fieldId}-title`} className="font-bold text-lg">
						{title}
					</H3>
					{description && (
						<P
							id={`${fieldId}-description`}
							className="text-muted-foreground text-sm leading-relaxed"
						>
							{description}
						</P>
					)}
				</div>
				<InputGroup>
					<InputGroupAddon>
						{isSearching ? (
							<Spinner className="size-4" />
						) : (
							<Search aria-hidden="true" />
						)}
					</InputGroupAddon>
					<InputGroupInput
						ref={searchRef}
						type="search"
						aria-label="Search people by name or email"
						placeholder="Search by name or email"
						value={query}
						onChange={(event) => onQuery(event.target.value)}
					/>
				</InputGroup>
			</div>
			<div className="min-h-0 flex-1 overflow-y-auto pb-2 sm:max-h-80">
				{!text && people.length > 0 && (
					<H4
						id={`${fieldId}-group`}
						className="px-5 pt-1 pb-1 font-medium text-muted-foreground text-xs"
					>
						{groupLabel}
					</H4>
				)}
				{people.length > 0 && (
					<ul
						aria-label={text ? "Matching people" : undefined}
						aria-labelledby={text ? undefined : `${fieldId}-group`}
					>
						{people.map((person) => (
							<li
								key={person.id}
								className="flex items-center gap-3 px-5 py-2"
							>
								<PersonAvatar
									name={person.name}
									initials={person.initials}
									email={person.email}
								/>
								<div className="min-w-0 flex-1">
									<P className="break-words font-medium text-sm leading-5">
										{givenFirst(person.name)}
									</P>
									{person.detail && (
										<Small className="block break-words font-normal text-muted-foreground text-xs leading-5">
											{person.detail}
										</Small>
									)}
								</div>
								<div className="flex shrink-0 items-center gap-1">
									{actions(person)}
								</div>
							</li>
						))}
					</ul>
				)}
				{people.length === 0 &&
					!isSearching &&
					(text ? (
						<div className="space-y-2 px-5 py-3">
							<P className="text-muted-foreground text-sm">
								No one matches "{text}".
							</P>
							<Button
								variant="outline"
								size="sm"
								className={peoplePickerRowButtonClassName}
								onClick={() => {
									onQuery("");
									searchRef?.current?.focus();
								}}
							>
								Clear search
							</Button>
						</div>
					) : (
						<P className="px-5 py-3 text-muted-foreground text-sm">
							{emptyText}
						</P>
					))}
				{hiddenCount > 0 && text && (
					<Small className="block px-5 pt-2 font-normal text-muted-foreground text-xs">
						Showing {people.length} of {people.length + hiddenCount}
						. Keep typing to narrow it down.
					</Small>
				)}
			</div>
			<output
				className={cn(
					"block shrink-0 border-t bg-muted/40 px-5 py-3 text-muted-foreground text-sm",
					!status && "sr-only",
				)}
			>
				{status}
			</output>
		</>
	);
}
