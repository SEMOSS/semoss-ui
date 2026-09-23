import { observer } from "mobx-react-lite";
import type React from "react";
import { useEffect, useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";
import { useSessionTheme } from "@/hooks";
import { PrivacyPreferenceCenterModal } from "./privacy-preference-center-modal";

interface CookieWrapperProps {
	/** Content to overlay the Loading Screen on */
	children: React.ReactNode;
}

const cookieName = `smss-optional-cookie`;

export const CookieWrapper = observer((props: CookieWrapperProps) => {
	const { children } = props;
	const cookiePolicyBannerReact = useSessionTheme(
		(theme) => theme.cookiePolicyBannerReact,
	);

	const [visible, setVisible] = useState(false);
	const [viewCookiePolicy, setViewCookiePolicy] = useState(false);

	const [cookieBanner, setCookieBanner] = useState("");

	useEffect(() => {
		const permissionGranted = localStorage.getItem(cookieName);

		if (!permissionGranted) {
			try {
				if (cookiePolicyBannerReact) {
					setCookieBanner(cookiePolicyBannerReact);
					setVisible(true);
				}
			} catch {
				console.error("Unable to parse theme for cookie wrapper");
			}
		}

		return () => {
			setVisible(false);
		};
	}, [cookiePolicyBannerReact]);

	const acceptCookies = () => {
		localStorage.setItem(cookieName, JSON.stringify(true));

		setViewCookiePolicy(false);
		setVisible(false);
	};

	return (
		<>
			{children}
			<Dialog open={visible && !viewCookiePolicy}>
				<DialogContent
					showCloseButton={false}
					aria-describedby="cookie-policy-banner"
					onEscapeKeyDown={(event) => event.preventDefault()}
					onPointerDownOutside={(event) => event.preventDefault()}
				>
					<DialogHeader>
						<DialogTitle className="font-medium text-base leading-6">
							Here&apos;s how we use cookies
						</DialogTitle>
					</DialogHeader>
					{/* biome-ignore lint/correctness/useUniqueElementIds: single application cookie banner */}
					<div
						className="text-sm [&_a:hover]:opacity-80 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4"
						id="cookie-policy-banner"
						// biome-ignore lint/security/noDangerouslySetInnerHtml: third-party cookie script content
						dangerouslySetInnerHTML={{ __html: cookieBanner }}
					/>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setViewCookiePolicy(true)}
						>
							View cookies
						</Button>
						<Button onClick={acceptCookies}>
							Accept and close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<PrivacyPreferenceCenterModal
				isOpen={viewCookiePolicy}
				onClose={() => setViewCookiePolicy(false)}
			/>
		</>
	);
});
