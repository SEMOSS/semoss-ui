/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
import {
	AlertCircle,
	Check,
	ChevronDown,
	ChevronUp,
	Search,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
	approveProjectUserAccessRequest,
	denyProjectUserAccessRequest,
} from "@semoss/shared";
import {
	Button,
	Checkbox,
	Collapsible,
	CollapsibleContent,
	H4,
	P,
	RadioGroup,
	RadioGroupItem,
	Spinner,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	toast,
} from "@semoss/ui/next";
import {
	approveEngineUserAccessRequest,
	denyEngineUserAccessRequest,
} from "@/api";
import { usePixel, useSettings } from "@/hooks";
import type { ALL_TYPES, ApiResponse } from "@/types";
import type { SETTINGS_PENDING_USER, SETTINGS_ROLE } from "./settings.types";

// maps for permissions,
const permissionMapper = {
	1: "Author", // BE: 'DISPLAY'
	OWNER: "Author", // BE: 'DISPLAY'
	Author: "OWNER", // DISPLAY: BE
	2: "Editor", // BE: 'DISPLAY'
	EDIT: "Editor", // BE: 'DISPLAY'
	Editor: "EDIT", // DISPLAY: BE
	3: "Read-Only", // BE: 'DISPLAY'
	READ_ONLY: "Read-Only", // BE: 'DISPLAY'
	"Read-Only": "READ_ONLY", // DISPLAY: BE
};

interface PendingMemberTableProps {
	/**
	 * Id of the engine
	 */
	id: string;

	/**
	 * Type of the engine
	 */
	type: ALL_TYPES;

	/**
	 * Called when permissions are changed
	 */
	onChange?: () => void;
}

