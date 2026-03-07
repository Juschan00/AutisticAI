import { useAuth0 } from '@auth0/auth0-react';

function AuthButton() {
    const { isAuthenticated, isLoading, user, loginWithRedirect, logout } = useAuth0();

    if (isLoading) {
        console.log('[AuthButton] Auth0 is loading...');
        return <button disabled>Loading...</button>;
    }

    if (isAuthenticated) {
        console.log('[AuthButton] User authenticated:', user);
        return (
            <div>
                <span>{user?.name || user?.email}</span>
                <button
                    onClick={() => {
                        console.log('[AuthButton] Logging out...');
                        logout({ logoutParams: { returnTo: window.location.origin } });
                    }}
                >
                    Log Out
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => {
                console.log('[AuthButton] Redirecting to Auth0 login...');
                loginWithRedirect();
            }}
        >
            Log In
        </button>
    );
}

export default AuthButton;
