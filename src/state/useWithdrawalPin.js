import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

const pinKey = (userId) => `palgo.withdrawal-pin.${userId}`;

/** The Pal's withdrawal PIN lives only in the device's secure store. */
export function useWithdrawalPin(authUserId, role) {
  const [pin, setPin] = useState('');

  useEffect(() => {
    let active = true;
    setPin('');
    if (!authUserId || role !== 'pal') return () => {};
    SecureStore.getItemAsync(pinKey(authUserId))
      .then((value) => {
        if (active) setPin(value || '');
      })
      .catch(() => {
        if (active) setPin('');
      });
    return () => {
      active = false;
    };
  }, [authUserId, role]);

  const savePin = async (value) => {
    if (!authUserId) throw new Error('Sign in again before setting a withdrawal PIN.');
    await SecureStore.setItemAsync(pinKey(authUserId), value);
    setPin(value);
  };

  const clearPin = async (userId) => {
    if (userId) await SecureStore.deleteItemAsync(pinKey(userId)).catch(() => {});
    setPin('');
  };

  return { palPin: pin, savePin, clearPin };
}
