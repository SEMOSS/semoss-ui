import { createContext } from "react";
import type { RootStore } from "@/stores";

export const RootContext = createContext<RootStore | undefined>(undefined);
