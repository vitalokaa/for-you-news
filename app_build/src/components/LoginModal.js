import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, BlurView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors as tokenColors } from '../theme';
import { useUserStore } from '../store/userStore';

export const LoginModal = () => {
  const { colors, spacing, borderRadius: br, shadows } = useTheme();
  const { showLoginPrompt, completeLogin, cancelLogin } = useUserStore();

  if (!showLoginPrompt) return null;

  return (
    <Modal
      transparent
      visible={showLoginPrompt}
      animationType="fade"
      onRequestClose={cancelLogin}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.surface, borderRadius: br.xl, ...shadows.lg }]}>
          
          <View style={[styles.iconWrapper, { backgroundColor: colors.chip.background }]}>
            <Ionicons name="lock-closed" size={32} color={colors.text.primary} />
          </View>

          <Text style={[styles.title, { color: colors.text.primary }]}>Masuk untuk Menyimpan</Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            Kamu perlu masuk terlebih dahulu untuk menyimpan artikel ini dan membacanya nanti.
          </Text>

          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: tokenColors.primary, borderRadius: br.lg }]}
            onPress={completeLogin}
            activeOpacity={0.85}
          >
            <Text style={styles.loginButtonText}>Masuk / Daftar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cancelButton, { borderRadius: br.lg }]}
            onPress={cancelLogin}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelButtonText, { color: colors.text.tertiary }]}>Nanti Saja</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  loginButton: {
    width: '100%',
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButton: {
    width: '100%',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
