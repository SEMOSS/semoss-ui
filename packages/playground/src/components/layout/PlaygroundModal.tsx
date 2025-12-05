import { observer } from "mobx-react-lite";
import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@semoss/ui/next";
import { useRoot } from "@/hooks";

const COOKIE_KEY = "playgroundModalAck";
const COOKIE_DAYS = 365;

function getCookie(name: string): string | null {
	const match = document.cookie
		.split("; ")
		.find((row) => row.startsWith(`${name}=`));
	return match ? decodeURIComponent(match.split("=")[1]) : null;
}

function setCookie(name: string, value: string, days = COOKIE_DAYS) {
	const expires = new Date();
	expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
	// biome-ignore lint/suspicious/noDocumentCookie: fixme
	document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/`;
}

export const PlaygroundModal: React.FC = observer(() => {
	const { root } = useRoot();
	const modal = root?.theme?.playground?.playgroundModal;
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		// Only show if modal content exists and cookie not set
		if (!modal) return;
		if (!modal.header && !modal.message) return;
		if (getCookie(COOKIE_KEY)) return;
		// show on initial mount (first navigation into layout)
		setVisible(true);
	}, [modal, modal?.header, modal?.message]);

	if (!modal) return null;
	if (!visible) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
			role="dialog"
			aria-modal="true"
			data-testid="playground-modal"
		>
			<div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
				{modal.header ? (
					<h2 className="mb-2 font-semibold text-lg">
						{modal.header}
					</h2>
				) : null}
				{modal.message ? (
					<p className="mb-4 whitespace-pre-wrap text-gray-700 text-sm">
						{modal.message}
					</p>
				) : null}
				<div className="flex justify-end gap-2">
					<Button
						variant={"outline"}
						onClick={() => setVisible(false)}
					>
						Close
					</Button>
					<Button
						variant={"default"}
						onClick={() => {
							setCookie(COOKIE_KEY, "1");
							setVisible(false);
						}}
						data-testid="playground-modal-ack"
					>
						Acknowledge
					</Button>
				</div>
			</div>
		</div>
	);
});
