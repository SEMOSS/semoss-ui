import { Layout as FlexLayout, ILayoutProps } from "flexlayout-react";
import { forwardRef } from "react";

import "flexlayout-react/style/light.css";
import "./flexlayout.css";

export interface LayoutProps extends ILayoutProps {}

export const Layout = forwardRef<FlexLayout, LayoutProps>((props, ref) => {
  return (
    <FlexLayout {...props} ref={ref}/>
  )
})
