import { Search } from "lucide-react";
import { type ChangeEvent, useState } from "react";
import { searchForUser, type UserSearchResult } from "@semoss/sdk";
import { useIteratorApi } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Avatar,
	AvatarFallback,
	Badge,
	Button,
	cn,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
	ScrollArea,
	Spinner,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";

/** People fetched per page */
const PAGE_SIZE = 20;

/** Shortest search sent to the directory */
const MIN_SEARCH_LENGTH = 2;

/** Centered status line inside the results pane */
const STATUS_CLASS =
	"flex items-center justify-center gap-2 px-3 py-6 text-center text-muted-foreground text-sm";

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
 * can pick someone to add. People who already have an account are listed but
 * cannot be picked.
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

	const isFirstPageLoading = people.isLoading && people.data.length === 0;

	return (
		<div className={cn("flex flex-col gap-3", className)}>
			<InputGroup>
				<InputGroupAddon>
					<Search className="size-4" aria-hidden />
				</InputGroupAddon>
				<InputGroupInput
					aria-label="Search your organization by name or email"
					placeholder="Search by name or email"
					value={searchTerm}
					autoComplete="off"
					spellCheck={false}
					onChange={handleSearchChange}
				/>
			</InputGroup>

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
					className="flex flex-col gap-2 p-2"
					aria-busy={people.isLoading}
				>
					{!isSearchReady ? (
						<p className={STATUS_CLASS}>
							Type a name or email to find someone in your
							organization.
						</p>
					) : isFirstPageLoading ? (
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
						<ul className="flex flex-col gap-2">
							{people.data.map((person) => {
								const label = getPersonLabel(person);
								return (
									<li key={person.id}>
										<Item variant="outline" size="sm">
											<ItemMedia>
												<Avatar className="size-8">
													<AvatarFallback className="text-muted-foreground text-sm">
														{label
															.charAt(0)
															.toUpperCase()}
													</AvatarFallback>
												</Avatar>
											</ItemMedia>
											<ItemContent className="min-w-0">
												<ItemTitle className="block w-full truncate">
													{label}
												</ItemTitle>
												{person.email ? (
													<ItemDescription className="truncate">
														{person.email}
													</ItemDescription>
												) : null}
											</ItemContent>
											<ItemActions>
												{person.hasAccount ? (
													<Badge variant="secondary">
														Already a member
													</Badge>
												) : (
													<Button
														type="button"
														size="sm"
														variant="outline"
														aria-label={`Select ${label}`}
														onClick={() =>
															onSelect(person)
														}
													>
														Select
													</Button>
												)}
											</ItemActions>
										</Item>
									</li>
								);
							})}
							{people.isLoading ? (
								<li className={STATUS_CLASS}>
									<Spinner />
									Loading more people...
								</li>
							) : null}
						</ul>
					)}
				</div>
			</ScrollArea>
		</div>
	);
};
