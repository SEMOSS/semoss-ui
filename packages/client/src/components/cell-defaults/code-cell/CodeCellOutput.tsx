import { CellComponent } from '@/stores';
import { CodeCellDef } from './config';
import { styled } from '@semoss/ui';

const StyledJson = styled('pre')(({ theme }) => ({
    ...theme.typography.body2,
    textWrap: 'wrap',
    maxHeight: '200px',
    overflowY: 'scroll',
}));

export const CodeCellOutput: CellComponent<CodeCellDef> = (props) => {
    const { cell } = props;

    if (typeof cell.output === 'string') {
        return <StyledJson>{cell.output}</StyledJson>;
    }

    return <StyledJson>{JSON.stringify(cell.output, null, 4)}</StyledJson>;
};
