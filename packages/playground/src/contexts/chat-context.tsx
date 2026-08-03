import { createContext } from "react";
import type { ChatStore } from "@/stores";

export const ChatContext = createContext<ChatStore | undefined>(undefined);
