import { useEffect, useState } from "react";
import { getResourcePermissions, type ResourcePermissions } from "@semoss/sdk";

interface EngineUsageAccessResult {
	access: ResourcePermissions | null;
	isLoading: boolean;
	error: string | null;
	reload: () => void;
}

/** Loads authoritative grant policies/capabilities, rejecting stale engine/admin results. */
export const useEngineUsageAccess = (
	engineId: string | null,
	admin = false,
): EngineUsageAccessResult => {
	const [revision, setRevision] = useState(0);
	const [result, setResult] = useState<{
		engineId: string;
		admin: boolean;
		revision: number;
		access: ResourcePermissions | null;
		error: string | null;
	} | null>(null);
	useEffect(() => {
		if (!engineId) return;
		let isStale = false;
		getResourcePermissions({ resourceType: "ENGINE", id: engineId }, admin)
			.then((access) => {
				if (!access.engineUsage)
					throw new Error(
						"This server did not provide engine usage capabilities",
					);
				if (!isStale)
					setResult({
						engineId,
						admin,
						revision,
						access,
						error: null,
					});
			})
			.catch(() => {
				if (!isStale)
					setResult({
						engineId,
						admin,
						revision,
						access: null,
						error: "Unable to load engine usage limits. Try again before changing access.",
					});
			});
		return () => {
			isStale = true;
		};
	}, [engineId, admin, revision]);
	const current =
		engineId &&
		result?.engineId === engineId &&
		result.admin === admin &&
		result.revision === revision
			? result
			: null;
	return {
		access: current?.access ?? null,
		error: current?.error ?? null,
		isLoading: engineId !== null && current === null,
		reload: () => setRevision((value) => value + 1),
	};
};
