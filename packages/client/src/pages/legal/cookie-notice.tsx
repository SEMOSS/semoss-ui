import { observer } from "mobx-react-lite";
import { useRootStore } from "@/hooks";
import { LegalPage } from "./components/legal-page";

export const CookieNotice = observer(() => {
	const { configStore } = useRootStore();

	const html = configStore.theme.cookiePolicyNoticePage;

	return (
		<LegalPage>
			<div
				className="[&_a:hover]:opacity-80 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: server-controlled legal HTML
				dangerouslySetInnerHTML={{ __html: html }}
			/>
		</LegalPage>
	);
});
