import { createContext } from "react";
import type { RoomTopicsState } from "../use-room-topics";

/** The chat's topics, read once by RoomView and shared with the header chips, the topic work tab and the drawer. */
export const RoomTopicsContext = createContext<RoomTopicsState | null>(null);
