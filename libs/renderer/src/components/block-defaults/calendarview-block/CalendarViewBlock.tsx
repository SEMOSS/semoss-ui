import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { observer } from "mobx-react-lite";
import React, { type CSSProperties, useEffect, useState } from "react";
import { DatePicker } from "@semoss/ui";
import { useBlock, useBlocks, useTypeWriter } from "../../../hooks";
import {
	ActionMessages,
	type BlockComponent,
	type BlockDef,
	type BlockJSON,
	type ListenerActions,
} from "../../../store";
import { Slot } from "../../blocks";

dayjs.extend(utc);

import { toJS } from "mobx";
import { Button, Typography } from "@semoss/ui";

export interface CalendarViewBlockDef extends BlockDef<"calendarviewtext"> {
	widget: "calendarviewtext";
	data: {
		style: CSSProperties;
		text: string;
		variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
		isStreaming: boolean;
		source?: string | any[];
		calendarTitle?: string;
		defaultDate?: string;
		designMode?: boolean;
		events?: Array<{
			summary: string;
			id: string;
			recurringId?: string;
			date: string;
			displayText: string;
		}>;
	};
	slots: {
		children: true;
	};
	listeners: never;
}

export const CalendarViewBlock: BlockComponent = observer(({ id }) => {
	const { data, slots } = useBlock<CalendarViewBlockDef>(id);
	const { state } = useBlocks();
	const isStatic = state.mode === "static";

	// State for calendar functionality
	const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());
	const [blocksToRemove, setBlocksToRemove] = useState([]);
	const [isReplicating, setIsReplicating] = useState(false);
	const textContent =
		typeof data.text === "string" ? data.text : JSON.stringify(data.text);
	let displayTxt = useTypeWriter(data.isStreaming ? textContent : "");

	if (!data.isStreaming) displayTxt = textContent;

	// Process source data to generate events
	// Handle multiple possible formats of source data
	const processSourceData = (
		source: string | any[],
	): Array<{
		summary: string;
		id: string;
		recurringId?: string;
		date: string;
		displayText: string;
	}> => {
		if (!source) return [];

		try {
			let parsedData: any[];

			// Parse source if it's a string
			if (typeof source === "string") {
				parsedData = JSON.parse(source);
			} else if (Array.isArray(source)) {
				parsedData = source;
			} else {
				return [];
			}

			const events: Array<{
				summary: string;
				id: string;
				recurringId?: string;
				date: string;
				displayText: string;
			}> = [];

			// Process each item in the data
			parsedData.forEach((item: any, index: number) => {
				// Handle different possible data structures

				// Format 1: { date: "YYYY-MM-DD", events: [["Event Name", "event_id", "recurring_id?"], ...] }
				if (item.date && item.events && Array.isArray(item.events)) {
					item.events.forEach(
						(eventData: any, eventIndex: number) => {
							// Handle array format: ["Event Name", "event_id", "recurring_id?"]
							if (
								Array.isArray(eventData) &&
								eventData.length >= 2
							) {
								const [summary, id, recurringId] = eventData;
								events.push({
									summary: summary || "Untitled Event",
									id: id || `event-${index}-${eventIndex}`,
									recurringId: recurringId || undefined,
									date: item.date,
									displayText: summary || "Untitled Event",
								});
							}
							// Handle object format: { summary: "Event Name", id: "event_id", ... }
							else if (
								typeof eventData === "object" &&
								eventData !== null
							) {
								events.push({
									summary:
										eventData.summary ||
										eventData.title ||
										eventData.name ||
										"Untitled Event",
									id:
										eventData.id ||
										`event-${index}-${eventIndex}`,
									recurringId:
										eventData.recurringId || undefined,
									date: item.date,
									displayText:
										eventData.summary ||
										eventData.title ||
										eventData.name ||
										"Untitled Event",
								});
							}
						},
					);
				}
				// Format 2: Direct event object { date: "...", title/summary: "...", id?: "..." }
				else if (
					item.date &&
					(item.title || item.summary || item.name)
				) {
					events.push({
						summary:
							item.title ||
							item.summary ||
							item.name ||
							"Untitled Event",
						id: item.id || `event-${index}`,
						recurringId: item.recurringId || undefined,
						date: item.date,
						displayText:
							item.title ||
							item.summary ||
							item.name ||
							"Untitled Event",
					});
				}
				// Format 3: Array where each element represents an event [date, title, id?, ...]
				else if (Array.isArray(item) && item.length >= 2) {
					const [date, title, id, recurringId] = item;
					if (date && title) {
						events.push({
							summary: title || "Untitled Event",
							id: id || `event-${index}`,
							recurringId: recurringId || undefined,
							date: date,
							displayText: title || "Untitled Event",
						});
					}
				}
				// Format 4: Object with any date field and any text field
				else {
					// Look for date fields
					const dateField = [
						"date",
						"Date",
						"DATE",
						"eventDate",
						"startDate",
						"start_date",
					].find((field) => item[field]);
					// Look for text/title fields
					const textField = [
						"title",
						"summary",
						"name",
						"text",
						"event",
						"eventTitle",
						"description",
					].find((field) => item[field]);

					if (
						dateField &&
						textField &&
						item[dateField] &&
						item[textField]
					) {
						events.push({
							summary: item[textField] || "Untitled Event",
							id: item.id || item.eventId || `event-${index}`,
							recurringId: item.recurringId || undefined,
							date: item[dateField],
							displayText: item[textField] || "Untitled Event",
						});
					}
				}
			});
			return events;
		} catch (error) {
			console.warn("Error processing calendar source data:", error);
			return [];
		}
	};

	// Helper function to normalize date format to YYYY-MM-DD
	const normalizeDateFormat = (dateString: string): string => {
		try {
			let eventDate;
			if (dateString.includes("/")) {
				// Handle MM/DD/YYYY format
				eventDate = dayjs(dateString, "MM/DD/YYYY");
			} else if (dateString.includes("-")) {
				// Handle YYYY-MM-DD or MM-DD-YYYY format
				eventDate = dayjs(dateString);
			} else {
				// Fallback to default parsing
				eventDate = dayjs(dateString);
			}

			// Ensure the parsed date is valid
			if (!eventDate.isValid()) {
				console.warn("Invalid date:", dateString);
				return "";
			}

			return eventDate.format("YYYY-MM-DD");
		} catch (error) {
			console.warn("Error parsing date:", dateString, error);
			return "";
		}
	};

	// Get events from source data or fallback to direct events property
	const calendarEvents = data.source
		? processSourceData(data.source)
		: data.events || [];

	// Get unique event dates for child component replication (normalized to YYYY-MM-DD)
	const uniqueEventDates = [
		...new Set(
			calendarEvents
				.map((event) => normalizeDateFormat(event.date))
				.filter((date) => date !== ""),
		),
	];

	/**
	 * Add Blocks at runtime
	 */
	useEffect(() => {
		// Prevent re-runs when already replicating
		if (isReplicating) {
			return;
		}

		let list: string[] = [];
		if (typeof data.source === "string") {
			try {
				const parsedData = JSON.parse(data.source);
				if (Array.isArray(parsedData)) {
					const events = processSourceData(data.source);
					list = [
						...new Set(
							events
								.map((event) => normalizeDateFormat(event.date))
								.filter((date) => date !== ""),
						),
					];
				}
			} catch {
				list = [];
			}
		} else if (Array.isArray(data.source)) {
			const events = processSourceData(data.source);
			list = [
				...new Set(
					events
						.map((event) => normalizeDateFormat(event.date))
						.filter((date) => date !== ""),
				),
			];
		}

		// Only while we are in app using mode
		if (state.mode === "interactive") {
			if (
				Array.isArray(list) &&
				list.length > 0 &&
				slots.children &&
				slots.children.children.length > 0
			) {
				// Check if we already have the right number of blocks
				const expectedBlockCount = list.length;
				const currentBlockCount = slots.children.children.length;

				// Only replicate if we need more blocks AND we don't already have enough
				if (currentBlockCount < expectedBlockCount && !isReplicating) {
					setIsReplicating(true);

					const replicateBlocks = async () => {
						const newIds = [];

						// Remove previously created blocks
						for (const b of blocksToRemove) {
							await state.dispatch({
								message: ActionMessages.REMOVE_BLOCK,
								payload: {
									id: b,
									keep: false,
								},
							});
						}

						const originalChildId = slots.children.children[0]; // Get the first child as template

						// Create blocks for missing dates only
						const blocksToCreate =
							expectedBlockCount - currentBlockCount;

						for (let i = 0; i < blocksToCreate; i++) {
							const getJsonForBlock = (id: string) => {
								const block = state.blocks[id];

								const blockJson = {
									widget: toJS(block.widget),
									data: toJS(block.data),
									listeners: toJS(block.listeners),
									slots: {},
								};

								// generate the slots
								for (const slot in block.slots) {
									if (block.slots[slot]) {
										blockJson.slots[slot] = block.slots[
											slot
										].children.map((childId) => {
											return getJsonForBlock(childId);
										});
									}
								}
								// return it
								return blockJson;
							};

							const position = {
								parent: id,
								slot: "children",
								sibling: originalChildId,
								type: "after" as const,
							};

							const newBlockId = await state.dispatch({
								message: ActionMessages.ADD_BLOCK,
								payload: {
									json: getJsonForBlock(
										originalChildId,
									) as BlockJSON,
									position: position,
								},
							});

							const fixListeners = (blockId: string) => {
								const block = state.blocks[blockId];

								for (const listener in block.listeners) {
									if (block.listeners[listener].order) {
										// Iterate through the order array of messages
										block.listeners[listener].order.forEach(
											async (
												message: ListenerActions,
											) => {
												// Check for the "MODIFY_VARIABLE" message
												if (
													message.message ===
													"MODIFY_VARIABLE"
												) {
													// Update the blockId in the payload
													message.payload.blockId =
														blockId;

													await state.dispatch({
														message:
															ActionMessages.SET_LISTENER,
														payload: {
															id: blockId,
															listener: listener,
															type: block
																.listeners[
																listener
															].type,
															actions:
																block.listeners[
																	listener
																].order,
														},
													});
												}
											},
										);
									}
								}
								// Now do the same for all slots recursively
								for (const slot in block.slots) {
									if (block.slots[slot]) {
										block.slots[slot].children.forEach(
											(childId) => {
												fixListeners(childId);
											},
										);
									}
								}
							};
							await fixListeners(newBlockId as string);

							newIds.push(newBlockId);
						}
						setBlocksToRemove(newIds);
						setIsReplicating(false);
					};

					replicateBlocks();
				}
			}
		}
		// Fixed: Removed slots.children?.children.length to prevent re-runs on child interactions
	}, [JSON.stringify(data.source)]);

	// Helper function to group events by date
	const getEventsForDate = (date: dayjs.Dayjs) => {
		const targetDateString = date.format("YYYY-MM-DD");
		const events = calendarEvents.filter((event) => {
			const normalizedEventDate = normalizeDateFormat(event.date);
			return normalizedEventDate === targetDateString;
		});
		return events;
	};

	// Helper function to check if a date has events
	const hasEventsOnDate = (date: dayjs.Dayjs) => {
		return getEventsForDate(date).length > 0;
	};

	// Generate calendar days for current month
	const generateCalendarDays = () => {
		const startOfMonth = selectedDate.startOf("month");
		const endOfMonth = selectedDate.endOf("month");
		const startOfWeek = startOfMonth.startOf("week");
		const endOfWeek = endOfMonth.endOf("week");

		const days = [];
		let currentDate = startOfWeek;

		while (
			currentDate.isBefore(endOfWeek) ||
			currentDate.isSame(endOfWeek, "day")
		) {
			days.push(currentDate);
			currentDate = currentDate.add(1, "day");
		}

		return days;
	};

	const calendarDays = generateCalendarDays();
	return (
		<div data-block={id} style={{ position: "relative", ...data.style }}>
			<div
				style={{
					...data.style,
					marginBlockStart: "0px",
					marginBlockEnd: "0px",
				}}
			>
				{displayTxt}

				{/* Calendar View Component */}
				<div
					style={{
						background: "#ffffff",
						borderRadius: "12px",
						border: "1px solid #e0e0e0",
						boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
						overflow: "hidden",
						marginTop: "16px",
					}}
				>
					{/* Children slot - always visible in edit mode for adding multiple blocks */}
					{isStatic && (
						<div
							style={{
								padding: "16px",
								margin: "16px",
								border: "2px dashed #ccc",
								borderRadius: "8px",
								textAlign: "center",
								backgroundColor: "#f9f9f9",
								color: "#666",
								fontSize: "0.875rem",
							}}
						>
							<Slot slot={slots.children} />
						</div>
					)}

					{/* Children slot placeholder - only show when empty in view mode */}
					{!isStatic &&
						(!slots.children ||
							slots.children.children.length === 0) && (
							<div
								style={{
									padding: "16px",
									margin: "16px",
									border: "2px dashed #ccc",
									borderRadius: "8px",
									textAlign: "center",
									backgroundColor: "#f9f9f9",
									color: "#666",
									fontSize: "0.875rem",
								}}
							>
								<Slot slot={slots.children} />
							</div>
						)}

					{/* Calendar Header */}
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							padding: "20px",
							borderBottom: "1px solid #e0e0e0",
							background: "#f8f9fa",
						}}
					>
						<Button
							onClick={() =>
								setSelectedDate(
									selectedDate.subtract(1, "month"),
								)
							}
							sx={{
								minWidth: "40px",
								width: "40px",
								height: "40px",
								borderRadius: "50%",
								color: "#666",
								"&:hover": {
									backgroundColor: "rgba(0, 0, 0, 0.04)",
								},
							}}
						>
							‹
						</Button>

						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: "16px",
							}}
						>
							<Typography
								variant="h4"
								sx={{
									fontWeight: "600",
									color: "#333",
									fontSize: "1.75rem",
								}}
							>
								{selectedDate.format("MMMM YYYY")}
							</Typography>

							<div style={{ display: "flex", gap: "8px" }}>
								<DatePicker
									value={selectedDate.format("YYYY-MM-DD")}
									onChange={(dateString: string) => {
										if (dateString) {
											const parsedDate =
												dayjs(dateString);
											if (parsedDate.isValid()) {
												setSelectedDate(parsedDate);
											}
										}
									}}
									sx={{
										minWidth: 180,
										backgroundColor: "#ffffff",
										borderRadius: "6px",
										fontSize: "0.875rem",
										height: "36px",
										"& .MuiInputBase-root": {
											height: "36px",
										},
										"& .MuiInputLabel-root": {
											color: "#1976d2",
											fontWeight: "500",
										},
									}}
								/>
							</div>
						</div>

						<Button
							onClick={() =>
								setSelectedDate(selectedDate.add(1, "month"))
							}
							sx={{
								minWidth: "40px",
								width: "40px",
								height: "40px",
								borderRadius: "50%",
								color: "#666",
								"&:hover": {
									backgroundColor: "rgba(0, 0, 0, 0.04)",
								},
							}}
						>
							›
						</Button>
					</div>

					{/* Day Labels */}
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "repeat(7, 1fr)",
							borderBottom: "1px solid #e0e0e0",
							backgroundColor: "#f8f9fa",
						}}
					>
						{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
							(day) => (
								<div
									key={day}
									style={{
										padding: "12px",
										textAlign: "center",
										fontWeight: "600",
										color: "#666",
										fontSize: "0.875rem",
										borderRight: "1px solid #e0e0e0",
									}}
								>
									{day}
								</div>
							),
						)}
					</div>

					{/* Calendar Grid */}
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "repeat(7, 1fr)",
							gap: "1px",
							backgroundColor: "#e0e0e0",
						}}
					>
						{calendarDays.map((date, index) => {
							const isCurrentMonth =
								date.month() === selectedDate.month();
							const isToday = date.isSame(dayjs(), "day");
							const hasEvents = hasEventsOnDate(date);

							return (
								<div
									key={index}
									style={{
										backgroundColor: "#ffffff",
										minHeight: hasEvents ? "120px" : "80px",
										padding: "8px",
										position: "relative",
										opacity: isCurrentMonth ? 1 : 0.3,
										transition:
											"background-color 0.2s ease, min-height 0.2s ease",
										display: "flex",
										flexDirection: "column",
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.backgroundColor =
											"#f5f5f5";
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.backgroundColor =
											"#ffffff";
									}}
								>
									{/* Date number */}
									<div
										style={{
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											marginBottom: hasEvents
												? "8px"
												: "auto",
											flexShrink: 0,
										}}
									>
										<div
											style={{
												width: "28px",
												height: "28px",
												borderRadius: "50%",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												fontSize: "0.875rem",
												fontWeight: isToday
													? "600"
													: "400",
												color: isToday
													? "#ffffff"
													: isCurrentMonth
														? "#333"
														: "#999",
												backgroundColor: isToday
													? "#1976d2"
													: "transparent",
											}}
										>
											{date.date()}
										</div>
									</div>

									{/* Child components - show one child per date with events */}
									{(() => {
										const dateString =
											date.format("YYYY-MM-DD");
										const shouldShowChild =
											slots.children &&
											slots.children.children.length >
												0 &&
											((isStatic && data.designMode) ||
												(!isStatic && hasEvents) ||
												(isStatic &&
													!data.designMode &&
													hasEvents));

										if (shouldShowChild) {
											// Find the index of this date in the unique event dates array
											const dateIndex =
												uniqueEventDates.indexOf(
													dateString,
												);
											// Use the corresponding child block for this date (or first child if not found)
											const childBlockId =
												dateIndex >= 0 &&
												dateIndex <
													slots.children.children
														.length
													? slots.children.children[
															dateIndex
														]
													: slots.children
															.children[0];

											return (
												<div
													style={{
														flex: 1,
														display: "flex",
														flexDirection: "column",
														justifyContent:
															"center",
														alignItems: "center",
														fontSize: "0.75rem",
														color: "#666",
														textAlign: "center",
														minHeight: "40px",
														padding: "2px",
														overflow: isStatic
															? "visible"
															: "hidden",
													}}
												>
													<div
														style={{
															maxWidth: "100%",
															transform: isStatic
																? "scale(1)"
																: "scale(0.75)",
															transformOrigin:
																"center",
															width: isStatic
																? "100%"
																: "133.33%",
														}}
													>
														<Slot
															slot={{
																name: "children",
																children: [
																	childBlockId,
																],
															}}
														/>
													</div>
												</div>
											);
										}

										return null;
									})()}
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
});
