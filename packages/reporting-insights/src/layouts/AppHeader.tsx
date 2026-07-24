import { BarChart3, LogOut } from "lucide-react";
import {
	createContext,
	type DependencyList,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { useInsight } from "@semoss/sdk-react";

/**
 * A slim, light top header — the app's only chrome (the dark sidebar was removed).
 * Modeled on the SEMOSS playground: logo on the left, page-specific actions on the
 * right, floating on a soft gradient background.
 *
 * Pages inject their own title/actions via {@link useHeaderSlot} so the editor can
 * surface "title + Save/Publish" here instead of stacking its own toolbar.
 */
export interface HeaderSlot {
	/** Centered content — e.g. the dashboard title input on the editor. */
	center?: ReactNode;
	/** Right-aligned page actions — e.g. Cancel + Save/Publish. */
	actions?: ReactNode;
}

type SetHeaderSlot = (slot: HeaderSlot) => void;

/** Only the setter travels through context (stable identity → no extra re-renders). */
export const HeaderSlotContext = createContext<SetHeaderSlot>(() => {});

/**
 * Push content into the global header for as long as this component is mounted.
 * Pass a dependency list covering every value referenced by the slot nodes.
 */
export function useHeaderSlot(slot: HeaderSlot, deps: DependencyList) {
	const set = useContext(HeaderSlotContext);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => {
		set(slot);
		return () => set({});
	}, deps);
}

export function AppHeader({ slot }: { slot: HeaderSlot }) {
	const { actions } = useInsight();
	const navigate = useNavigate();
	const [loggingOut, setLoggingOut] = useState(false);

	const logout = async () => {
		setLoggingOut(true);
		try {
			await actions.logout();
		} catch {
			/* ignore — navigate to login regardless */
		} finally {
			navigate("/login");
		}
	};

	return (
		<header className="flex h-14 flex-shrink-0 items-center gap-3 border-stone-200/70 border-b bg-white/70 px-4 backdrop-blur-sm">
			<Link
				to="/published"
				className="group flex flex-shrink-0 items-center gap-2"
				title="Dashboards"
			>
				<div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm transition-transform group-hover:scale-105">
					<BarChart3 className="h-4 w-4 text-white" />
				</div>
				<span className="hidden font-semibold text-[15px] text-stone-800 tracking-tight sm:inline">
					Insights
				</span>
			</Link>

			{slot.center ? (
				<>
					<div className="h-6 w-px flex-shrink-0 bg-stone-200" />
					<div className="flex min-w-0 flex-1 items-center">
						{slot.center}
					</div>
				</>
			) : (
				<div className="flex-1" />
			)}

			<div className="flex flex-shrink-0 items-center gap-2">
				{slot.actions}
				{slot.actions && <div className="h-6 w-px bg-stone-200" />}
				<button
					onClick={() => void logout()}
					disabled={loggingOut}
					title="Log out"
					className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-medium text-[13px] text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 disabled:opacity-50"
				>
					<LogOut className="h-4 w-4" />
					<span className="hidden sm:inline">
						{loggingOut ? "Signing out…" : "Log out"}
					</span>
				</button>
			</div>
		</header>
	);
}
