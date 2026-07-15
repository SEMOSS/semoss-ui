import type { ConnectionState } from "../types/browserEvents";

interface ConnectionStatusProps {
	state: ConnectionState;
}

const STATE_CONFIG: Record<
	ConnectionState,
	{ label: string; dot: string; tone: string }
> = {
	idle: {
		label: "Idle",
		dot: "bg-slate-500",
		tone: "border-line text-muted",
	},
	connecting: {
		label: "Connecting",
		dot: "bg-warning animate-pulse",
		tone: "border-warning/40 text-warning",
	},
	connected: {
		label: "Live",
		dot: "bg-accent",
		tone: "border-accent/40 text-accent",
	},
	error: {
		label: "Error",
		dot: "bg-danger",
		tone: "border-danger/40 text-danger",
	},
	closed: {
		label: "Disconnected",
		dot: "bg-slate-500",
		tone: "border-line text-muted",
	},
};

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
	state,
}) => {
	const { label, dot, tone } = STATE_CONFIG[state];
	return (
		<div
			className={`flex h-8 items-center gap-2 rounded-md border px-2.5 font-semibold text-xs ${tone}`}
		>
			<span className={`h-2 w-2 rounded-full ${dot}`} />
			{label}
		</div>
	);
};
