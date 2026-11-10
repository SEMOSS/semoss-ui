import { Navigate } from "react-router";
import { usePlatformTheme } from "@/hooks/use-platform-theme";

/**
 * The platform's privacy notice, from its theme. Without one, it goes to the
 * home page.
 */
export const PrivacyNoticePage = () => {
	const html = usePlatformTheme().privacyNoticePage;

	if (!html) {
		return <Navigate to="/" replace />;
	}

	return (
		<div className="flex w-full justify-center px-10 py-14">
			<div className="w-full max-w-[1800px] rounded-md bg-background p-6 shadow-sm">
				<div
					className="[&_a:hover]:opacity-80 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: server-controlled legal HTML
					dangerouslySetInnerHTML={{ __html: html }}
				/>
			</div>
		</div>
	);
};
