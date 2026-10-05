import { useEffect, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import { getErrorMessage } from "@semoss/utility/error";
import { exportUsageReport } from "@/api/enterprise-usage";
import type { UsageExportRequest } from "./usage.types";

/** Shares export progress and error handling across report, ranking, and log actions. */
export function useUsageExport(): {
	isExporting: boolean;
	exportError: string;
	exportStatus: string;
	exportReport: (request: UsageExportRequest) => Promise<void>;
} {
	const { insightId } = useInsight();
	const [isExporting, setIsExporting] = useState(false);
	const [exportError, setExportError] = useState("");
	const [exportStatus, setExportStatus] = useState("");
	const isMounted = useRef(true);
	const isPending = useRef(false);
	useEffect(() => {
		isMounted.current = true;
		return () => {
			isMounted.current = false;
		};
	}, []);
	const exportReport = async (request: UsageExportRequest): Promise<void> => {
		if (isPending.current) return;
		isPending.current = true;
		setIsExporting(true);
		setExportError("");
		setExportStatus("");
		try {
			await exportUsageReport(request, insightId);
			if (isMounted.current)
				setExportStatus(
					"Download Requested. The Report Includes Its Applied Scope And Any Unavailable Sources.",
				);
		} catch (error) {
			if (isMounted.current)
				setExportError(
					getErrorMessage(error, "Unable To Export Report"),
				);
		} finally {
			isPending.current = false;
			if (isMounted.current) setIsExporting(false);
		}
	};
	return { isExporting, exportError, exportStatus, exportReport };
}
