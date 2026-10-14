import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Reuse app instance if already initialized
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
];

const SESSION_TOKEN_KEY = 'gcal_session_access_token';
const SESSION_TOKEN_EXPIRY = 'gcal_session_access_token_expiry';
const TOKEN_TTL_MS = 50 * 60 * 1000; // 50 minutes validity

function getPersistedSessionToken(): string | null {
  try {
    const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
    const expiryStr = sessionStorage.getItem(SESSION_TOKEN_EXPIRY);
    if (!token || !expiryStr) return null;
    const expiry = parseInt(expiryStr, 10);
    if (Date.now() > expiry) {
      clearPersistedSessionToken();
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

function persistSessionToken(token: string) {
  try {
    sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    sessionStorage.setItem(SESSION_TOKEN_EXPIRY, (Date.now() + TOKEN_TTL_MS).toString());
  } catch {
    // ignore
  }
}

function clearPersistedSessionToken() {
  try {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_TOKEN_EXPIRY);
  } catch {
    // ignore
  }
}

export const createGoogleProvider = (forceConsent = false, loginHint?: string) => {
  const provider = new GoogleAuthProvider();
  CALENDAR_SCOPES.forEach((scope) => {
    provider.addScope(scope);
  });

  const customParams: Record<string, string> = {
    access_type: 'offline',
  };

  if (forceConsent) {
    customParams.prompt = 'consent select_account';
  }

  if (loginHint) {
    customParams.login_hint = loginHint;
  }

  provider.setCustomParameters(customParams);
  return provider;
};

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cached access token in memory, initialized from active tab session
let cachedAccessToken: string | null = getPersistedSessionToken();

// Initialize auth state listener.
// Persists the logged-in user identity and active calendar sync across page refreshes.
export const initAuth = (callbacks: {
  onUserChanged: (user: User | null, token: string | null) => void;
}) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const activeToken = cachedAccessToken || getPersistedSessionToken();
      cachedAccessToken = activeToken;
      callbacks.onUserChanged(user, activeToken);
    } else {
      cachedAccessToken = null;
      clearPersistedSessionToken();
      callbacks.onUserChanged(null, null);
    }
  });
};

// Must be called from a button click or user interaction
export const googleSignIn = async (
  forceConsent = false,
  loginHint?: string
): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const hint = loginHint || auth.currentUser?.email || undefined;
    const provider = createGoogleProvider(forceConsent, hint);
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('לא התקבל Access Token מ-Google. אנא ודא שאישרת את הגישה ליומן.');
    }

    cachedAccessToken = credential.accessToken;
    persistSessionToken(cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const clearCachedAccessToken = () => {
  cachedAccessToken = null;
  clearPersistedSessionToken();
};

export const getAccessToken = async (): Promise<string | null> => {
  if (!cachedAccessToken) {
    cachedAccessToken = getPersistedSessionToken();
  }
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  clearPersistedSessionToken();
};
