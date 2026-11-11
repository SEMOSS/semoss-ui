import type { FindReplaceRequest } from "docx-react-viewer";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, Input } from "@semoss/ui/next";
import { OfficeActionButton } from "./office-action-button";

interface WordFindBarProps {
	request: FindReplaceRequest;
	readOnly: boolean;
	onClose: () => void;
}

/** Non-modal find controls leave the document mounted and permit read-only search. */
export const WordFindBar = ({
	request,
	readOnly,
	onClose,
}: WordFindBarProps) => {
	const [query, setQuery] = useState(request.status.query);
	const [replacement, setReplacement] = useState("");
	const [status, setStatus] = useState(request.status);
	const input = useRef<HTMLInputElement>(null);
	useEffect(() => {
		input.current?.focus();
	}, []);
	return (
		<search
			className="flex shrink-0 flex-wrap items-center gap-2 border-border border-b p-2"
			aria-label="Find in document"
		>
			<Input
				ref={input}
				className="w-48"
				aria-label="Find text"
				value={query}
				onChange={(event) => {
					setQuery(event.target.value);
					setStatus(request.search(event.target.value));
				}}
				onKeyDown={(event) => {
					if (event.key === "Enter") {
						event.preventDefault();
						if (event.shiftKey) request.findPrevious();
						else request.findNext();
						setStatus(request.status);
					}
					if (event.key === "Escape") onClose();
				}}
			/>
			<OfficeActionButton
				label="Previous match"
				icon={ChevronUp}
				disabled={!status.count}
				onAction={() => {
					request.findPrevious();
					setStatus(request.status);
				}}
			/>
			<OfficeActionButton
				label="Next match"
				icon={ChevronDown}
				disabled={!status.count}
				onAction={() => {
					request.findNext();
					setStatus(request.status);
				}}
			/>
			<output className="text-muted-foreground text-sm">
				{status.count
					? `${status.active + 1} of ${status.count}`
					: "No matches"}
			</output>
			<Input
				className="w-48"
				aria-label="Replace with"
				value={replacement}
				disabled={readOnly || !request.canReplace}
				onChange={(event) => setReplacement(event.target.value)}
			/>
			<Button
				size="sm"
				variant="outline"
				disabled={readOnly || !request.canReplace || !status.count}
				onClick={() => {
					request.replaceOne(replacement);
					setStatus(request.status);
				}}
			>
				Replace
			</Button>
			<Button
				size="sm"
				variant="outline"
				disabled={readOnly || !request.canReplace || !status.count}
				onClick={() => {
					request.replaceAll(replacement);
					setStatus(request.status);
				}}
			>
				Replace all
			</Button>
			<OfficeActionButton
				label="Close find"
				icon={X}
				onAction={onClose}
			/>
		</search>
	);
};
