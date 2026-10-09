import { type ChangeEvent, useState } from "react";
import { searchForUser, type UserSearchResult } from "@semoss/sdk";
import { useIteratorApi } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Avatar,
	AvatarFallback,
	cn,
	Input,
	ScrollArea,
	Spinner,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";

/** People fetched per page */
const PAGE_SIZE = 20;

/** Shortest search sent to the directory, which lists everyone for an empty one */
const MIN_SEARCH_LENGTH = 2;

/** Centered status line inside the results pane */
const STATUS_CLASS =
	"flex items-center justify-center gap-2 px-3 py-4 text-center text-muted-foreground text-sm";

/** The row style the shared add-members dialog uses, so the people pickers match */
const PERSON_ROW_CLASS =
	"flex w-full items-center justify-between gap-3 rounded-md border bg-muted/40 px-3 py-2 text-start hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-muted/40";

/**
 * The text a person is shown by: their name, then their email, then their id
 *
 * @param person - a search result
 * @returns the label for the person
 */
export const getPersonLabel = (person: UserSearchResult): string =>
	person.name || person.email || person.id;

export interface DirectoryPersonSearchProps {
	/** Called with the person the admin picks */
	onSelect: (person: UserSearchResult) => void;
	/** Classes for the wrapper */
	className?: string;
}

/**
 * Searches the organization's Microsoft directory by name or email so an admin
 * can pick one person to add. People who already have an account are listed
 * but cannot be picked.
 */
export const DirectoryPersonSearch = ({
	onSelect,
	className,
}: DirectoryPersonSearchProps) => {
	const [searchTerm, setSearchTerm] = useState("");
	const [error, setError] = useState<string | null>(null);
	const trimmedSearch = searchTerm.trim();
	const debouncedSearch = useDebouncedValue(trimmedSearch, 300);
	const isSearchReady = debouncedSearch.length >= MIN_SEARCH_LENGTH;
	const isDebouncePending = trimmedSearch !== debouncedSearch;

	const people = useIteratorApi<UserSearchResult>(
		async (limit, offset) => {
			try {
				const page = await searchForUser(debouncedSearch, {
					limit,
					offset,
					msGraphLookup: true,
				});
				setError(null);
				return page;
			} catch (e) {
				setError(
					getErrorMessage(
						e,
						"Could not search your organization. Try again.",
					),
				);
				throw e;
			}
		},
		{ enabled: isSearchReady, limit: PAGE_SIZE },
		[debouncedSearch],
	);

	const { setScroll } = useInfiniteScroll({
		disabled: !isSearchReady || people.isLoading || !people.hasMore,
		onNext: people.next,
	});

	const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value);
		setError(null);
	};

	return (
		<div className={cn("flex flex-col gap-3", className)}>
			<Input
				aria-label="Search your organization by name or email"
				placeholder="Search by name or email..."
				value={searchTerm}
				autoComplete="off"
				spellCheck={false}
				onChange={handleSearchChange}
			/>

			{error ? (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}

			<ScrollArea
				viewportRef={setScroll}
				className={cn(
					"h-72 rounded-md border bg-background transition-opacity",
					isDebouncePending && "opacity-60",
				)}
			>
				<div
					className="flex flex-col gap-1.5 p-2"
					aria-busy={people.isLoading}
				>
					{!isSearchReady ? (
						<p className={STATUS_CLASS}>
							Type a name or email to search your organization.
						</p>
					) : people.isLoading && people.data.length === 0 ? (
						<p className={STATUS_CLASS}>
							<Spinner />
							Searching your organization...
						</p>
					) : people.data.length === 0 ? (
						error ? null : (
							<output className={STATUS_CLASS}>
								No one in your organization matches that search.
							</output>
						)
					) : (
						<>
							{people.data.map((person) => {
								const label = getPersonLabel(person);
								return (
									<button
										key={person.id}
										type="button"
										disabled={person.hasAccount === true}
										className={PERSON_ROW_CLASS}
										onClick={() => onSelect(person)}
									>
										<span className="flex min-w-0 items-center gap-2">
											<Avatar className="size-8">
												<AvatarFallback className="text-muted-foreground text-sm">
													{label
														.charAt(0)
														.toUpperCase()}
												</AvatarFallback>
											</Avatar>
											<span className="flex min-w-0 flex-col">
												<span className="truncate font-medium text-sm">
													{label}
												</span>
												<span className="truncate text-muted-foreground text-xs">
													id: {person.id}
												</span>
												{person.email ? (
													<span className="truncate text-muted-foreground text-xs">
														email: {person.email}
													</span>
												) : null}
											</span>
										</span>
										{person.hasAccount ? (
											<span className="shrink-0 text-muted-foreground text-xs">
												Already a Member
											</span>
										) : null}
									</button>
								);
							})}
							{people.isLoading ? (
								<p className={STATUS_CLASS}>
									<Spinner />
									Loading more people...
								</p>
							) : null}
						</>
					)}
				</div>
			</ScrollArea>
		</div>
	);
};
