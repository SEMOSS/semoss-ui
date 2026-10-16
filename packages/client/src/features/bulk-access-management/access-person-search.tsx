import { Check, ChevronDown, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import {
	type AccessPerson,
	searchForUser,
	type UserSearchResult,
} from "@semoss/sdk";
import { useIteratorApi } from "@semoss/sdk/react";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Spinner,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { AccessIdentity } from "./access-identity";

/** People read per page of the app's people */
const PAGE_SIZE = 25;

/** People shown from the organization's directory */
const DIRECTORY_LIMIT = 20;

/** Shortest search sent to the directory, which lists everyone for an empty one */
const MIN_DIRECTORY_SEARCH = 2;

/** A section's heading */
const SECTION_TITLE_CLASS =
	"flex w-fit items-center gap-1.5 text-start font-medium text-sm";

/** A status line inside a list */
const STATUS_CLASS =
	"flex items-center justify-center gap-2 px-3 py-4 text-center text-muted-foreground text-sm";

/** What the directory search found */
interface DirectoryResults {
	/** The people, or empty */
	people: AccessPerson[];
	/** Why the search failed, or null */
	error: string | null;
}

const NO_RESULTS: DirectoryResults = { people: [], error: null };

/**
 * @param result - a search result
 * @returns the person, or null when the result has no login type to add them with
 */
const toPerson = (result: UserSearchResult): AccessPerson | null =>
	result.type
		? {
				category: "USER",
				id: result.id,
				type: result.type,
				name: result.name,
				email: result.email,
			}
		: null;

export interface AccessPersonSearchProps {
	/** Whether the organization's Microsoft directory can be searched too */
	isDirectoryAvailable: boolean;
	/** Whether the changes already list a person, so they cannot be added twice */
	isStaged: (person: AccessPerson) => boolean;
	/** Called with the person to add */
	onAdd: (person: AccessPerson) => void;
	/** Disables adding, such as when only admins can give access */
	disabled?: boolean;
}

/**
 * Finds people to add to a permission batch. Existing users are listed from the start, and
 * more load as the list scrolls; a search narrows them. Either section can be
 * collapsed to give the other more room. Each shows the login
 * they use, since two people can share an id on different logins.
 * When the directory is available, the same search also looks through the
 * whole organization, shown under its own heading.
 */
export const AccessPersonSearch = ({
	isDirectoryAvailable,
	isStaged,
	onAdd,
	disabled = false,
}: AccessPersonSearchProps) => {
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search.trim(), 300);
	const [existingError, setExistingError] = useState<string | null>(null);
	const [directory, setDirectory] = useState<DirectoryResults>(NO_RESULTS);
	const [isSearchingDirectory, setIsSearchingDirectory] = useState(false);
	// collapsing one section gives its room to the other
	const [isExistingOpen, setIsExistingOpen] = useState(true);
	const [isDirectoryOpen, setIsDirectoryOpen] = useState(true);
	const isDirectorySearch =
		isDirectoryAvailable && debouncedSearch.length >= MIN_DIRECTORY_SEARCH;

	// the app's people, from the first page, narrowed by the search; a page keeps
	// the people with no login type, so a full page still reads the next one
	const existing = useIteratorApi<AccessPerson | null>(
		async (limit, offset) => {
			try {
				const results = await searchForUser(debouncedSearch, {
					limit,
					offset,
					msGraphLookup: false,
				});
				setExistingError(null);
				return results.map(toPerson);
			} catch (e) {
				setExistingError(getErrorMessage(e, "Could not load people"));
				throw e;
			}
		},
		{ limit: PAGE_SIZE },
		[debouncedSearch],
	);
	// people with no login type cannot be added
	const existingPeople = existing.data.flatMap((person) =>
		person ? [person] : [],
	);
	const { setScroll } = useInfiniteScroll({
		disabled: existing.isLoading || !existing.hasMore,
		onNext: existing.next,
	});

	useEffect(() => {
		if (!isDirectorySearch) {
			setDirectory(NO_RESULTS);
			setIsSearchingDirectory(false);
			return;
		}
		let isStale = false;
		setIsSearchingDirectory(true);
		searchForUser(debouncedSearch, {
			limit: DIRECTORY_LIMIT,
			msGraphLookup: true,
		})
			.then((results) => {
				if (!isStale) {
					setDirectory({
						people: results.flatMap(
							(result) => toPerson(result) ?? [],
						),
						error: null,
					});
				}
			})
			.catch((e: unknown) => {
				if (!isStale) {
					setDirectory({
						people: [],
						error: getErrorMessage(e, "The search did not finish"),
					});
				}
			})
			.finally(() => {
				if (!isStale) {
					setIsSearchingDirectory(false);
				}
			});
		return () => {
			isStale = true;
		};
	}, [debouncedSearch, isDirectorySearch]);

	/** One person, with Add, or a note that they are already listed */
	const renderPerson = (person: AccessPerson) => {
		const isListed = isStaged(person);
		const label = person.name || person.email || person.id;
		return (
			<li
				key={`${person.type}:${person.id}`}
				className="flex items-center justify-between gap-3 rounded-md border bg-muted/40 px-3 py-2"
			>
				<AccessIdentity
					category="USER"
					type={person.type}
					name={label}
					id={person.id}
					email={person.email !== label ? person.email : null}
					compact
				/>
				{isListed ? (
					<span className="flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
						<Check className="size-4" aria-hidden />
						In the List
					</span>
				) : (
					<Button
						type="button"
						size="sm"
						variant="outline"
						disabled={disabled}
						aria-label={`Add ${label}`}
						onClick={() => onAdd(person)}
					>
						<Plus className="size-4" aria-hidden />
						Add
					</Button>
				)}
			</li>
		);
	};

	return (
		<div className="flex flex-col gap-4">
			<InputGroup>
				<InputGroupAddon>
					<Search className="size-4" aria-hidden />
				</InputGroupAddon>
				<InputGroupInput
					aria-label="Search people by name or email"
					placeholder="Search people by name or email"
					value={search}
					disabled={disabled}
					onChange={(e) => setSearch(e.target.value)}
				/>
			</InputGroup>

			<Collapsible
				open={isExistingOpen}
				onOpenChange={setIsExistingOpen}
				className="flex flex-col gap-2"
			>
				<CollapsibleTrigger asChild>
					<button type="button" className={SECTION_TITLE_CLASS}>
						<ChevronDown
							className={cn(
								"size-4 shrink-0 transition-transform",
								!isExistingOpen && "-rotate-90",
							)}
							aria-hidden
						/>
						Existing Users
					</button>
				</CollapsibleTrigger>
				<CollapsibleContent className="flex flex-col gap-2">
					{existingError ? (
						<p role="alert" className="text-destructive text-sm">
							{existingError}
						</p>
					) : null}
					{/* a plain scrolling box, so long rows shrink to fit instead of overflowing */}
					<div
						ref={setScroll}
						className={cn(
							"overflow-y-auto rounded-md border bg-background",
							// the list takes the room the organization's section leaves
							isDirectoryAvailable && isDirectoryOpen
								? "h-56"
								: "h-96",
						)}
					>
						<ul
							className="flex flex-col gap-1.5 p-2"
							aria-busy={existing.isLoading}
						>
							{existing.isLoading &&
							existingPeople.length === 0 ? (
								<li className={STATUS_CLASS}>
									<Spinner className="size-4" />
									Loading people...
								</li>
							) : existingPeople.length === 0 ? (
								<li className={STATUS_CLASS}>
									{debouncedSearch
										? "No existing users match"
										: "No people yet"}
								</li>
							) : (
								existingPeople.map(renderPerson)
							)}
							{existing.isLoading && existingPeople.length > 0 ? (
								<li className={STATUS_CLASS}>
									<Spinner className="size-4" />
									Loading more...
								</li>
							) : null}
						</ul>
					</div>
				</CollapsibleContent>
			</Collapsible>

			{isDirectoryAvailable ? (
				<Collapsible
					open={isDirectoryOpen}
					onOpenChange={setIsDirectoryOpen}
					className="flex flex-col gap-2"
				>
					<CollapsibleTrigger asChild>
						<button type="button" className={SECTION_TITLE_CLASS}>
							<ChevronDown
								className={cn(
									"size-4 shrink-0 transition-transform",
									!isDirectoryOpen && "-rotate-90",
								)}
								aria-hidden
							/>
							Your Organization
						</button>
					</CollapsibleTrigger>
					<CollapsibleContent className="flex flex-col gap-2">
						{!isDirectorySearch ? (
							<p className="text-muted-foreground text-sm">
								Type at least {MIN_DIRECTORY_SEARCH} letters to
								search everyone in your organization.
							</p>
						) : directory.error ? (
							<p
								role="alert"
								className="text-destructive text-sm"
							>
								{directory.error}
							</p>
						) : isSearchingDirectory &&
							directory.people.length === 0 ? (
							// set like the section's other lines, so it does not jump as the results come
							<p className="flex items-center gap-2 text-muted-foreground text-sm">
								<Spinner className="size-4" />
								Searching...
							</p>
						) : directory.people.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								No one in your organization matches
							</p>
						) : (
							<ul
								className={cn(
									"flex flex-col gap-1.5 overflow-y-auto",
									// the results take the room the existing users leave
									isExistingOpen ? "max-h-48" : "max-h-96",
								)}
							>
								{directory.people.map(renderPerson)}
							</ul>
						)}
					</CollapsibleContent>
				</Collapsible>
			) : null}
		</div>
	);
};
