import { ChevronDown, LockOpen, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
	Button,
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	useDebouncedValue,
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
	onChange?: () => void;
}

export const MembersTable = ({ id, type, onChange }: MembersProps) => {
	const [openAddMembers, setOpenAddMembers] = useState<boolean>(false);
	const [searchKey, setSearchKey] = useState<string>("");
	const debouncedValue = useDebouncedValue(searchKey, 300);
	const [filterPermission, setFilterPermission] = useState("");

	const returnAccessType = useCallback((permission: string) => {
		switch (permission) {
			case "can view":
				return "READ_ONLY";
			case "can edit":
				return "EDIT";
			case "owner":
				return "OWNER";
			default:
				return "";
		}
	}, []);

	useEffect(() => {
		if (!openAddMembers && onChange) {
			onChange();
		}
	}, [openAddMembers]);

	return (
		<div className="w-full">
			{/* Header Section */}
			<div className="flex flex-column gap-[10px] rounded-xl rounded-br-none rounded-bl-none border-gray-200 border-b bg-[#f4f4f4] p-4 align-start">
				<div className="flex h-[36px] w-full flex-column gap-2">
					<InputGroup className="flex h-auto gap-1 self-stretch bg-[#FFF] px-2 py-1 align-center">
						<InputGroupInput
							placeholder="Search"
							value={searchKey}
							onChange={(e) => setSearchKey(e.target.value)}
						/>
						<InputGroupAddon>
							<Search />
						</InputGroupAddon>
					</InputGroup>
					<DropdownMenu>
						<DropdownMenuTrigger
							asChild
							className="flex h-auto w-35 items-center px-2.5 py-2"
						>
							<Button variant="outline" size="sm">
								<div className="flex flex-column items-center gap-2">
									<LockOpen />
									<span>
										{filterPermission || "Permissions"}
									</span>
									<ChevronDown />
								</div>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuCheckboxItem
								key="permission-dropdown-view"
								checked={filterPermission === "can view"}
								onCheckedChange={() => {
									setFilterPermission((prev) =>
										prev === "can view" ? "" : "can view",
									);
								}}
							>
								Can View
							</DropdownMenuCheckboxItem>
							<DropdownMenuCheckboxItem
								key="permission-dropdown-edit"
								checked={filterPermission === "can edit"}
								onCheckedChange={() => {
									setFilterPermission((prev) =>
										prev === "can edit" ? "" : "can edit",
									);
								}}
							>
								Can Edit
							</DropdownMenuCheckboxItem>
							<DropdownMenuCheckboxItem
								key="permission-dropdown-owner"
								checked={filterPermission === "owner"}
								onCheckedChange={() => {
									setFilterPermission((prev) =>
										prev === "owner" ? "" : "owner",
									);
								}}
							>
								Owner
							</DropdownMenuCheckboxItem>
						</DropdownMenuContent>
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
			<MembersList
				id={id}
				type={type}
				refreshList={!openAddMembers}
				search={debouncedValue}
				permission={returnAccessType(filterPermission)}
			/>
			{/** Add members overlay */}
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
