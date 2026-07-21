import { useEffect, useState } from "react";
import { Button } from "@semoss/ui/next";
import type { EnvironmentConfig } from "../../electron/connections/types";
import loginIllustration from "./assets/img/login.svg";
import loginIllustrationDark from "./assets/img/login-darkmode.png";
import { SemossIcon } from "./semoss-icon";

export interface ConnectionsPageProps {
	/** Full-screen sign-in gate vs. a compact "signed in as" row inside Settings. */
	variant?: "full" | "compact";
}

/** Decorative only — cycles through a few example prompts on the sign-in
 * screen's illustration side to hint at the product before signing in. */
const EXAMPLE_PROMPTS = [
	"Summarize this quarter's vendor spend",
	"Draft an onboarding checklist for new hires",
	"What changed in our churn cohort this month?",
	"Pull renewal dates for contracts expiring soon",
];

/**
 * Which SEMOSS environment this app talks to (alias, instance URL, module
 * path) is a build-time decision — electron/config/environment.json — not
 * something a user enters here. This component only ever asks "who are
 * you": variant="full" is the sign-in gate shown before a session exists;
 * variant="compact" is a simple "signed in as {alias}" + Sign Out row
 * inside the Settings dialog, shown only once already signed in.
 */
export const ConnectionsPage = ({ variant = "full" }: ConnectionsPageProps) => {
	const [environment, setEnvironment] = useState<EnvironmentConfig | null>(
		null,
	);
	const [browserLoginId, setBrowserLoginId] = useState<string | null>(null);
	const [browserLoginBusy, setBrowserLoginBusy] = useState(false);
	const [signingOut, setSigningOut] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		void window.semossDesktop.connections
			.getEnvironment()
			.then(setEnvironment);
	}, []);

	const handleSignIn = async () => {
		setError(null);
		try {
			const loginId =
				await window.semossDesktop.connections.beginBrowserLogin();
			setBrowserLoginId(loginId);
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		}
	};

	const handleCompleteBrowserLogin = async () => {
		if (!browserLoginId) {
			return;
		}
		setError(null);
		setBrowserLoginBusy(true);
		try {
			// On success the main process also reloads this window — nothing
			// further to do here beyond resetting local state.
			await window.semossDesktop.connections.completeBrowserLogin(
				browserLoginId,
			);
			setBrowserLoginId(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setBrowserLoginBusy(false);
		}
	};

	const handleCancelBrowserLogin = async () => {
		if (browserLoginId) {
			await window.semossDesktop.connections.cancelBrowserLogin(
				browserLoginId,
			);
		}
		setBrowserLoginId(null);
		setError(null);
	};

	const handleSignOut = async () => {
		setSigningOut(true);
		try {
			await window.semossDesktop.connections.signOut();
		} finally {
			setSigningOut(false);
		}
	};

	if (variant === "compact") {
		return (
			<div className="flex flex-col gap-3 rounded-md border border-border bg-card p-4">
				<div>
					<p className="font-medium text-sm">
						{environment?.alias ?? "…"}
					</p>
					<p className="text-muted-foreground text-xs">
						{environment?.instanceUrl}
					</p>
				</div>
				<Button
					variant="outline"
					className="self-start"
					disabled={signingOut}
					onClick={handleSignOut}
				>
					{signingOut ? "Signing out…" : "Sign Out"}
				</Button>
			</div>
		);
	}

	return (
		<div className="flex h-full">
			<div className="flex flex-1 flex-col items-center justify-center gap-6 p-10 text-center">
				<div className="signin-brand flex flex-col items-center gap-2">
					<SemossIcon width={38} height={44} />
					<span className="font-bold text-sm tracking-wide">
						AI Core
					</span>
				</div>
				<div className="signin-heading">
					<h1 className="text-balance font-semibold text-2xl">
						Welcome back
					</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						Sign in to continue to your workspace.
					</p>
				</div>

				{error ? (
					<div className="w-full max-w-[300px] rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive text-sm">
						{error}
					</div>
				) : null}

				{browserLoginId === null ? (
					<div className="signin-card flex w-full max-w-[300px] flex-col gap-3">
						<Button
							className="w-full"
							disabled={!environment}
							onClick={handleSignIn}
						>
							Sign In
						</Button>
						<p className="text-muted-foreground text-xs">
							Opens your organization's sign-in page in a secure
							window — supports both native login and SSO. Nothing
							to configure here.
						</p>
					</div>
				) : (
					<div className="signin-card flex w-full max-w-[300px] flex-col gap-3">
						<p className="text-muted-foreground text-sm">
							A sign-in window opened — finish signing in there.
							This connects automatically once you're signed in;
							if it doesn't after a few seconds, click Continue.
						</p>
						<div className="flex justify-center gap-2">
							<Button
								variant="ghost"
								disabled={browserLoginBusy}
								onClick={handleCancelBrowserLogin}
							>
								Cancel
							</Button>
							<Button
								disabled={browserLoginBusy}
								onClick={handleCompleteBrowserLogin}
							>
								{browserLoginBusy ? "Checking…" : "Continue"}
							</Button>
						</div>
					</div>
				)}
			</div>

			<div className="signin-illustration relative hidden flex-1 overflow-hidden bg-muted lg:block">
				<img
					src={loginIllustration}
					alt=""
					className="absolute inset-0 h-full w-full object-cover dark:hidden"
				/>
				<img
					src={loginIllustrationDark}
					alt=""
					className="absolute inset-0 hidden h-full w-full object-cover dark:block"
				/>
				<div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
				<CyclingPromptCard />
			</div>

			<style>{`
				@keyframes signinMarkPopIn { 0% { opacity: 0; transform: scale(0.7); } 65% { opacity: 1; transform: scale(1.08); } 100% { opacity: 1; transform: scale(1); } }
				@keyframes signinRiseIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
				@keyframes signinIllusFadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
				.signin-brand { animation: signinMarkPopIn 640ms cubic-bezier(0.34, 1.56, 0.64, 1) both; }
				.signin-heading { animation: signinRiseIn 420ms cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: 180ms; }
				.signin-card { animation: signinRiseIn 420ms cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: 320ms; }
				.signin-illustration { animation: signinIllusFadeIn 700ms cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: 140ms; }
				@media (prefers-reduced-motion: reduce) {
					.signin-brand, .signin-heading, .signin-card, .signin-illustration { animation: none; }
				}
			`}</style>
		</div>
	);
};

