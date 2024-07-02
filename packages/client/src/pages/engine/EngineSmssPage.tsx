import { styled } from '@semoss/ui';
import { SettingsContext } from '@/contexts';
import { UpdateSMSS } from '@/components/settings';
import { useEngine } from '@/hooks';

const StyledContainer = styled('div')(({ theme }) => ({
    width: '100%',
    display: 'flex',
    alignSelf: 'stretch',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(3),
}));

export const EngineSmssPage = () => {
    const { id } = useEngine();

    return (
        <SettingsContext.Provider
            value={{
                adminMode: false,
            }}
        >
            <StyledContainer>
                <UpdateSMSS mode={'engine'} id={id} />
            </StyledContainer>
        </SettingsContext.Provider>
    );
};
