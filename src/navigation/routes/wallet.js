import React from 'react';
import {
  DateFilter,
  PalWalletLatest,
  TransactionDetails,
  WalletTransactions,
} from '../../features/wallet/screens';
import { showWithdrawalNotice } from '../notices';

export const walletRoutes = {
  wallet: (c) => ({
    back: () => c.go('home'),
    view: (
      <PalWalletLatest
        wallet={c.wallet}
        profileDetails={c.profileDetails}
        onWithdraw={showWithdrawalNotice}
        onTransactions={() => c.go('wallet-transactions')}
        onOpenTransaction={(transaction) => {
          c.setSelectedTransaction(transaction);
          c.go('wallet-transaction-detail');
        }}
        onNotify={() => c.go('notifications')}
        onBack={() => c.go('home')}
      />
    ),
  }),

  'wallet-transactions': (c) => {
    const back = () => c.go('wallet');
    return {
      back,
      view: (
        <WalletTransactions
          onBack={back}
          onFilter={() => c.go('wallet-filter')}
          onOpen={(transaction) => {
            c.setSelectedTransaction(transaction);
            c.go('wallet-transaction-detail');
          }}
        />
      ),
    };
  },

  'wallet-transaction-detail': (c) => {
    const back = () => c.go('wallet-transactions');
    return { back, view: <TransactionDetails transaction={c.selectedTransaction} onBack={back} /> };
  },

  'wallet-filter': (c) => {
    const back = () => c.go('wallet-transactions');
    return { back, view: <DateFilter title="Filter transactions" onBack={back} /> };
  },
};
