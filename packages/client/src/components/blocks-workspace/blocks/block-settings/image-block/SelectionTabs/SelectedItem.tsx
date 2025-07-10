import { styled, Box, Typography, ListItemText, IconButton } from '@semoss/ui';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DeleteIcon from '@mui/icons-material/Delete';

const StyledListItem = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
}));

const StyledInfo = styled(Typography)(({ theme }) => ({
    color: theme.palette.text.disabled,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginTop: 0,
}));

const SelectedItem = ({ file, setData }) => {
    return file ? (
        <Box>
            <StyledListItem>
                <ListItemText>{file.fileName}</ListItemText>
                <IconButton
                    data-testid="remove-image"
                    edge="end"
                    aria-label="delete"
                    onClick={() => {
                        setData('src', '');
                    }}
                >
                    <DeleteIcon color="error" />
                </IconButton>
            </StyledListItem>
            <StyledInfo variant="caption">
                <InfoOutlinedIcon sx={{ fontSize: 16 }} />
                Delete current file to upload a new one.
            </StyledInfo>
        </Box>
    ) : null;
};

export default SelectedItem;
