import { Alert } from 'react-native';

// Features that are designed but not connected to a backend yet.
export const showMessagingNotice = () =>
  Alert.alert('Messaging is not connected', 'Messages will be connected in the messaging stage.');

export const showWithdrawalNotice = () =>
  Alert.alert(
    'Withdrawals not connected',
    'There are no real Pal earnings or payout processing connected yet. No withdrawal has been made.',
  );
