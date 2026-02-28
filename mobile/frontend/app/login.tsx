import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';

WebBrowser.maybeCompleteAuthSession();

const AUTH0_DOMAIN = 'dev-jl3xn54tmzhm3rht.us.auth0.com';
const AUTH0_CLIENT_ID = '0Xwor21YhOl8CQ2hhllVSZ9fg0al7dca';

const redirectUri = __DEV__
  ? 'https://auth.expo.io/@evarosati/frontend'
  : AuthSession.makeRedirectUri({ scheme: 'frontend' });

export default function LoginScreen() {
  const [error, setError] = React.useState<string | null>(null);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: AUTH0_CLIENT_ID,
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
      extraParams: { audience: 'https://campusquest-api' },
    },
    {
      authorizationEndpoint: `https://${AUTH0_DOMAIN}/authorize`,
    }
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      exchangeToken(code);
    } else if (response?.type === 'error') {
      const desc = response.error?.description ?? response.params?.error_description;
      if (desc?.includes('UofT') || desc?.includes('restricted')) {
        setError('🎓 This app is for UofT students only.\nPlease use your @utoronto.ca or @mail.utoronto.ca email.');
      } else {
        setError('Login failed. Please try again.');
      }
    }
  }, [response]);

  const exchangeToken = async (code: string) => {
    try {
      const tokenResponse = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: AUTH0_CLIENT_ID,
          code_verifier: request?.codeVerifier,
          code,
          redirect_uri: redirectUri,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.access_token) {
        router.replace('/(tabs)');
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (e) {
      setError('Login failed. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CampusQuest</Text>
      <Text style={styles.subtitle}>UofT Students Only</Text>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, !request && styles.buttonDisabled]}
        onPress={() => { setError(null); promptAsync(); }}
        disabled={!request}
      >
        <Text style={styles.buttonText}>Login with UofT Email</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 16, color: 'gray', marginBottom: 40 },
  errorBox: { backgroundColor: '#fff3f3', borderColor: '#ff4444', borderWidth: 1, borderRadius: 8, padding: 15, marginBottom: 20, width: '80%' },
  errorText: { color: '#cc0000', textAlign: 'center', lineHeight: 22 },
  button: { backgroundColor: '#002A5C', padding: 15, borderRadius: 10, width: '80%', alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});