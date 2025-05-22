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

// Styled components for better reusability and cleaner JSX
const GradientText = styled(Typography)(({ theme }) => ({
    background: 'linear-gradient(90deg, #6C53FF 0%, #86ECFF 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    color: 'transparent',
    fontWeight: 700,
}));

const BackgroundContainer = styled(Box)(({ theme }) => ({
    minHeight: '100vh',
    backgroundImage: `url(${BusinessUserImage})`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    alignItems: 'flex-start',
    flexDirection: 'column',
    padding: theme.spacing(6, 9),
    gap: theme.spacing(4),
    width: '100%',
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
    borderRadius: theme.shape.borderRadius * 2,
}));

const SliderTexts = styled(Box)(() => ({
    position: 'relative',
    width: '100%',
    height: '72px',
    overflow: 'hidden',
}));

const SliderText = styled(Box)(() => ({
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    animation: 'slide 9s infinite',
    height: '216px', // 72px * 3 (for 3 titles)
    top: 0,
}));

const keyframes = `
  @keyframes slide {
    8% { transform: translateY(0); opacity: 1; }
    25% { opacity: 0; }
    42% { transform: translateY(-72px); opacity: 1; }
    59% { opacity: 0; }
    76% { transform: translateY(-144px); opacity: 1; }
    91% { opacity: 0; }
  }
`;

const subTitle = ['business apps', 'the power of models', 'knowledge repos'];

const UserLandingPage = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = () => {
        console.log('Search query:', searchQuery);
    };

    return (
        <BackgroundContainer>
            <ContentContainer sx={{ width: '100%' }}>
                <Typography
                    variant="h2"
                    sx={{ fontWeight: 700, lineHeight: 0.9 }}
                >
                    Discover
                </Typography>
                <style>{keyframes}</style>
                <SliderTexts>
                    <SliderText>
                        {subTitle.map((title, idx) => (
                            <GradientText variant="h2" key={idx}>
                                {title}
                            </GradientText>
                        ))}
                    </SliderText>
                </SliderTexts>
            </ContentContainer>
            <Box sx={{ width: '100%', maxWidth: '60vw' }}>
                <StyledTextField
                    variant="outlined"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        sx: {
                            borderRadius: '60px',
                            boxShadow: '0px 0px 0px 1px #8D7BF8',
                            borderColor: '#C6BFFC',
                        },
                        startAdornment: (
                            <InputAdornment position="start">
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
