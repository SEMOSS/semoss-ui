import { Section, SectionProps } from './Section';
import { SectionHeader, SectionHeaderProps } from './SectionHeader';

const SectionNameSpace = Object.assign(Section, {
    Header: SectionHeader,
});

export type { SectionProps, SectionHeaderProps };
export { SectionNameSpace as Section };
