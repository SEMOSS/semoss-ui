import { Add } from '@mui/icons-material';
import { Card, IconButton, Typography } from '@semoss/ui';

export const AddModelCard = () => {
    return (
        <Card>
            <div>
                <IconButton color="secondary">
                    <Add color="inherit" />
                </IconButton>
                <Typography variant="body2">Add Model</Typography>
            </div>
        </Card>
    );
};
