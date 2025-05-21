import React, { useState } from 'react';
import {
    Box,
    styled,
    Typography,
    TextField,
    IconButton,
    InputAdornment,
} from '@semoss/ui';
import SearchIcon from '@mui/icons-material/Search';
import BusinessUserImage from '../assets/img/BusinessUserLanding.svg';
import businessUsercheckgrid from '../assets/img/businessUsercheckgrid.svg';

// Styled components for better reusability and cleaner JSX
const GradientText = styled(Typography)(() => ({
    background: 'linear-gradient(90deg, #6C53FF 0%, #86ECFF 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    color: 'transparent',
    fontWeight: 700,
}));

const BackgroundContainer = styled(Box)(({ theme }) => ({
    minHeight: '100vh',
    backgroundImage: ` url(${BusinessUserImage}), linear-gradient(rgba(255,255,255,0.5), rgba(255,255,255,0.5)), url(${businessUsercheckgrid})`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: '47%, 100%, 100%',
    backgroundPosition: 'right bottom, center',
    display: 'flex',
    alignItems: 'flex-start',
    flexDirection: 'column',
    padding: theme.spacing(6, 9),
    gap: theme.spacing(4),
}));

const ContentContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(4),
    background: 'transparent',
    borderRadius: theme.shape.borderRadius,
    textAlign: 'left',
    marginTop: theme.spacing(6),
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    width: '100%',
    background: theme.palette.common.white,
}));

const UserLandingPage: React.FC<{ subTitle?: string }> = ({
    subTitle = 'business apps',
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = () => {
        console.log('Search query:', searchQuery);
        // Add your search logic here
    };

    return (
        <BackgroundContainer>
            <ContentContainer>
                <Typography
                    variant="h2"
                    sx={{ fontWeight: 700, lineHeight: 0.9 }}
                >
                    Discover
                </Typography>
                <GradientText variant="h2">{subTitle}</GradientText>
            </ContentContainer>
            <Box sx={{ width: '100%', maxWidth: '60vw' }}>
                <StyledTextField
                    variant="outlined"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        sx: { borderRadius: '60px' },
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label="Search"
                                    onClick={handleSearch}
                                >
                                    <SearchIcon />
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>
        </BackgroundContainer>
    );
};

export { UserLandingPage };
