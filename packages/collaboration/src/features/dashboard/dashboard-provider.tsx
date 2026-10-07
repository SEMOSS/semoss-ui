import {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { useLocation, useNavigate } from "react-router";
import { Env, useInsight } from "@semoss/sdk/react";
import { toast } from "@semoss/ui/next";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import {
	listCalendarEvents,
	listMail,
} from "@/features/connectors/api/microsoft";
import { roomPath } from "@/lib/workspace-paths";
import { DashboardContext, type SourceSelection } from "./dashboard.context";
import { dashboardStorageKey } from "./dashboard-layout";
import { RoomSourceAssociationsProvider } from "./room-source-associations-provider";
import { useChatHistory } from "./use-chat-history";
import { useDashboardLayout } from "./use-dashboard-layout";
import { useVisibleResource } from "./use-visible-resource";

/** Account-keyed shell data; opening the palette reuses the dashboard's source snapshots. */
export function DashboardProvider({ children }: { children: ReactNode }) {
	const { actions, insightId } = useInsight();
	const { state } = useCollaborationSession();
	const location = useLocation();
	const navigate = useNavigate();
	const account = state.profile.email || state.profile.id;
	const layout = useDashboardLayout(
		dashboardStorageKey(
			account,
			`${window.location.origin}${Env.MODULE}${window.location.pathname}`,
		),
	);
	const history = useChatHistory();
	const [isSearchOpen, setSearchOpen] = useState(false);
	const [source, selectSource] = useState<SourceSelection | null>(null);
	const searchReturnFocus = useRef<HTMLElement | null>(null);
	const sourceReturnFocus = useRef<HTMLElement | null>(null);
	const setIsSearchOpen = useCallback((open: boolean) => {
		if (open && document.activeElement instanceof HTMLElement)
			searchReturnFocus.current = document.activeElement;
		setSearchOpen(open);
	}, []);
	const setSource = useCallback((value: SourceSelection | null) => {
		if (value && document.activeElement instanceof HTMLElement)
			sourceReturnFocus.current = document.activeElement;
		selectSource(value);
	}, []);
	const [openingRoom, setOpeningRoom] = useState<string | null>(null);
	const opening = useRef(0);
	const [refreshRevision, setRefreshRevision] = useState(0);
	useEffect(() => {
		void location.key;
		setOpeningRoom(null);
		return () => {
			opening.current++;
		};
	}, [location.key]);
	const isActive =
		location.pathname === "/" ||
		location.pathname === "/new" ||
		location.pathname.startsWith("/thread/") ||
		isSearchOpen;
	const loadCalendar = useCallback(
		async () => (await listCalendarEvents(actions)).events,
		[actions],
	);
	const loadMail = useCallback(
		async () => (await listMail(actions)).messages,
		[actions],
	);
	const calendar = useVisibleResource(
		loadCalendar,
		isActive && state.settings.sourcesJson.calendar === true,
	);
	const mail = useVisibleResource(
		loadMail,
		isActive && state.settings.sourcesJson.email === true,
	);
	function refreshSources(): void {
		calendar.refresh();
		mail.refresh();
		setRefreshRevision((value) => value + 1);
	}
	const openRoom = async (roomId: string): Promise<void> => {
		const token = ++opening.current;
		setOpeningRoom(roomId);
		try {
			await navigate(roomPath(roomId));
		} catch (cause) {
			if (token === opening.current)
				toast.error(
					cause instanceof Error
						? cause.message
						: "Could not open this chat.",
				);
		} finally {
			if (token === opening.current) setOpeningRoom(null);
		}
	};
	return (
		<DashboardContext.Provider
			value={{
				actions,
				layout,
				history,
				calendar,
				mail,
				refreshSources,
				refreshRevision,
				isSearchOpen,
				setIsSearchOpen,
				searchReturnFocus,
				sourceReturnFocus,
				source,
				setSource,
				openRoom,
				openingRoom,
			}}
		>
			<RoomSourceAssociationsProvider
				key={JSON.stringify([account, insightId])}
				actions={actions}
			>
				{children}
			</RoomSourceAssociationsProvider>
		</DashboardContext.Provider>
	);
}
