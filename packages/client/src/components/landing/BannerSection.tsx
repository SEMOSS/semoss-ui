import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';

import { Button, styled, Typography } from '@semoss/ui';

const StyledBannerTitle = styled(Typography)(({ theme }) => ({
    color: '#212121',
    fontFeatureSettings: "'liga' off, 'clig' off",
    fontFamily: 'Inter',
    fontSize: '24px',
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: '133.4%',
}));

const StyledBannerText = styled(Typography)(({ theme }) => ({
    color: '#212121',
    fontFeatureSettings: "'liga' off, 'clig' off",
    fontFamily: 'Inter',
    fontSize: '16px',
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: '150%' /* 24px */,
    letterSpacing: '0.15px',
    padding: '24px 0px',
    width: '35%',
}));

interface BannerSectionProps {
    /**
     * Tagline
     */
    tagline: string;

    /**
     * description
     */
    description: string;

    /**
     * meta for the button to navigate and display
     */
    link: {
        label: string;
        to: string;
    };

    /**
     * image
     */
    imageUrl: string;
}

export const BannerSection = (props: BannerSectionProps) => {
    const { tagline, imageUrl, description, link } = props;
    const navigate = useNavigate();

    return (
        <div
            style={{
                padding: '53px 21px',
                backgroundImage: `url(${imageUrl})`,
                height: '276px',
                width: '100%',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                borderRadius: '24px',
            }}
        >
            <StyledBannerTitle variant="h5">{tagline}</StyledBannerTitle>
            <StyledBannerText variant="body1">{description}</StyledBannerText>
            <Button
                variant="contained"
                size="large"
                style={{
                    marginTop: 'auto',
                    borderRadius: '12px',
                    background: '#000',
                }}
                onClick={(e) => navigate(link.to)}
                endIcon={<ArrowForwardIcon style={{ color: '#fff' }} />}
            >
                {link.label}
            </Button>
        </div>
    );
};
