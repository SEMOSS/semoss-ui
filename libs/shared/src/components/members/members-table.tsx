import { ChevronDown, LockOpen, Plus, Search } from "lucide-react";
import { useState } from "react";
import {
	Button,
	DropdownMenu,
	DropdownMenuTrigger,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	// Muted,
} from "@semoss/ui/next";
import { AddMembersOverlay } from "./add-members";
import { MembersList } from "./members-list";

interface MembersProps {
	id: string;
	type:
		| "PROJECT"
		| "ENGINE"
		| "DATABASE"
		| "STORAGE"
		| "MODEL"
		| "VECTOR"
		| "FUNCTION";
}

export const MembersTable = ({ id, type }: MembersProps) => {
	const [openAddMembers, setOpenAddMembers] = useState<boolean>(false);

	return (
		<div className="w-full">
			{/* Header Section */}
			<div className="flex flex-column gap-[10px] rounded-xl rounded-br-none rounded-bl-none border-gray-200 border-b bg-[#f4f4f4] p-4 align-start">
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
						onClick={() => setOpenAddMembers(true)}
					>
						<div className="flex flex-column items-center gap-2">
							<Plus />
							<span>Add Members</span>
						</div>
					</Button>
				</div>
			</div>
			{/* Members List Section */}
			<MembersList id={id} type={type} refreshList={!openAddMembers} />
			<AddMembersOverlay
				className="w-full"
				id={id}
				type={type}
				open={openAddMembers}
				onClose={() => setOpenAddMembers(false)}
			/>
		</div>
	);
};
