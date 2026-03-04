import { observer } from "mobx-react-lite";
import { createPortal } from "react-dom";
import { usePage } from "@/hooks";

const NAVBAR_LEFT = `#navbar--left`;

interface NavbarLeftProps {
	/** Children to render */
	children: React.ReactNode;
}

export const NavbarLeft: React.FC<NavbarLeftProps> = observer(
	({ children }) => {
		const { page } = usePage();

		if (!page.navbar.element) {
			return null;
		}

		const portalEle = page.navbar.element.querySelector(NAVBAR_LEFT);
		if (!portalEle) {
			return null;
		}

		return <>{createPortal(children, portalEle)}</>;
	},
);
