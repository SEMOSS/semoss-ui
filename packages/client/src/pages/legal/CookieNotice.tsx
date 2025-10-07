import { observer } from "mobx-react-lite";
import { useRootStore } from "@/hooks";
import { LegalPage } from "./components/legalPage";

export const CookieNotice = observer(() => {
	const { configStore } = useRootStore();

	const html = configStore.theme.cookiePolicyNoticePage;

	return (
		<LegalPage>
			<div dangerouslySetInnerHTML={{ __html: html }} />
		</LegalPage>
	);
});
