import { ChevronDown, X } from "lucide-react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { useNotification } from "@semoss/ui";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
	Input,
} from "@semoss/ui/next";
import { apiGet, apiPost } from "../utility/api";
import { returnAccessType } from "./common";
import { MembersList } from "./members-list";

interface AddPopupSearchResult {
	email: string;
	id: string;
	name: string;
	type: string;
	username: string;
}

/**
 * AddMembersOverlay is a component that allows users to add members to the current project or engine.
 * @param {string} id - the id of the project or engine
 * @param {ALL_TYPES} type - the type of the project or engine (e.g. "PROJECT", "ENGINE", "DATABASE")
 * @param {boolean} open - whether the overlay is open or not
 * @param {function} onClose - callback to close the overlay
 */
export const AddMembersOverlay = ({ id, type, open, onClose }) => {
	const dialogContainer = useRef();
	const [searchKey, setSearchKey] = useState<string>("");
	const [selectedUsers, setSelectedUsers] = useState([]);
	const [selectedPermission, setSelectedPermission] =
		useState<string>("can view");
	const [searchedResults, setSearchedResults] = useState<unknown[]>([]);
	const [popupOpen, setPopupOpen] = useState<boolean>(false);
	const notification = useNotification();
	const usersUrl =
		type === "PROJECT"
			? "getProjectUsersNoCredentials"
			: "getEngineUsersNoCredentials";
	const typeId = type === "PROJECT" ? "projectId" : "engineId";
	useEffect(() => {
		// Fetch users based on searchKey and by default limits record to 5
		apiGet(
			"/api/auth/project/" +
				usersUrl +
				`?${typeId}=${id}&searchTerm=${searchKey}&limit=5`,
		)
			.then((response: unknown[]) => {
				setSearchedResults(response);
			})
			.catch((_error) => {});
	}, [searchKey, typeId, id, usersUrl]);

	/**
	 * Add selected members to the current project or engine.
	 *
	 * @param {function} onClose - callback to close the overlay
	 */
	function addNewMembers() {
		const selectedUserObj = selectedUsers.map((m) => ({
			userid: m.id,
			permission: selectedPermission,
			email: m.email,
			name: m.name,
			type: m.type,
			username: m.username,
		}));

		apiPost(
			`/api/auth/project/${type === "PROJECT" ? "addProjectUserPermissions" : "addEngineUserPermissions"}`,
			{
				projectId: id,
				userpermissions: selectedUserObj,
			},
		)
			.then((response) => {
				if (response?.success) {
					notification.add({
						id: "success",
						color: "success",
						message:
							"Selected members have been added successfully.",
					});
					setSelectedUsers([]);
					setSearchKey("");
					// Close the overlay
					onClose(true);
				}
			})
			.catch((error) => {
				console.error("Error adding new members:", error);
				notification.add({
					id: "error",
					color: "error",
					message: "There was an error adding the selected members.",
				});
				setSelectedUsers([]);
				setSearchKey("");
				onClose(true);
			});
	}
	/**
	 * resets the add member state to initial values
	 */
	function resetAddMemberState() {
		setSelectedUsers([]);
		setSearchKey("");
	}

	return (
		<div className="position-relative w-full">
			<Dialog
				open={open}
				onOpenChange={() => {
					onClose();
					resetAddMemberState();
				}}
			>
				<DialogContent className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-lg sm:max-w-6xl">
					<DialogTitle>Add Members</DialogTitle>

					<DialogDescription className="mb-4 flex w-full flex-col gap-4 text-gray-600">
						<div className="flex w-full gap-2">
							<div className="flex min-h-[42px] w-[90%] flex-wrap items-center justify-between gap-1 overflow-visible rounded border bg-white px-2 py-1 ring-primary focus-within:ring-2">
								<div className="flex w-full flex-row justify-between">
									<div className="flex w-[80%] flex-wrap justify-start gap-2 [overflow-wrap:anywhere]">
										{selectedUsers.map((userEmail) => {
											return (
												<div
													key={userEmail?.email}
													className="flex items-center gap-1 rounded border bg-transparent px-2 py-1"
												>
													<span className="text-black">
														{userEmail?.name}
													</span>
													<span>
														<Button
															size="icon-sm"
															variant="outline"
															className="border-none text-black"
															onClick={() =>
																setSelectedUsers(
																	selectedUsers.filter(
																		(
																			user,
																		) =>
																			user?.email !==
																			userEmail?.email,
																	),
																)
															}
														>
															<X className="h-4 w-4" />
														</Button>
													</span>
												</div>
											);
										})}
										<Input
											placeholder="Add comma separated emails to invite or edit"
											className="min-w-[100px] flex-1 appearance-none border-none shadow-none focus:outline-none focus:ring-0 focus-visible:ring-0"
											value={searchKey}
											ref={dialogContainer}
											onChange={(
												e: ChangeEvent<HTMLInputElement>,
											) => {
												setSearchKey(e.target.value);
												if (e.target.value.length > 2) {
													setTimeout(
														() =>
															setPopupOpen(true),
														30,
													);
												} else {
													setTimeout(
														() =>
															setPopupOpen(false),
														30,
													);
												}
											}}
										/>
									</div>
									{selectedUsers.length > 0 && (
										<div className="flex w-[20%] flex-column items-center justify-end gap-2">
											<DropdownMenu>
												<DropdownMenuTrigger
													asChild
													className="flex h-auto items-center"
												>
													<Button
														variant="outline"
														size="default"
														className="w-[120px]"
													>
														<div className="flex flex-column items-center gap-2">
															can view{" "}
															<ChevronDown />
														</div>
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent>
													<DropdownMenuCheckboxItem
														key={`can-view-select`}
														checked={
															returnAccessType(
																selectedPermission,
															) === "can view"
														}
														onCheckedChange={() => {
															setSelectedPermission(
																"can view",
															);
														}}
													>
														can view
													</DropdownMenuCheckboxItem>
													<DropdownMenuCheckboxItem
														key={`can-edit-select`}
														checked={
															returnAccessType(
																selectedPermission,
															) === "can edit"
														}
														onCheckedChange={() => {
															setSelectedPermission(
																"can edit",
															);
														}}
													>
														can edit
													</DropdownMenuCheckboxItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									)}
								</div>
							</div>
							<div className="flex w-[10%] items-center">
								<Button
									variant="default"
									size="lg"
									onClick={() => {
										addNewMembers();
									}}
								>
									Invite
								</Button>
							</div>
						</div>
						{popupOpen && searchedResults.length > 0 && (
							<div className="relative z-50 mt-1 max-h-60 w-full overflow-hidden rounded-md border bg-background shadow-lg">
								<div className="h-30 w-full overflow-y-auto">
									{searchedResults.map(
										(item: AddPopupSearchResult) => (
											<Button
												key={item.id}
												variant={"ghost"}
												className="flex w-full cursor-pointer py-6 hover:bg-accent"
												onClick={() => {
													console.log(item, "item");
													setSelectedUsers((prev) => {
														const exists =
															prev.filter(
																(oldItem) =>
																	oldItem?.email ===
																	item.email,
															).length > 0 ||
															false;
														if (!prev || !exists) {
															return [
																...prev,
																item,
															];
														}
														return prev;
													});
													setPopupOpen(false);
													setSearchKey("");
												}}
											>
												<div className="flex w-full justify-between">
													<span className="flex flex-col justify-start">
														<span className="flex">
															{item.name}
														</span>
														<span className="flex">
															{item.email ||
																"test.test.com"}
														</span>
													</span>
													{selectedUsers.indexOf(
														item.email,
													) > -1 ? (
														<span className="justify-end">
															Added
														</span>
													) : null}
												</div>
											</Button>
										),
									)}
								</div>
							</div>
						)}
						<MembersList id={id} type={type} isAddMember={true} />
					</DialogDescription>
				</DialogContent>
			</Dialog>
		</div>
	);
};
