import { createContext, createElement, type ReactNode } from "react";
import { useRequiredContext } from "@/app/use-required-context";

export interface RoomContext {
	openRoomsList: () => void;
}

const RoomContextValue = createContext<RoomContext | null>(null);

export function RoomProvider({
	value,
	children,
}: {
	value: RoomContext;
	children: ReactNode;
}) {
	return createElement(RoomContextValue.Provider, { value }, children);
}

export function useRoom() {
	return useRequiredContext(RoomContextValue, "useRoom");
}
