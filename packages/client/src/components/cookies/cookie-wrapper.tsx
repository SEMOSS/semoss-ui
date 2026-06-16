import { X } from "lucide-react";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@semoss/ui/next";
import { useRootStore } from "@/hooks";
import { PrivacyPreferenceCenterModal } from "./privacy-preference-center-modal";

interface CookieWrapperProps {
	/** Content to overlay the Loading Screen on */
	children: React.ReactNode;
}

export const cookieName = `smss-optional-cookie`;

export const CookieWrapper = observer((props: CookieWrapperProps) => {
	const { children } = props;
	const { configStore } = useRootStore();

	const [visible, setVisible] = useState(false);
	const [viewCookiePolicy, setViewCookiePolicy] = useState(false);

	const [cookieBanner, setCookieBanner] = useState("");

	useEffect(() => {
		const permissionGranted = localStorage.getItem(cookieName);

		if (!permissionGranted) {
			try {
				const themeCookieBanner =
					configStore.theme.cookiePolicyBannerReact;

				if (themeCookieBanner) {
					setCookieBanner(themeCookieBanner);
					setVisible(true);
				}
			} catch {
				console.error("Unable to parse theme for cookie wrapper");
			}
		}

		return () => {
			setVisible(false);
		};
	}, [configStore.theme.cookiePolicyBannerReact]);

	const acceptCookies = () => {
		localStorage.setItem(cookieName, JSON.stringify(true));

		setViewCookiePolicy(false);
		setVisible(false);
	};

	return (
		<>
			{children}
			{visible && !viewCookiePolicy && (
				<>
					<div className="fixed inset-0 z-[999] bg-black/50" />
					<div className="fixed bottom-8 left-[calc(50%-250px)] z-[1000] w-[500px] rounded-md border border-border bg-background p-6">
						<div className="mb-3 flex flex-row items-center justify-between gap-2">
							<h6 className="font-bold text-base text-foreground">
								Here&apos;s how we use cookies
							</h6>

							<Button
								variant="ghost"
								size="icon-sm"
								onClick={acceptCookies}
							>
								<X className="size-4" />
							</Button>
						</div>

						<div className="flex justify-center">
							{/* biome-ignore lint/correctness/useUniqueElementIds: IDs are scoped to component instances */}
							<div
								className="w-full [&_a:hover]:opacity-80 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4"
								id="cookie-policy-banner"
								// biome-ignore lint/security/noDangerouslySetInnerHtml: third-party cookie script content
								dangerouslySetInnerHTML={{
									__html: cookieBanner,
								}}
							/>
						</div>
						<div className="flex flex-row justify-center">
							<Button
								variant="ghost"
								onClick={() => {
									setViewCookiePolicy(true);
								}}
							>
								View cookies
							</Button>
						</div>
					</div>
				</>
			)}

			<PrivacyPreferenceCenterModal
				isOpen={viewCookiePolicy}
				onClose={() => setViewCookiePolicy(false)}
			/>
		</>
	);
});
