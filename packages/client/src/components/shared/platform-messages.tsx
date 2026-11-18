import type React from "react";
import { useEffect, useState } from "react";
import { useSession } from "@semoss/sdk/react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";
import { tryParseJson } from "@semoss/utility/json";
import { isRecord } from "@semoss/utility/object";
import { usePlatformTheme } from "@/hooks/use-platform-theme";
import { RawHtml } from "./raw-html";

/**
 * The storage key for the user's answer to the terms. Each sign in has its own
 * epoch, so the terms are asked again after the next sign in.
 *
 * @param userEpoch - The signed in user's epoch.
 * @returns The key.
 */
const getTermsKey = (userEpoch: string): string => `smss--terms--${userEpoch}`;

/**
 * Read whether the terms were accepted, as stored by {@link PlatformMessages}
 * (`{ state: true }`). Corrupt or unavailable storage counts as not accepted,
 * so the terms are shown again.
 *
 * @param key - The storage key.
 * @returns True when the stored answer accepts the terms.
 */
const readAcceptedTerms = (key: string): boolean => {
	try {
		const item = localStorage.getItem(key);
		if (!item) {
			return false;
		}
		const stored = tryParseJson(item);
		return isRecord(stored) && stored.state === true;
	} catch {
		return false;
	}
};

/**
 * Shows the platform's terms, from the theme, until the signed in user accepts
 * them. The answer is kept in local storage for the current sign in.
 */
export const PlatformMessages: React.FC = () => {
	const { termsHeaderReact, termsReact } = usePlatformTheme();
	const userEpoch = useSession((state) => state.user?.userEpoch ?? "");
	const [acceptedTerms, setAcceptedTerms] = useState<boolean | null>(null);

	const terms = {
		header: termsHeaderReact,
		text: termsReact,
	};

	useEffect(() => {
		if (userEpoch) {
			setAcceptedTerms(readAcceptedTerms(getTermsKey(userEpoch)));
		}
	}, [userEpoch]);

	const acceptTerms = () => {
		if (userEpoch) {
			try {
				localStorage.setItem(
					getTermsKey(userEpoch),
					JSON.stringify({ state: true }),
				);
			} catch (error) {
				// still accepted for this visit; they are asked again next time
				console.error(error);
			}
		}
		setAcceptedTerms(true);
	};

	return (
		<>
			{!acceptedTerms && terms.header && terms.text && (
				<Dialog open={true}>
					<DialogContent aria-describedby={undefined}>
						<DialogHeader>
							<DialogTitle className="font-medium text-base leading-6">
								<RawHtml html={terms.header} />
							</DialogTitle>
						</DialogHeader>
						<RawHtml html={terms.text} />
						<DialogFooter>
							<Button
								onClick={acceptTerms}
								data-testid={"platformMessages-accept-btn"}
							>
								Accept
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}
		</>
	);
};
