import { Layout as FlexLayout, ILayoutProps } from "flexlayout-react";

import "flexlayout-react/style/light.css";
import "./flexlayout.css";

export interface LayoutProps extends ILayoutProps {}

export const Layout = (props: LayoutProps) => {
  return (
    <FlexLayout {...props}/>
  )
}
