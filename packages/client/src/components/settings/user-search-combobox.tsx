import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "@semoss/sdk/react";
import {
	Avatar,
	AvatarFallback,
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
	Spinner,
} from "@semoss/ui/next";
import { type AdminUser, searchAllUsers } from "@/api/auth";

interface UserSearchComboboxProps {
	value: AdminUser | null;
	onChange: (user: AdminUser | null) => void;
	placeholder?: string;
	disabled?: boolean;
	excludeIds?: string[];
	"data-testid"?: string;
}

export const UserSearchCombobox = ({
	value,
	onChange,
	placeholder = "Search users...",
	disabled = false,
	excludeIds = [],
	"data-testid": testId,
}: UserSearchComboboxProps) => {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [loading, setLoading] = useState(false);

	const debouncedSearch = useDebouncedValue(search);
	const excludeSet = useMemo(() => new Set(excludeIds), [excludeIds]);

	useEffect(() => {
		if (!open) return;
		setLoading(true);
		searchAllUsers(debouncedSearch, 10, 0)
			.then((results) =>
				setUsers(results.filter((u) => !excludeSet.has(u.id))),
			)
			.catch(() => setUsers([]))
			.finally(() => setLoading(false));
	}, [open, debouncedSearch, excludeSet]);

	const initials = (name: string) =>
		name
			.split(" ")
			.map((w) => w[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					disabled={disabled}
					className="w-full justify-between font-normal"
					data-testid={testId ?? "user-search-trigger"}
				>
					{value ? (
						<span className="flex items-center gap-2 truncate">
							<Avatar className="size-5 shrink-0 text-xs">
								<AvatarFallback>
									{initials(value.name || value.id)}
								</AvatarFallback>
							</Avatar>
							<span className="truncate">
								{value.name || value.id}
							</span>
						</span>
					) : (
						<span className="text-muted-foreground">
							{placeholder}
						</span>
					)}
					<ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
				<Command shouldFilter={false}>
					<CommandInput
						placeholder="Search by name or email..."
						value={search}
						onValueChange={setSearch}
						data-testid="user-search-input"
					/>
					<CommandList className="max-h-60">
						{loading ? (
							<div className="flex items-center justify-center p-4">
								<Spinner />
							</div>
						) : (
							<>
								<CommandEmpty>No users found.</CommandEmpty>
								<CommandGroup>
									{users.map((u) => (
										<CommandItem
											key={u.id}
											onSelect={() => {
												onChange(
													u.id === value?.id
														? null
														: u,
												);
												setOpen(false);
											}}
											className="gap-2"
										>
											<Avatar className="size-6 shrink-0 text-xs">
												<AvatarFallback>
													{initials(u.name || u.id)}
												</AvatarFallback>
											</Avatar>
											<div className="flex min-w-0 flex-col">
												<span className="truncate text-sm">
													{u.name ||
														u.username ||
														u.id}
												</span>
												{u.email && (
													<span className="truncate text-muted-foreground text-xs">
														{u.email}
													</span>
												)}
											</div>
											{value?.id === u.id && (
												<Check className="ml-auto size-4 shrink-0" />
											)}
										</CommandItem>
									))}
								</CommandGroup>
							</>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
};
