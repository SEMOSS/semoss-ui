import { useCallback, useEffect, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import { sleep } from "@semoss/utility/async";
import { getJob, type Job, mapJob } from "@/features/onboarding/onboarding-api";
import {
	type InterviewAsking,
	type InterviewCall,
	type InterviewDone,
	type InterviewSource,
	interviewStep,
} from "./api/persona-interview";

// how often a job the server runs in the background is looked at
const POLL_MS = 2000;

/** What the interview page shows. */
export type InterviewView =
	/** The first read of where the interview is. */
	| { phase: "loading" }
	/** That read failed; `error` says why. */
	| { phase: "problem" }
	/** No interview yet: the owner is asked what it may read. */
	| { phase: "none" }
	/** The server is reading how the owner writes, or writing their persona. */
	| { phase: "reading" | "writing"; job: Job }
	/** The persona could not be written; the answers are kept. */
	| { phase: "unwritten"; reason: string }
	| InterviewAsking
	/** The answer to `back` is on its way; `back` returns if it does not get there. */
	| { phase: "thinking"; line: string; back: InterviewAsking }
	| InterviewDone;

interface PersonaInterview {
	view: InterviewView;
	/** Why the last call failed; empty while one is under way and once one works. */
	error: string;
	/** Start the interview over, first reading how the owner writes from these places. */
	start: (sources: InterviewSource[]) => void;
	/** Answer the step that waits; `line` is what to say while the next one is written. */
	answer: (answer: Record<string, unknown>, line?: string) => void;
	/** Go straight to the closing steps. */
	wrapUp: () => void;
	/** Read where the interview is again, after a call that failed. */
	reload: () => void;
	/** Back to the question of what it may read, without changing anything yet. */
	startOver: () => void;
}

/**
 * The interview that writes the signed-in person's persona, one call at a
 * time: where it is, the step that waits, and the two long parts the server
 * runs in the background, which are followed until they end. Only the latest
 * call lands.
 *
 * @param shouldGoOn - Open an interview that was wrapped up at the steps it
 * left out, instead of at what it wrote.
 */
export function usePersonaInterview(shouldGoOn: boolean): PersonaInterview {
	const { actions } = useInsight();
	const [view, setView] = useState<InterviewView>({ phase: "loading" });
	const [error, setError] = useState("");
	// the call whose answer may still land; a later call or leaving the page outdates it
	const request = useRef(0);

	const send = useCallback(
		async (call: InterviewCall, line = ""): Promise<void> => {
			const ticket = ++request.current;
			const isLatest = (): boolean => ticket === request.current;
			setError("");
			setView((current) =>
				current.phase === "asking"
					? { phase: "thinking", line, back: current }
					: current.phase === "thinking"
						? current
						: { phase: "loading" },
			);
			try {
				let answer = await interviewStep(actions, call);
				while (
					answer.phase === "reading" ||
					answer.phase === "writing"
				) {
					const phase = answer.phase;
					let job = mapJob(answer.job);
					while (job.status === "running") {
						if (!isLatest()) return;
						setView({ phase, job });
						await sleep(POLL_MS);
						job = await getJob(actions, "persona", job.id);
					}
					if (!isLatest()) return;
					if (phase === "writing" && job.status === "failed") {
						setView({
							phase: "unwritten",
							reason:
								job.error ||
								"Your persona could not be written.",
						});
						return;
					}
					// a reading that ended, however it ended, is followed by the first step: the server says what it could not read
					answer = await interviewStep(actions);
				}
				if (isLatest()) setView(answer);
			} catch (cause) {
				if (!isLatest()) return;
				setError(
					cause instanceof Error
						? cause.message
						: "That did not work.",
				);
				// back to the step that was answered, with the answer still in it
				setView((current) =>
					current.phase === "thinking"
						? current.back
						: { phase: "problem" },
				);
			}
		},
		[actions],
	);

	useEffect(() => {
		void send(shouldGoOn ? { wrap: false } : {});
		return () => {
			request.current += 1;
		};
	}, [send, shouldGoOn]);

	return {
		view,
		error,
		start: (sources) =>
			void send({ sources: sources.length > 0 ? sources : ["none"] }),
		answer: (answer, line) => void send({ answer }, line),
		wrapUp: () =>
			void send(
				{ wrap: true },
				view.phase === "asking" ? view.wrapWait : "",
			),
		reload: () => void send({}),
		startOver: () => {
			request.current += 1;
			setError("");
			setView({ phase: "none" });
		},
	};
}
