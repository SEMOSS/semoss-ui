import { ChevronsUpDown } from "lucide-react";
import { useEffect, useState } from "react";
import { getProjectUsersNoCredentials } from "@semoss/sdk";
import {
	Button,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@semoss/ui/next";

// Stopgap until a platform-wide user search exists: a global system project with no
// permission rows, so "users without access" is every user (and Graph when enabled).
const PEOPLE_PROJECT_ID = "user";

/** One exact account: userId plus provider is the identity. */
export interface Person {
	userId: string;
	provider: string;
	name?: string | null;
	email?: string | null;
}

function personLabel(person: Person): string {
	const { name, email, userId } = person;
	if (name && email && name.toLowerCase() !== email.toLowerCase())
		return `${name} (${email})`;
	return name || email || userId;
}

async function searchPeople(query: string): Promise<Person[]> {
	// The SDK puts the term into the URL as-is.
	const users = await getProjectUsersNoCredentials(
		PEOPLE_PROJECT_ID,
		false,
		encodeURIComponent(query),
		10,
		0,
	);
	return users.flatMap((user) =>
		user.id && user.type
			? [
					{
						userId: user.id,
						provider: user.type,
						name: user.name,
						email: user.email,
					},
				]
			: [],
	);
}

/** Pick one exact person; the agent's name or email hint seeds the search. */
export function PersonPicker({
	id,
	hint,
	value,
	disabled,
	onChange,
}: {
	id?: string;
	hint: string;
	value: Person | null;
	disabled?: boolean;
	onChange: (person: Person | null) => void;
}) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState(hint);
	const [people, setPeople] = useState<Person[]>([]);
	const [loading, setLoading] = useState(false);

	// Resolve the hint once: a single match is preselected, several open the list.
	// biome-ignore lint/correctness/useExhaustiveDependencies: runs for the initial hint only.
	useEffect(() => {
		if (value || !hint.trim()) return;
		let cancelled = false;
		searchPeople(hint.trim())
			.then((rows) => {
				if (cancelled) return;
				setPeople(rows);
				if (rows.length === 1) onChange(rows[0]);
				else setOpen(true);
			})
			.catch(() => !cancelled && setOpen(true));
		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		if (!open) return;
		const query = search.trim();
		if (!query) {
			setPeople([]);
			return;
		}
		let cancelled = false;
		setLoading(true);
		const timer = setTimeout(() => {
			searchPeople(query)
				.then((rows) => !cancelled && setPeople(rows))
				.catch(() => !cancelled && setPeople([]))
				.finally(() => !cancelled && setLoading(false));
		}, 200);
		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [open, search]);

	// Accounts that share an email are told apart by their sign-in provider.
	const sharedEmail = (person: Person) =>
		!!person.email &&
		people.filter(
			(p) => p.email?.toLowerCase() === person.email?.toLowerCase(),
		).length > 1;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					id={id}
					type="button"
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="justify-between font-normal"
					disabled={disabled}
				>
					<span className="truncate">
						{value ? (
							personLabel(value)
						) : (
							<span className="text-muted-foreground">
								{hint.trim()
									? `Choose who "${hint.trim()}" is`
									: "Choose a person"}
							</span>
						)}
					</span>
					<ChevronsUpDown
						aria-hidden="true"
						className="size-3.5 shrink-0 opacity-50"
					/>
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-80 p-0">
				<Command shouldFilter={false}>
					<CommandInput
						placeholder="Search by name, email, or username"
						value={search}
						onValueChange={setSearch}
					/>
					<CommandList>
						<CommandEmpty>
							{loading
								? "Searching..."
								: search.trim()
									? "No one found"
									: "Type a name or email"}
						</CommandEmpty>
						<CommandGroup>
							{people.map((person) => (
								<CommandItem
									key={`${person.provider}:${person.userId}`}
									value={`${person.provider}:${person.userId}`}
									onSelect={() => {
										onChange(person);
										setOpen(false);
									}}
								>
									<div className="flex min-w-0 flex-col">
										<span className="truncate text-sm">
											{person.name || person.userId}
										</span>
										<span className="truncate text-muted-foreground text-xs">
											{person.email || person.userId}
											{sharedEmail(person) &&
												` - ${person.provider}`}
										</span>
									</div>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
