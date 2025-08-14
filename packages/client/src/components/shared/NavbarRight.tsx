import { observer } from "mobx-react-lite";
import { createPortal } from "react-dom";
import { usePage } from "@/hooks";

const NAVBAR_RIGHT = `#navbar--right`;

interface NavbarRightProps {
	/** Children to render */
	children: React.ReactNode;
}

export const NavbarRight: React.FC<NavbarRightProps> = observer(
	({ children }) => {
		const { page } = usePage();

		if (!page.navbar.element) {
			return null;
		}

		const portalEle = page.navbar.element.querySelector(NAVBAR_RIGHT);
		if (!portalEle) {
			return null;
		}

		return <>{createPortal(children, portalEle)}</>;
	},
);