export const PendingMembersTable = (props: PendingMemberTableProps) => {
	const { id, type, onChange = () => null } = props;

	const { adminMode } = useSettings();

	const [renderedMembers, setRenderedMembers] = useState<
		SETTINGS_PENDING_USER[]
	>([]);
	const [selectedMembers, setSelectedMembers] = useState<
		Record<string, true>
	>({});
	const [openTable, setOpenTable] = useState(false);

	const pendingUserAccessPixel =
		type === "DATABASE" ||
		type === "STORAGE" ||
		type === "MODEL" ||
		type === "VECTOR" ||
		type === "GUARDRAIL" ||
		type === "FUNCTION"
			? `GetEngineUserAccessRequest(engine='${id}');`
			: type === "PROJECT"
				? `GetProjectUserAccessRequest(project='${id}')`
				: "";

	// Pending Member Requests Pixel call
	const pendingUserAccess = usePixel<SETTINGS_PENDING_USER[]>(
		pendingUserAccessPixel,
	);

	// track if the page is loading
	const isLoading =
		pendingUserAccess.status === "INITIAL" ||
		pendingUserAccess.status === "LOADING";

	// set the rendered users
	useEffect(() => {
		if (pendingUserAccess.status !== "SUCCESS") {
			return;
		}

		const updatedMembers = pendingUserAccess.data.map((m) => ({
			...m,
			PERMISSION: permissionMapper[m.PERMISSION], // comes in as 1,2,3 -> map to Author, Edit, Read-only
		}));
		setRenderedMembers(updatedMembers);
	}, [pendingUserAccess.status, pendingUserAccess.data]);

	/** API Functions */
	/**
	 * @name approvePendingMembers
	 * @param members - members to pass to approve api call
	 * @description Approve list of Pending Members
	 */
	const approvePendingMembers = async (members: SETTINGS_PENDING_USER[]) => {
		try {
			// construct requests for post data
			const requests = members.map((mem, _i) => {
				return {
					requestid: mem.ID,
					userid: mem.REQUEST_USERID,
					permission: permissionMapper[mem.PERMISSION],
					type: mem.REQUEST_TYPE as string,
				};
			});

			if (requests.length === 0) {
				toast.warning(`No permissions to change`);

				return;
			}

			let response:
				| boolean
				| Awaited<ReturnType<typeof approveEngineUserAccessRequest>>
				| null = null;
			if (
				type === "DATABASE" ||
				type === "STORAGE" ||
				type === "MODEL" ||
				type === "VECTOR" ||
				type === "GUARDRAIL" ||
				type === "FUNCTION"
			) {
				response = await approveEngineUserAccessRequest(
					adminMode,
					id,
					requests,
				);
			} else if (type === "PROJECT") {
				response = await approveProjectUserAccessRequest(
					id,
					requests,
					adminMode,
				);
			}

			if (
				typeof response === "boolean"
					? response
					: response?.data?.success
			) {
				const updatedMembers = {
					...selectedMembers,
				} as Record<string, true>;

				for (const m of members) {
					if (updatedMembers[m.ID]) {
						delete updatedMembers[m.ID];
					}
				}
				setSelectedMembers(updatedMembers);

				// refresh the data
				pendingUserAccess.refresh();

				// trigger onChange
				onChange();

				toast.success("Successfully approved user permissions");
			} else {
				toast.error(`Error changing user permissions`);
			}
		} catch (e) {
			toast.error(String(e));
		}
	};

	/**
	 * @name denyPendingMembers
	 * @param members - members to pass to deny api call
	 * @param quickActionFlag - quick deny button on table
	 * @description Deny Selected Pending Members
	 */
	const denyPendingMembers = async (members: SETTINGS_PENDING_USER[]) => {
		try {
			// construct requests for post data
			const requests = members.map((m) => {
				return m.ID;
			});

			if (requests.length === 0) {
				toast.warning(`No permissions to change`);

				return;
			}

			let response:
				| boolean
				| {
						response: Response;
						data: {
							success: boolean;
						};
				  }
				| null = null;
			if (
				type === "DATABASE" ||
				type === "STORAGE" ||
				type === "MODEL" ||
				type === "VECTOR" ||
				type === "GUARDRAIL" ||
				type === "FUNCTION"
			) {
				response = await denyEngineUserAccessRequest(
					adminMode,
					id,
					requests,
				);
			} else if (type === "PROJECT") {
				response = await denyProjectUserAccessRequest(
					id,
					requests,
					adminMode,
				);
			}

			if (
				typeof response === "boolean"
					? response
					: response?.data?.success
			) {
				const updatedMembers = {
					...selectedMembers,
				} as Record<string, true>;

				for (const m of members) {
					if (updatedMembers[m.ID]) {
						delete updatedMembers[m.ID];
					}
				}
				setSelectedMembers(updatedMembers);

				// refresh the data
				pendingUserAccess.refresh();

				// trigger onChange
				onChange();

				toast.success("Successfully denied user permissions");
			} else {
				toast.error(`Error changing user permissions`);
			}
		} catch (e) {
			toast.error(String(e));
		}
	};

	/** HELPERS */
	/**
	 * @name updatePendingMemberPermission
	 * @param member
	 * @param value
	 * @desc Updates pending member permission in radiogroup
	 */
	const updatePendingMemberPermission = (
		member: SETTINGS_PENDING_USER,
		role: SETTINGS_ROLE,
	) => {
		const updatedRenderedMembers = renderedMembers.map((m) => {
			if (member.ID === m.ID) {
				return {
					...m,
					PERMISSION: role,
				};
			}

			return m;
		});

		setRenderedMembers(updatedRenderedMembers);
	};

	return (
		<div className="flex w-full shrink-0 flex-col items-start gap-[25px] rounded-xl border border-border">
			<div className="flex flex-col items-start gap-5 self-stretch">
				<div className="w-full rounded-xl border border-border">
					<div
						className="flex cursor-pointer items-center self-stretch rounded-xl bg-background"
						onClick={() => {
							if (renderedMembers.length > 0) {
								setOpenTable(!openTable);
							}
						}}
					>
						<div className="flex items-center gap-2.5 p-3 px-6 py-3">
							<H4 data-testid={"pendingMembers-section-title"}>
								Pending Requests
							</H4>
						</div>

						<div className="flex flex-1 items-start">
							<div className="flex h-14 flex-col items-center justify-center gap-2.5 px-4 py-1.5">
								<div className="flex items-start">
									<div className="flex flex-row items-center justify-start gap-2">
										<P data-testid="pending-requests-count">
											{renderedMembers.length === 1
												? `${renderedMembers.length} pending request`
												: `${renderedMembers.length} pending requests`}
										</P>
										{renderedMembers.length > 0 && (
											<AlertCircle className="size-5 text-orange-500" />
										)}
									</div>
								</div>
							</div>
						</div>

						<div className="flex items-center">
							<Button
								variant="ghost"
								size="icon"
								data-testid="pending-members-search-btn"
							>
								<Search className="size-4" />
							</Button>
						</div>

						{Object.keys(selectedMembers).length > 0 && (
							<>
								<div className="flex flex-col items-center justify-center gap-2.5 px-2 px-4 py-2.5 py-2.5">
									<Button
										variant="outline"
										onClick={() => {
											const members =
												renderedMembers.filter(
													(m) =>
														selectedMembers[m.ID],
												);

											denyPendingMembers(members);
										}}
										data-testid="deny-selected-btn"
									>
										Deny Selected
									</Button>
								</div>
								<div className="flex flex-col items-center justify-center gap-2.5 px-2 px-6 py-2.5 py-2.5">
									<Button
										onClick={() => {
											const members =
												renderedMembers.filter(
													(m) =>
														selectedMembers[m.ID],
												);

											approvePendingMembers(
												Object.values(members),
											);
										}}
										data-testid="approve-selected-btn"
									>
										Approve Selected
									</Button>
								</div>
							</>
						)}
						<div className="flex items-center gap-2.5 p-2 px-2 py-[5px]">
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setOpenTable(!openTable)}
								disabled={renderedMembers.length === 0}
								data-testid="pending-members-expand-collapse-btn"
							>
								{openTable ? (
									<ChevronUp className="size-4" />
								) : (
									<ChevronDown className="size-4" />
								)}
							</Button>
						</div>
					</div>
					<Collapsible open={openTable}>
						<CollapsibleContent>
							{isLoading ? (
								<div className="relative flex h-40 items-center justify-center">
									<Spinner className="size-8" />
									<span className="sr-only">
										Getting members
									</span>
								</div>
							) : (
								<div>
									{renderedMembers.length ? (
										<Table className="mb-2 bg-background">
											<TableHeader>
												<TableRow className="bg-background">
													<TableHead
														className="w-12"
														data-testid="pending-members-permission"
													>
														<Checkbox
															checked={
																Object.keys(
																	selectedMembers,
																).length ===
																	renderedMembers.length &&
																renderedMembers.length >
																	0
															}
															onCheckedChange={() => {
																if (
																	Object.keys(
																		selectedMembers,
																	).length !==
																	renderedMembers.length
																) {
																	const updatedMembers =
																		renderedMembers.reduce(
																			(
																				acc,
																				val,
																			) => {
																				acc[
																					val.ID
																				] =
																					val;

																				return acc;
																			},
																			{},
																		);

																	setSelectedMembers(
																		updatedMembers,
																	);
																} else {
																	setSelectedMembers(
																		{},
																	);
																}
															}}
															data-testid="select-all-pending-members-checkbox"
														/>
													</TableHead>
													<TableHead>ID</TableHead>
													<TableHead>Name</TableHead>
													<TableHead>
														Request Date
													</TableHead>
													<TableHead>
														Permission
													</TableHead>
													<TableHead>
														Actions
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{renderedMembers.map(
													(member) => {
														const isSelected =
															!!selectedMembers[
																member.ID
															];

														return (
															<TableRow
																key={member.ID}
																className="bg-background"
															>
																<TableCell>
																	<Checkbox
																		checked={
																			isSelected
																		}
																		onCheckedChange={() => {
																			// update selected members
																			const updatedMembers =
																				{
																					...selectedMembers,
																				} as Record<
																					string,
																					true
																				>;

																			if (
																				isSelected
																			) {
																				delete updatedMembers[
																					member
																						.ID
																				];
																			} else {
																				updatedMembers[
																					member.ID
																				] =
																					true;
																			}

																			setSelectedMembers(
																				updatedMembers,
																			);
																		}}
																	/>
																</TableCell>
																<TableCell>
																	{
																		member.REQUEST_USERID
																	}
																</TableCell>
																<TableCell>
																	{
																		member.NAME
																	}
																</TableCell>
																<TableCell>
																	{
																		member.REQUEST_TIMESTAMP
																	}
																</TableCell>
																<TableCell>
																	<RadioGroup
																		value={
																			member.PERMISSION
																		}
																		onValueChange={(
																			val,
																		) => {
																			if (
																				val
																			) {
																				updatePendingMemberPermission(
																					member,
																					val as SETTINGS_ROLE,
																				);
																			}
																		}}
																		className="flex flex-row gap-2"
																	>
																		<div className="flex items-center gap-2">
																			<RadioGroupItem
																				value="Author"
																				id={`${member.ID}-author`}
																				data-testid="author-radio"
																			/>
																			<label
																				htmlFor={`${member.ID}-author`}
																				className="text-sm"
																			>
																				Author
																			</label>
																		</div>
																		<div className="flex items-center gap-2">
																			<RadioGroupItem
																				value="Editor"
																				id={`${member.ID}-editor`}
																				data-testid="editor-radio"
																			/>
																			<label
																				htmlFor={`${member.ID}-editor`}
																				className="text-sm"
																			>
																				Editor
																			</label>
																		</div>
																		<div className="flex items-center gap-2">
																			<RadioGroupItem
																				value="Read-Only"
																				id={`${member.ID}-readonly`}
																				data-testid="read-only-radio"
																			/>
																			<label
																				htmlFor={`${member.ID}-readonly`}
																				className="text-sm"
																			>
																				Read-Only
																			</label>
																		</div>
																	</RadioGroup>
																</TableCell>

																<TableCell>
																	<div className="flex gap-1">
																		<Button
																			variant="ghost"
																			size="icon"
																			onClick={() => {
																				approvePendingMembers(
																					[
																						member,
																					],
																				);
																			}}
																			data-testid="approve-pending-member-btn"
																		>
																			<Check className="size-4 text-green-600" />
																		</Button>
																		<Button
																			variant="ghost"
																			size="icon"
																			onClick={() => {
																				denyPendingMembers(
																					[
																						member,
																					],
																				);
																			}}
																			data-testid="deny-pending-member-btn"
																		>
																			<X className="size-4" />
																		</Button>
																	</div>
																</TableCell>
															</TableRow>
														);
													},
												)}
											</TableBody>
										</Table>
									) : (
										<div className="flex w-full flex-col items-center justify-center gap-2 px-2 px-6 py-2.5 py-2.5">
											<P>No requests pending</P>
										</div>
									)}
								</div>
							)}
						</CollapsibleContent>
					</Collapsible>
				</div>
			</div>
		</div>
	);
};
