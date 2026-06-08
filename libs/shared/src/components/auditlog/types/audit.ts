export interface AuditLog {
	timestamp: number;
	logTimestamp: string;
	request: string;
	tokens: number;
	latency: number;
	status: boolean;
	engineName: string;
	engineType: string;
	methodName: string;
	userId: string;
	sessionId: string;
	spanId: string;
	startTime: string;
	endTime: string;
	response?: string;
}

export const parseArg = (req: string): string => {
	try {
		return JSON.parse(req).arg0;
	} catch {
		return req;
	}
};

export const latencyColor = (v: number): string =>
	v >= 6 ? "text-destructive" : v >= 4 ? "text-warning" : "text-success";

export const latencyBg = (v: number): string =>
	v >= 6 ? "bg-destructive" : v >= 4 ? "bg-warning" : "bg-success";
