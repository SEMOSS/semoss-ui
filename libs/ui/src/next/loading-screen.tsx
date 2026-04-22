import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

type LoadingScreenContextType = {
	loading: boolean;
	start: (message?: React.ReactNode, description?: React.ReactNode) => void;
	stop: () => void;
	set: (
		open: boolean,
		message?: React.ReactNode,
		description?: React.ReactNode,
	) => void;
};

const LoadingScreenContext = createContext<
	LoadingScreenContextType | undefined
>(undefined);

export function useLoadingScreen() {
	const ctx = useContext(LoadingScreenContext);
	if (!ctx)
		throw new Error("useLoadingScreen must be used within a LoadingScreen");
	return ctx;
}

interface LoadingScreenProps {
	relative?: boolean;
	children: React.ReactNode;
}

function LoadingScreenRoot({ relative = false, children }: LoadingScreenProps) {
	const [count, setCount] = useState(0);
	const [message, setMessage] = useState<React.ReactNode>(null);
	const [description, setDescription] = useState<React.ReactNode>(null);

	const loading = count > 0;

	const start = useCallback(
		(msg: React.ReactNode = "Loading", desc?: React.ReactNode) => {
			setMessage(msg);
			if (desc) setDescription(desc);
			setCount((c) => c + 1);
		},
		[],
	);

	const stop = useCallback(() => {
		setCount((c) => Math.max(0, c - 1));
	}, []);

	const set = useCallback(
		(open: boolean, msg?: React.ReactNode, desc?: React.ReactNode) => {
			if (open) {
				start(msg, desc);
			} else {
				setCount(0);
			}
		},
		[start],
	);

	return (
		<LoadingScreenContext.Provider value={{ loading, start, stop, set }}>
			{loading && (
				<div
					className={cn(
						"z-[1501] flex items-center justify-center bg-white/50",
						relative ? "absolute inset-0" : "fixed inset-0",
					)}
				>
					<div className="flex flex-col items-center gap-2">
						<Spinner className="size-8" />
						{message && <p className="text-sm">{message}</p>}
						{description && (
							<p className="text-muted-foreground text-xs">
								{description}
							</p>
						)}
					</div>
				</div>
			)}
			{children}
		</LoadingScreenContext.Provider>
	);
}

interface TriggerProps {
	message?: React.ReactNode;
	description?: React.ReactNode;
}

function LoadingScreenTrigger({ message, description }: TriggerProps) {
	const { set } = useLoadingScreen();

	useEffect(() => {
		set(true, message, description);
		return () => set(false);
	}, [message, description, set]);

	return null;
}

export const LoadingScreen = Object.assign(LoadingScreenRoot, {
	Trigger: LoadingScreenTrigger,
});
