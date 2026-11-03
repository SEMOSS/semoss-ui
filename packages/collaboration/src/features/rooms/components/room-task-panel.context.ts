import { createContext } from "react";
import type { useTaskContext } from "@/features/collaboration/components/task-context";

/** The work item this room belongs to, if any; set once by RoomView. */
export const RoomTaskContext = createContext<ReturnType<
	typeof useTaskContext
> | null>(null);
