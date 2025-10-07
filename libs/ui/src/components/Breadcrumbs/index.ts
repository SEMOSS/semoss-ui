import { Link, type LinkProps } from "../Link";
import { Breadcrumbs, type BreadcrumbsProps } from "./Breadcrumbs";

export type { BreadcrumbsProps, LinkProps };

const BreadCrumbsNameSpace = Object.assign(Breadcrumbs, {
	Item: Link,
});

export { BreadCrumbsNameSpace as Breadcrumbs };
