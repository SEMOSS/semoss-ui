import { styled, Paper } from '@mui/material';
import { grey } from '@mui/material/colors';

export const StyledStepPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    margin: theme.spacing(1),
    height: '97%',
}));

export const StyledTextPaper = styled(Paper)(({ theme }) => ({
    borderStyle: 'solid',
    borderWidth: '2px',
    borderColor: grey[300],
    minHeight: '50%',
    marginTop: theme.spacing(4),
    paddingTop: theme.spacing(1.5),
    paddingRight: theme.spacing(1),
    paddingBottom: theme.spacing(1.5),
    paddingLeft: theme.spacing(1),
}));
