import { Section, type SectionProps } from "./Section";
import { SectionHeader, type SectionHeaderProps } from "./SectionHeader";

const SectionNameSpace = Object.assign(Section, {
	Header: SectionHeader,
});

export type { SectionProps, SectionHeaderProps };
export { SectionNameSpace as Section };
