import { useEffect, useId, useRef, useState } from "react";
import { Button, Label, P, Switch, Textarea } from "@semoss/ui/next";
import type { InsightActions } from "@/lib/pixel";
import { getWorkContext, saveWorkContext } from "./onboarding-api";

// the server keeps trimmed lines with blank ones dropped
const normalize = (text: string) =>
	text
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)
		.join("\n");

type Status = "idle" | "saving" | "saved" | "error";

/** "Your work": the owner's main areas, saved as they type, so their topics start from their own words. */
export function WorkContextCard({ actions }: { actions: InsightActions }) {
	const id = useId();
	const [text, setText] = useState("");
	const [loaded, setLoaded] = useState(false);
	const [leaveIt, setLeaveIt] = useState(false);
	const [status, setStatus] = useState<Status>("idle");
	const [attempt, setAttempt] = useState(0);
	const saved = useRef("");
	const wanted = useRef("");
	// one write at a time, so an older answer never overwrites a newer edit
	const writes = useRef<Promise<void>>(Promise.resolve());

	const save = (value: string) => {
		writes.current = writes.current.then(async () => {
			if (value === saved.current) return;
			try {
				saved.current = await saveWorkContext(actions, value);
				if (wanted.current === value) setStatus("saved");
			} catch {
				if (wanted.current === value) setStatus("error");
			}
		});
	};

	useEffect(() => {
		let live = true;
		getWorkContext(actions)
			.then((value) => {
				if (!live) return;
				saved.current = value;
				wanted.current = value;
				setText(value);
			})
			.catch(() => {})
			.finally(() => {
				if (live) setLoaded(true);
			});
		return () => {
			live = false;
		};
	}, [actions]);

	// saves a moment after typing stops
	// biome-ignore lint/correctness/useExhaustiveDependencies: attempt re-runs a failed save
	useEffect(() => {
		if (!loaded) return;
		const value = leaveIt ? "" : normalize(text);
		wanted.current = value;
		if (value === saved.current) {
			setStatus((current) => (current === "idle" ? current : "saved"));
			return;
		}
		setStatus("saving");
		const timer = setTimeout(() => save(value), 800);
		return () => clearTimeout(timer);
	}, [text, leaveIt, loaded, attempt]);

	// leaving the step right after typing still keeps the last edit
	// biome-ignore lint/correctness/useExhaustiveDependencies: runs once, on unmount
	useEffect(
		() => () => {
			if (wanted.current !== saved.current) save(wanted.current);
		},
		[],
	);

	return (
		<section
			aria-labelledby={`${id}-title`}
			className="flex flex-col gap-3 rounded-lg border p-4"
		>
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="min-w-0 space-y-1">
					<P id={`${id}-title`} className="font-medium text-sm">
						Your work (optional)
					</P>
					<P className="text-muted-foreground text-sm">
						List your main areas of work, projects, clients or
						teams, one per line. Your topics start from these, and
						Brain fills in the details from your mail.
					</P>
				</div>
				<div className="flex items-center gap-2">
					<Switch
						id={`${id}-leave`}
						checked={leaveIt}
						disabled={!loaded}
						onCheckedChange={setLeaveIt}
					/>
					<Label htmlFor={`${id}-leave`} className="text-sm">
						Let the assistant figure it out
					</Label>
				</div>
			</div>
			{!leaveIt && (
				<>
					<Label htmlFor={`${id}-text`} className="sr-only">
						Your main areas of work
					</Label>
					<Textarea
						id={`${id}-text`}
						rows={5}
						maxLength={6000}
						value={text}
						disabled={!loaded}
						placeholder={
							"For example:\nA client project and its delivery team\nHiring\nOur internal platform"
						}
						onChange={(event) => setText(event.target.value)}
					/>
				</>
			)}
			<div
				aria-live="polite"
				className="min-h-5 text-muted-foreground text-xs"
			>
				{status === "saving" && "Saving..."}
				{status === "saved" &&
					(leaveIt || !normalize(text)
						? "Brain will suggest topics from your mail."
						: "Saved. Your topics will start from these lines.")}
				{status === "error" && (
					<span className="flex items-center gap-2 text-destructive">
						Not saved.
						<Button
							type="button"
							size="sm"
							variant="link"
							className="h-auto p-0"
							onClick={() => setAttempt((n) => n + 1)}
						>
							Try again
						</Button>
					</span>
				)}
			</div>
		</section>
	);
}
