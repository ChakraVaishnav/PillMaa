// app/(auth)/login.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSignIn, useOAuth } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { AntDesign, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = React.useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const { createdSessionId, setActive: setSessionActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL('/(tabs)', { scheme: 'pillmaa' }),
      });

      if (createdSessionId && setSessionActive) {
        await setSessionActive({ session: createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      console.warn('[OAuth] Google Sign-In failed:', err);
      const message =
        err?.errors?.[0]?.longMessage ??
        err?.errors?.[0]?.message ??
        'Google login failed. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [startOAuthFlow]);

  const handleSignIn = async () => {
    if (!isLoaded || !email || !password) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await signIn.create({
        identifier: email.trim().toLowerCase(),
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.longMessage ??
        err?.errors?.[0]?.message ??
        'Sign in failed. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Gradient background */}
      <LinearGradient
        colors={[Colors.primary[50], Colors.background, Colors.neutral[0]]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative circle */}
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo / Hero */}
            <Animated.View entering={FadeIn.duration(600)} style={styles.hero}>
              <View style={styles.logoRing}>
                <MaterialCommunityIcons name="pill" size={46} color={Colors.textOnPrimary} style={{ transform: [{ rotate: '-10deg' }] }} />
              </View>
              <Text style={styles.appName}>PillMaa</Text>
              <Text style={styles.tagline}>Never miss a dose again</Text>
            </Animated.View>

            {/* Form Card */}
            <Animated.View entering={FadeInDown.delay(200).duration(500).springify()} style={styles.formCard}>
              <Text style={styles.formTitle}>Welcome back</Text>
              <Text style={styles.formSubtitle}>Sign in to your account</Text>

              {error ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>⚠️ {error}</Text>
                </View>
              ) : null}

              <View style={styles.inputs}>
                <Input
                  label="Email address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                />
                <Input
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  textContentType="password"
                  rightIcon={
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={Colors.textTertiary}
                    />
                  }
                  onRightIconPress={() => setShowPassword(!showPassword)}
                />
              </View>

              <Button
                title="Sign In"
                onPress={handleSignIn}
                isLoading={isLoading}
                fullWidth
                style={styles.signInBtn}
              />

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <Button
                title="Continue with Google"
                onPress={handleGoogleSignIn}
                variant="ghost"
                fullWidth
                leftIcon={<AntDesign name="google" size={20} color="#1a7a4a" style={{ position: 'absolute', left: 20 }} />}
                style={styles.googleBtn}
                textStyle={{ color: '#1a7a4a' }}
                isLoading={isLoading}
              />

              <View style={styles.signupRow}>
                <Text style={styles.signupText}>Don't have an account? </Text>
                <Link href="/(auth)/signup" asChild>
                  <TouchableOpacity>
                    <Text style={styles.signupLink}>Sign up</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  decorCircle1: {
    position:        'absolute',
    width:           300,
    height:          300,
    borderRadius:    150,
    backgroundColor: Colors.primary[100],
    top:             -100,
    right:           -80,
    opacity:         0.5,
  },
  decorCircle2: {
    position:        'absolute',
    width:           200,
    height:          200,
    borderRadius:    100,
    backgroundColor: Colors.primary[200],
    bottom:          100,
    left:            -60,
    opacity:         0.3,
  },
  hero: {
    alignItems: 'center',
    paddingTop:  height * 0.08,
    paddingBottom: 32,
  },
  logoRing: {
    width:           88,
    height:          88,
    borderRadius:    44,
    backgroundColor: Colors.primary[600],
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    16,
    // Shadow
    shadowColor:     Colors.primary[700],
    shadowOffset:    { width: 0, height: 8 },
    shadowOpacity:   0.3,
    shadowRadius:    16,
    elevation:       10,
  },
  logoEmoji: {
    fontSize: 40,
  },
  appName: {
    fontFamily: Typography.fontFamily.bold,
    fontSize:   Typography.fontSize['3xl'],
    color:      Colors.primary[700],
    letterSpacing: -1,
    marginBottom: 6,
  },
  tagline: {
    fontFamily: Typography.fontFamily.regular,
    fontSize:   Typography.fontSize.base,
    color:      Colors.textSecondary,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius:    24,
    padding:         28,
    borderWidth:     1,
    borderColor:     '#E5E7EB',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.05,
    shadowRadius:    10,
    elevation:       4,
  },
  formTitle: {
    fontFamily:   Typography.fontFamily.bold,
    fontSize:     Typography.fontSize['2xl'],
    color:        Colors.textPrimary,
    marginBottom: 6,
  },
  formSubtitle: {
    fontFamily:   Typography.fontFamily.regular,
    fontSize:     Typography.fontSize.base,
    color:        Colors.textSecondary,
    marginBottom: 24,
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
    borderRadius:    12,
    padding:         12,
    marginBottom:    16,
    borderWidth:     1,
    borderColor:     '#fca5a5',
  },
  errorText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize:   Typography.fontSize.sm,
    color:      '#991b1b',
  },
  inputs: {
    gap: 12,
    marginBottom: 20,
  },
  signInBtn: {
    marginBottom: 16,
  },
  googleBtn: {
    backgroundColor: 'transparent',
    borderWidth:     1.5,
    borderColor:     '#1a7a4a',
    borderRadius:    14,
    marginBottom:    20,
  },
  divider: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
    marginBottom:  20,
  },
  dividerLine: {
    flex:            1,
    height:          1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize:   Typography.fontSize.sm,
    color:      Colors.textTertiary,
  },
  signupRow: {
    flexDirection:  'row',
    justifyContent: 'center',
    alignItems:     'center',
  },
  signupText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize:   Typography.fontSize.base,
    color:      Colors.textSecondary,
  },
  signupLink: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize:   Typography.fontSize.base,
    color:      Colors.primary[600],
  },
});
