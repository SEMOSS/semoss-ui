import { createContext } from "react";

/** Titles shown inside the month cells; full rows live in the day's agenda. */
export const ConnectorCalendarContext = createContext<
	ReadonlyMap<string, string[]>
>(new Map());