/** Purely decorative — not a real input, never submits anywhere. Typewriter-
 * cycles through EXAMPLE_PROMPTS to hint at the product on the sign-in
 * screen's illustration side. */
const CyclingPromptCard = () => {
	const [text, setText] = useState(EXAMPLE_PROMPTS[0]);

	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			return;
		}

		let promptIndex = 0;
		let charIndex = 0;
		let deleting = false;
		let timer: ReturnType<typeof setTimeout>;

		const tick = () => {
			const current = EXAMPLE_PROMPTS[promptIndex];
			if (!deleting) {
				charIndex++;
				setText(current.slice(0, charIndex));
				if (charIndex === current.length) {
					deleting = true;
					timer = setTimeout(tick, 1500);
					return;
				}
				timer = setTimeout(tick, 32);
			} else {
				charIndex--;
				setText(current.slice(0, charIndex));
				if (charIndex === 0) {
					deleting = false;
					promptIndex = (promptIndex + 1) % EXAMPLE_PROMPTS.length;
					timer = setTimeout(tick, 300);
					return;
				}
				timer = setTimeout(tick, 16);
			}
		};
		timer = setTimeout(tick, 32);
		return () => clearTimeout(timer);
	}, []);

	return (
		<div className="-translate-x-1/2 absolute bottom-[8%] left-1/2 w-[80%] max-w-[300px] rounded-xl border border-border bg-background/95 px-3 py-2.5 shadow-lg backdrop-blur-sm">
			<p className="truncate text-left text-muted-foreground text-sm">
				{text}
				<span className="ml-0.5 animate-pulse text-primary">|</span>
			</p>
		</div>
	);
};
