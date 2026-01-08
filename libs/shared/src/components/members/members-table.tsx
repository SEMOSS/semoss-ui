import { ChevronDown, LockOpen, Plus, Search, UserRound } from "lucide-react";
import { observer } from "mobx-react-lite";
// import { useState } from "react";
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuTrigger,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	// Muted,
} from "@semoss/ui/next";

export const MembersTable = observer(() => {
	/*const [userData, setUserData] = useState<Array<any>>(["test"]);

	if (userData.length === 0) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Muted>No members found</Muted>
			</div>
		);
	}*/
	return (
		<div>
			{/* Header Section */}
			<div className="flex flex-column gap-[10px] border-gray-200 border-b bg-[#f4f4f4] p-4 align-start">
				<div className="flex h-[36px] w-full flex-column gap-2">
					<InputGroup className="flex h-auto gap-1 self-stretch bg-[#FFF] px-2 py-1 align-center">
						<InputGroupInput placeholder="Search" />
						<InputGroupAddon>
							<Search />
						</InputGroupAddon>
					</InputGroup>
					<DropdownMenu>
						<DropdownMenuTrigger
							asChild
							className="flex h-auto items-center px-2.5 py-2"
						>
							<Button variant="outline" size="sm">
								<div className="flex flex-column items-center gap-2">
									<LockOpen />
									<span>Permissions</span>
									<ChevronDown />
								</div>
							</Button>
						</DropdownMenuTrigger>
					</DropdownMenu>
					<Button
						size="sm"
						className="flex h-auto flex-column gap-2 align-center"
					>
						<div className="flex flex-column items-center gap-2">
							<Plus />
							<span>Add Members</span>
						</div>
					</Button>
				</div>
			</div>
			{/* Members List Section */}
			<div className="flex w-full flex-column gap-2">
				<Card className="w-full gap-2 rounded-none p-4">
					<CardHeader className="px-2 py-0">
						<span className="font-geist font-medium text-muted-foreground text-neutral-500 text-sm leading-[20px]">
							Who has access
						</span>
					</CardHeader>
					<CardContent className="px-2 py-0">
						<div className="flex flex-column items-center gap-2">
							{/* <img
								className="h-16 w-16 text-neutral-300"
								src={""}
                                alt="User"
							/> */}
							<UserRound />
							<span className="flex w-full flex-col overflow-hidden font-geist">
								<span className="flex font-semibold font-style-normal text-accent-foreground text-sm">
									Liam Carter
								</span>
								<span className="flex font-normal font-style-normal text-muted-foreground text-xs">
									icarter@deloitte.com
								</span>
							</span>
							<DropdownMenu>
								<DropdownMenuTrigger
									asChild
									className="flex h-auto items-center"
								>
									<Button variant="outline" size="default">
										<div className="flex flex-column items-center gap-2">
											can view <ChevronDown />
										</div>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<DropdownMenuRadioGroup>
										<DropdownMenuCheckboxItem>
											can view
										</DropdownMenuCheckboxItem>
										<DropdownMenuCheckboxItem>
											can edit
										</DropdownMenuCheckboxItem>
										<DropdownMenuCheckboxItem>
											Remove
										</DropdownMenuCheckboxItem>
									</DropdownMenuRadioGroup>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
});
