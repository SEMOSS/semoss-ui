import { useEffect, useState } from "react";
import { useSessionInsight } from "@semoss/sdk/react";
import { getErrorMessage } from "@semoss/utility/error";
import {
	type AccessRequestTarget,
	getMyAccessRequest,
	type MyAccessRequest,
	withdrawMyAccessRequest,
} from "@/api/user-access";

/** The signed in user's own waiting access request on an engine or a project */
interface MyAccessRequestState {
	/**
	 * The request that waits for a decision, or null when there is none, before
	 * it is read, and after a read fails
	 */
	request: MyAccessRequest | null;
	/** Whether a read is running */
	isLoading: boolean;
	/** Why the last read failed, or null */
	error: string | null;
	/** Reads the request again, such as after the user asks again */
	refresh: () => void;
	/**
	 * Withdraws the request, then reads it again. Rejects with the backend's
	 * reason when it cannot be withdrawn.
	 */
	withdraw: () => Promise<void>;
}

/** A read, with the engine or project it was made for */
interface RequestRead {
	/** The target and id, as `PROJECT:id` */
	key: string;
	/** What was read */
	request: MyAccessRequest | null;
}

/**
 * Reads the signed in user's own access request on an engine or a project that
 * waits for an owner's decision, so the page can show what they asked for and
 * let them change or withdraw it. A read for another engine or project is never
 * returned as this one's.
 *
 * @param target - whether the id is an engine's or a project's
 * @param id - the engine or project id
 * @param isEnabled - whether to read at all; an owner has nothing to ask for
 * @returns the request, the read's state, and the actions on it
 */
export const useMyAccessRequest = (
	target: AccessRequestTarget,
	id: string,
	isEnabled: boolean,
): MyAccessRequestState => {
	const { insightId } = useSessionInsight();
	const [readCount, setReadCount] = useState(0);
	const [read, setRead] = useState<RequestRead | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const key = `${target}:${id}`;

	useEffect(() => {
		if (!isEnabled || !id || !insightId || readCount < 0) {
			return;
		}
		const readKey = `${target}:${id}`;
		let isStale = false;
		setIsLoading(true);
		setError(null);
		getMyAccessRequest(insightId, target, id)
			.then((request) => {
				if (!isStale) {
					setRead({ key: readKey, request });
				}
			})
			.catch((e: unknown) => {
				if (!isStale) {
					setRead({ key: readKey, request: null });
					setError(getErrorMessage(e, "No reason was given."));
				}
			})
			.finally(() => {
				if (!isStale) {
					setIsLoading(false);
				}
			});
		return () => {
			isStale = true;
		};
	}, [target, id, insightId, isEnabled, readCount]);

	const refresh = () => setReadCount((count) => count + 1);

	return {
		request:
			isEnabled && read !== null && read.key === key
				? read.request
				: null,
		isLoading,
		error,
		refresh,
		withdraw: async () => {
			await withdrawMyAccessRequest(insightId, target, id);
			refresh();
		},
	};
};
