import type { ReactNode } from "react";
import { useSession } from "@semoss/sdk/react";
import { Spinner, useTheme } from "@semoss/ui/next";
import { LoginForm } from "./form/login-form";
import { SessionError } from "./session-error";

interface LoginPageProps {
	/**
	 * Branding to show above the form on the left column (logo, app name).
	 * Optional — omit if you don't want the top branding row at all.
	 */
	branding?: ReactNode;

	/**
	 * Right-column hero image (shown only on `lg+` viewports). When neither
	 * `imageSrc` nor `imageSrcDark` is provided, the right column is dropped
	 * entirely and the form fills the screen.
	 */
	imageSrc?: string;
	/** Dark-mode variant of `imageSrc`. Falls back to `imageSrc` when unset. */
	imageSrcDark?: string;

	/**
	 * Content rendered once the user is authorized — i.e. the actual app.
	 * While not authorized, the login screen is shown instead.
	 */
	children: ReactNode;
}

/**
 * Drop-in auth gate. Wrap your app's root with this and the user will see the
 * shared login form until the SDK's `Session` is signed in, at which point the
 * wrapped children render. It needs no provider.
 *
 * Example:
 *
 *     <ThemeProvider defaultTheme="light" storageKey="...">
 *       <LoginPage branding={<AppLogo />} imageSrc={...}>
 *         <YourApp />
 *       </LoginPage>
 *     </ThemeProvider>
 */
export const LoginPage = ({
	branding,
	imageSrc,
	imageSrcDark,
	children,
}: LoginPageProps) => {
	const status = useSession((state) => state.status);
	const { theme: colorMode } = useTheme();

	// While the session is still being read, show a centered spinner so the
	// page doesn't flash login + then app.
	if (status === "INITIALIZING") {
		return (
			<div className="flex h-svh w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	if (status === "AUTHENTICATED") {
		return <>{children}</>;
	}

	// the user may still be signed in, so offer to read the session again
	if (status === "ERROR") {
		return <SessionError />;
	}

	const isDark =
		colorMode === "dark" ||
		(colorMode === "system" &&
			typeof window !== "undefined" &&
			window.matchMedia("(prefers-color-scheme: dark)").matches);
	const resolvedImage = isDark ? imageSrcDark || imageSrc : imageSrc;
	const hasImage = Boolean(resolvedImage);

	return (
		<div
			className={
				hasImage
					? "grid min-h-svh lg:grid-cols-2"
					: "flex min-h-svh items-center justify-center"
			}
		>
			<div
				className={
					hasImage
						? "flex flex-col gap-4 p-6 md:p-10"
						: "flex w-full max-w-xs flex-col gap-4 p-6"
				}
			>
				{branding && (
					<div className="flex justify-center gap-2 md:justify-start">
						<div className="flex items-center gap-2 font-medium">
							{branding}
						</div>
					</div>
				)}
				<div
					className={
						hasImage
							? "flex flex-1 items-center justify-center"
							: "flex flex-1 items-center justify-center pt-4"
					}
				>
					<div className="w-full max-w-xs">
						<LoginForm />
					</div>
				</div>
			</div>
			{hasImage && (
				<div className="relative hidden bg-muted lg:block">
					<img
						src={resolvedImage}
						alt=""
						aria-hidden="true"
						className="absolute inset-0 h-full w-full select-none object-cover"
					/>
				</div>
			)}
		</div>
	);
};
