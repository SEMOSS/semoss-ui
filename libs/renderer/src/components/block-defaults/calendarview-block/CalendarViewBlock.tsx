import React, { CSSProperties, useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { DatePicker } from "@semoss/ui";
import { useBlock, useTypeWriter, useBlocks } from "../../../hooks";
import { BlockDef, BlockComponent, ActionMessages, Block, BlockJSON } from "../../../store";
import { Slot } from "../../blocks";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
import {
  Button,
  Typography,
} from "@semoss/ui";
import { toJS } from "mobx";

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
  const { data, setData, slots } = useBlock<CalendarViewBlockDef>(id);
  const { state } = useBlocks();
  const isStatic = state.mode === "static"; 
  
  // State for calendar functionality
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());
  const [replicatedBlocks, setReplicatedBlocks] = useState<string[]>([]);
  
  const textContent =
    typeof data.text === "string" ? data.text : JSON.stringify(data.text);
  let displayTxt = useTypeWriter(data.isStreaming ? textContent : "");

  if (!data.isStreaming) displayTxt = textContent;

  // Process source data to generate events
  // Handle multiple possible formats of source data
  const processSourceData = (source: string | any[]): Array<{
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
      if (typeof source === 'string') {
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
          item.events.forEach((eventData: any, eventIndex: number) => {
            // Handle array format: ["Event Name", "event_id", "recurring_id?"]
            if (Array.isArray(eventData) && eventData.length >= 2) {
              const [summary, id, recurringId] = eventData;
              events.push({
                summary: summary || 'Untitled Event',
                id: id || `event-${index}-${eventIndex}`,
                recurringId: recurringId || undefined,
                date: item.date,
                displayText: summary || 'Untitled Event'
              });
            }
            // Handle object format: { summary: "Event Name", id: "event_id", ... }
            else if (typeof eventData === 'object' && eventData !== null) {
              events.push({
                summary: eventData.summary || eventData.title || eventData.name || 'Untitled Event',
                id: eventData.id || `event-${index}-${eventIndex}`,
                recurringId: eventData.recurringId || undefined,
                date: item.date,
                displayText: eventData.summary || eventData.title || eventData.name || 'Untitled Event'
              });
            }
          });
        }
        // Format 2: Direct event object { date: "...", title/summary: "...", id?: "..." }
        else if (item.date && (item.title || item.summary || item.name)) {
          events.push({
            summary: item.title || item.summary || item.name || 'Untitled Event',
            id: item.id || `event-${index}`,
            recurringId: item.recurringId || undefined,
            date: item.date,
            displayText: item.title || item.summary || item.name || 'Untitled Event'
          });
        }
        // Format 3: Array where each element represents an event [date, title, id?, ...]
        else if (Array.isArray(item) && item.length >= 2) {
          const [date, title, id, recurringId] = item;
          if (date && title) {
            events.push({
              summary: title || 'Untitled Event',
              id: id || `event-${index}`,
              recurringId: recurringId || undefined,
              date: date,
              displayText: title || 'Untitled Event'
            });
          }
        }
        // Format 4: Object with any date field and any text field
        else {
          // Look for date fields
          const dateField = ['date', 'Date', 'DATE', 'eventDate', 'startDate', 'start_date'].find(field => item[field]);
          // Look for text/title fields
          const textField = ['title', 'summary', 'name', 'text', 'event', 'eventTitle', 'description'].find(field => item[field]);
          
          if (dateField && textField && item[dateField] && item[textField]) {
            events.push({
              summary: item[textField] || 'Untitled Event',
              id: item.id || item.eventId || `event-${index}`,
              recurringId: item.recurringId || undefined,
              date: item[dateField],
              displayText: item[textField] || 'Untitled Event'
            });
          }
        }
      });
      
      console.log('Processed events from source:', events);
      return events;
    } catch (error) {
      console.warn('Error processing calendar source data:', error);
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
  const calendarEvents = data.source ? processSourceData(data.source) : (data.events || []);

  // Get unique event dates for child component replication (normalized to YYYY-MM-DD)
  const uniqueEventDates = [...new Set(calendarEvents.map(event => normalizeDateFormat(event.date)).filter(date => date !== ""))];

  // Create a mapping of event dates to child block IDs
  const [dateToBlockMap, setDateToBlockMap] = useState<Record<string, string>>({});

  // Replicate child components for each event date (similar to IterationBlock)
  useEffect(() => {
    const replicateComponents = async () => {
      if (state.mode === "interactive" && slots.children && uniqueEventDates.length > 0) {
        const childrenSlot = slots.children;
        if (childrenSlot && childrenSlot.children.length > 0) {
          const originalChildId = childrenSlot.children[0]; // Get the first child as template
          
          // Helper function to get JSON for a block (from IterationBlock)
          const getJsonForBlock = (blockId: string): BlockJSON => {
            const block = state.blocks[blockId];
            if (!block) return null;

            const blockJson = {
              widget: toJS(block.widget),
              data: toJS(block.data),
              listeners: toJS(block.listeners),
              slots: {},
            };

            // Generate the slots
            for (const slot in block.slots) {
              if (block.slots[slot]) {
                blockJson.slots[slot] = block.slots[slot].children.map((childId) => {
                  return getJsonForBlock(childId);
                });
              }
            }
            return blockJson;
          };

          // Remove existing replicated blocks
          for (const blockId of replicatedBlocks) {
            try {
              await state.dispatch({
                message: ActionMessages.REMOVE_BLOCK,
                payload: {
                  id: blockId,
                  keep: false,
                },
              });
            } catch (error) {
              console.warn('Error removing replicated block:', error);
            }
          }

          // Create replicated blocks for each event date and map them
          const newReplicatedBlocks: string[] = [];
          const newDateToBlockMap: Record<string, string> = {};
          
          // Map the original child to the first event date
          if (uniqueEventDates.length > 0) {
            newDateToBlockMap[uniqueEventDates[0]] = originalChildId;
          }
          
          for (let i = 1; i < uniqueEventDates.length; i++) {
            const eventDate = uniqueEventDates[i];
            const position = {
              parent: id,
              slot: 'children',
              sibling: originalChildId,
              type: "after" as const,
            };

            try {
              const newBlockId = await state.dispatch({
                message: ActionMessages.ADD_BLOCK,
                payload: {
                  json: getJsonForBlock(originalChildId),
                  position: position,
                },
              });

              if (typeof newBlockId === 'string') {
                newReplicatedBlocks.push(newBlockId);
                newDateToBlockMap[eventDate] = newBlockId;
              }
            } catch (error) {
              console.warn('Error adding replicated block:', error);
            }
          }

          setReplicatedBlocks(newReplicatedBlocks);
          setDateToBlockMap(newDateToBlockMap);
        }
      }
    };

    replicateComponents();
  }, [JSON.stringify(uniqueEventDates), slots.children?.children.length, JSON.stringify(data.source)]);

  // Reset dateToBlockMap when source data changes
  useEffect(() => {
    setDateToBlockMap({});
  }, [JSON.stringify(data.source)]);

  // Helper function to group events by date
  const getEventsForDate = (date: dayjs.Dayjs) => {
    const targetDateString = date.format("YYYY-MM-DD");
    return calendarEvents.filter((event) => {
      const normalizedEventDate = normalizeDateFormat(event.date);
      return normalizedEventDate === targetDateString;
    });
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

  // Debug logging
  console.log('Calendar Debug:', {
    hasSlots: !!slots.children,
    childrenCount: slots.children?.children?.length || 0,
    children: slots.children?.children || [],
    eventsCount: calendarEvents.length,
    calendarEvents: calendarEvents,
    uniqueEventDates: uniqueEventDates,
    dateToBlockMap: dateToBlockMap,
    sourceData: data.source,
    sourceDataSample: data.source ? data.source.slice(0, 3) : null, // Show first 3 items
    mode: state.mode,
    designMode: data.designMode,
    replicatedBlocks: replicatedBlocks
  });

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
          {!isStatic && (!slots.children || slots.children.children.length === 0) && (
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
                setSelectedDate(selectedDate.subtract(1, "month"))
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
                      const parsedDate = dayjs(dateString);
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
              )
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
                    transition: "background-color 0.2s ease, min-height 0.2s ease",
                    display: "flex",
                    flexDirection: "column",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f5f5f5";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#ffffff";
                  }}
                >
                  {/* Date number */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: hasEvents ? "8px" : "auto",
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
                        fontWeight: isToday ? "600" : "400",
                        color: isToday
                          ? "#ffffff"
                          : isCurrentMonth
                          ? "#333"
                          : "#999",
                        backgroundColor: isToday ? "#1976d2" : "transparent",
                      }}
                    >
                      {date.date()}
                    </div>
                  </div>

                  {/* Child components - show based on events and availability */}
                  {(() => {
                    const dateString = date.format("YYYY-MM-DD");
                    const blockId = dateToBlockMap[dateString];
                    const shouldShowChild = slots.children && slots.children.children.length > 0 && 
                      ((isStatic && data.designMode) || (!isStatic && hasEvents) || (isStatic && !data.designMode && hasEvents));
                    
                    if (shouldShowChild) {
                      // Use the specific block for this date if available, otherwise use the first child
                      const childBlockId = blockId || slots.children.children[0];
                      
                      return (
                        <div
                          style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            fontSize: "0.75rem",
                            color: "#666",
                            textAlign: "center",
                            minHeight: "40px",
                            padding: "2px",
                            overflow: isStatic ? "visible" : "hidden",
                          }}
                        >
                          <div
                            style={{
                              maxWidth: "100%",
                              transform: isStatic ? "scale(1)" : "scale(0.75)",
                              transformOrigin: "center",
                              width: isStatic ? "100%" : "133.33%",
                            }}
                          >
                            <Slot slot={{ name: 'children', children: [childBlockId] }} />
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
