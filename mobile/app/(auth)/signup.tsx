// app/(auth)/signup.tsx
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
import { useSignUp, useOAuth } from '@clerk/clerk-expo';
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
import { AuthService } from '../../src/services/auth.service';

const { height } = Dimensions.get('window');

export default function SignupScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignUp = React.useCallback(async () => {
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
      console.warn('[OAuth] Google Sign-Up failed:', err);
      const message =
        err?.errors?.[0]?.longMessage ??
        err?.errors?.[0]?.message ??
        'Google sign-up failed. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [startOAuthFlow]);

  // OTP verification state
  const [pendingVerification, setPendingVerification] = useState(false);
  const [otp, setOtp] = useState('');

  const handleSignUp = async () => {
    if (!isLoaded || !name || !email || !password) return;

    setIsLoading(true);
    setError('');

    try {
      await signUp.create({
        firstName: name.trim().split(' ')[0],
        lastName: name.trim().split(' ').slice(1).join(' ') || '',
        emailAddress: email.trim().toLowerCase(),
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.longMessage ??
        err?.errors?.[0]?.message ??
        'Sign up failed. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!isLoaded || !otp) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await signUp.attemptEmailAddressVerification({ code: otp });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        // Sync user to backend
        try {
          await AuthService.sync(name, email.trim().toLowerCase());
        } catch (syncErr) {
          console.warn('[Auth] Backend sync failed:', syncErr);
        }
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.longMessage ??
        err?.errors?.[0]?.message ??
        'Verification failed. Check your code.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <View style={styles.root}>
        <LinearGradient
          colors={[Colors.primary[50], Colors.background]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Animated.View entering={FadeIn} style={styles.hero}>
              <View style={styles.otpIcon}>
                <Ionicons name="mail-open" size={40} color={Colors.primary[600]} />
              </View>
              <Text style={styles.appName}>Check your email</Text>
              <Text style={styles.tagline}>
                We sent a 6-digit code to{'\n'}
                <Text style={{ color: Colors.primary[600], fontFamily: Typography.fontFamily.semibold }}>
                  {email}
                </Text>
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(150)} style={styles.formCard}>
              {error ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={16} color="#991b1b" style={{ marginRight: 6 }} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Input
                label="Verification code"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />

              <Button
                title="Verify Email"
                onPress={handleVerify}
                isLoading={isLoading}
                fullWidth
                style={{ marginTop: 16 }}
              />
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[Colors.primary[50], Colors.background, Colors.neutral[0]]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeIn.duration(600)} style={styles.hero}>
              <View style={styles.logoRing}>
                <MaterialCommunityIcons name="pill" size={46} color={Colors.textOnPrimary} style={{ transform: [{ rotate: '-10deg' }] }} />
              </View>
              <Text style={styles.appName}>PillMaa</Text>
              <Text style={styles.tagline}>Your personal medicine companion</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(500).springify()} style={styles.formCard}>
              <Text style={styles.formTitle}>Create account</Text>
              <Text style={styles.formSubtitle}>Start your health journey today</Text>

              {error ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={16} color="#991b1b" style={{ marginRight: 6 }} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.inputs}>
                <Input
                  label="Full name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  textContentType="name"
                />
                <Input
                  label="Email address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textContentType="emailAddress"
                />
                 <Input
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  textContentType="newPassword"
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
                title="Create Account"
                onPress={handleSignUp}
                isLoading={isLoading}
                fullWidth
                style={styles.signUpBtn}
              />

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <Button
                title="Continue with Google"
                onPress={handleGoogleSignUp}
                variant="ghost"
                fullWidth
                leftIcon={<AntDesign name="google" size={20} color="#1a7a4a" style={{ position: 'absolute', left: 20 }} />}
                style={styles.googleBtn}
                textStyle={{ color: '#1a7a4a' }}
                isLoading={isLoading}
              />

              <View style={styles.loginRow}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity>
                    <Text style={styles.loginLink}>Sign in</Text>
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
  root: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 },
  decorCircle1: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: Colors.primary[100], top: -100, right: -80, opacity: 0.5,
  },
  decorCircle2: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: Colors.primary[200], bottom: 100, left: -60, opacity: 0.3,
  },
  hero: {
    alignItems: 'center', paddingTop: height * 0.07, paddingBottom: 28,
  },
  otpIcon: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.primary[50],
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    borderWidth: 2, borderColor: Colors.primary[100],
  },
  logoRing: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.primary[600],
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    shadowColor: Colors.primary[700], shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
  },
  logoEmoji: { fontSize: 40 },
  appName: {
    fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize['3xl'],
    color: Colors.primary[700], letterSpacing: -1, marginBottom: 6,
  },
  tagline: {
    fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.base,
    color: Colors.textSecondary, textAlign: 'center', lineHeight: 22,
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
    fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize['2xl'],
    color: Colors.textPrimary, marginBottom: 6,
  },
  formSubtitle: {
    fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.base,
    color: Colors.textSecondary, marginBottom: 24,
  },
  errorBanner: {
    backgroundColor: '#fee2e2', borderRadius: 12, padding: 12,
    marginBottom: 16, borderWidth: 1, borderColor: '#fca5a5',
    flexDirection: 'row', alignItems: 'center',
  },
  errorText: {
    fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm,
    color: '#991b1b', flex: 1,
  },
  inputs: { gap: 12, marginBottom: 20 },
  signUpBtn: { marginBottom: 16 },
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
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginText: {
    fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  loginLink: {
    fontFamily: Typography.fontFamily.semibold, fontSize: Typography.fontSize.base,
    color: Colors.primary[600],
  },
});
