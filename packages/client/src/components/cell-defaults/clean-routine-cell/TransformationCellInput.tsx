import { CellComponent } from '@/stores';
import { TransformationCellDef } from './config';
import {
    UpdateRowTransformationCellInput,
    UppercaseTransformationCellInput,
} from './transformation-cell-inputs';
import { Avatar, Chip, Stack, Typography, styled } from '@semoss/ui';
import { Transformations } from './transformation.constants';
import { THEME } from '@/constants';
import { blue, green } from '@mui/material/colors';

const primaryLight = THEME.name === 'SEMOSS' ? blue[50] : green[50];
export const TransformationChip = styled(Chip)(({ theme }) => ({
    backgroundColor: primaryLight,
    color: theme.palette.primary.main,
    paddingLeft: theme.spacing(0.5),
}));
export const TransformationChipAvatar = styled(Avatar)(({ theme }) => ({
    color: `${theme.palette.primary.main}!important`,
    backgroundColor: primaryLight,
    borderRadius: '4px',
    svg: {
        fontSize: '1.25rem',
    },
}));
export const StyledTypography = styled(Typography)(({ theme }) => ({
    lineHeight: '24px',
    fontWeight: theme.typography.fontWeightBold,
}));

export const TransformationCellInput: CellComponent<TransformationCellDef> = (
    props,
) => {
    const { cell, isExpanded } = props;

    const TransformationIcon: React.FunctionComponent =
        Transformations[cell.parameters.transformation.routine].icon;

    const transformationDisplay: string =
        Transformations[cell.parameters.transformation.routine].display;

    const transformationCellInputContent = () => {
        switch (cell.parameters.transformation.routine) {
            case 'uppercase':
                return <UppercaseTransformationCellInput {...props} />;
            case 'update-row':
                return <UpdateRowTransformationCellInput {...props} />;
            default:
                return <></>;
        }
    };

    if (!isExpanded) {
        return (
            <Stack width="100%" paddingY={0.5}>
                <div>
                    <TransformationChip
                        size="small"
                        color="primary"
                        label={transformationDisplay}
                        avatar={
                            <TransformationChipAvatar variant="rounded">
                                <TransformationIcon />
                            </TransformationChipAvatar>
                        }
                    />
                </div>
            </Stack>
        );
    }

    return (
        <Stack width="100%" paddingY={0.5}>
            <StyledTypography variant="body1">
                {transformationDisplay}
            </StyledTypography>
            {transformationCellInputContent()}
        </Stack>
    );
};
