import { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  Share,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from '../../components/ThemedText';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  Banknote,
  Bell,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Search,
} from '../../components/glyphs';
import { colors as C } from '../../theme';
import { uiPlaceholders } from '../../assets';
import { Raised3D, RaisedField, RaisedTextInput } from '../../components/Input3D';
import {
  money,
  Shell,
  Header,
  Button,
  Card,
  RowText,
  ImagePlaceholder,
  AssetBackground,
  s,
} from '../../AppComponents';

function WalletTransactions({ onBack, onFilter, onOpen, transactions = [] }) {
  const [query, setQuery] = useState('');
  const filteredRows = transactions.filter((row) =>
    `${row.name || ''} ${row.meta || ''} ${row.amount || ''} ${row.reference || ''}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  return (
    <Shell back={onBack}>
      <Header title="Transactions" />
      <RaisedField style={{ marginBottom: 14 }}>
        <Search size={18} color={C.muted} />
        <RaisedTextInput value={query} onChangeText={setQuery} placeholder="Search" />
      </RaisedField>
      <TouchableOpacity
        onPress={onFilter}
        style={{ alignSelf: 'flex-start', padding: 12, marginTop: 5, marginBottom: 4 }}
      >
        <Text style={{ fontSize: 13, fontWeight: '800', color: C.blue }}>Filter ⌄</Text>
      </TouchableOpacity>
      {filteredRows.length ? (
        filteredRows.map((row, index) => (
          <TouchableOpacity
            key={row.id || row.reference || index}
            onPress={() => onOpen(row)}
            style={{
              minHeight: 72,
              backgroundColor: C.paper,
              borderRadius: 36,
              marginBottom: 10,
              paddingHorizontal: 14,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                height: 32,
                width: 32,
                borderRadius: 16,
                backgroundColor: C.soft('#E7EEFF'),
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Banknote size={16} color={C.blue} />
            </View>
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: C.ink }}>{row.name}</Text>
              <Text style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{row.meta}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: row.color || C.ink }}>
                {row.amount}
              </Text>
              <Text style={{ fontSize: 9, color: row.color || C.ink, marginTop: 4 }}>
                {row.status}
              </Text>
            </View>
            <ChevronRight size={16} color={C.muted} style={{ marginLeft: 5 }} />
          </TouchableOpacity>
        ))
      ) : (
        <Text style={{ textAlign: 'center', color: C.muted, marginTop: 32 }}>
          No transactions yet.
        </Text>
      )}
    </Shell>
  );
}
function TransactionDetails({ transaction, onBack }) {
  if (!transaction)
    return (
      <Shell back={onBack}>
        <Header title="Transaction details" />
        <Text style={{ textAlign: 'center', color: C.muted, marginTop: 32 }}>
          Select a transaction to see its details.
        </Text>
      </Shell>
    );
  const item = transaction;
  const share = () =>
    Share.share({
      message: `PalGo transaction\n${item.name}\n${item.amount}\n${item.meta}\nReference: ${item.reference}`,
    });
  return (
    <Shell back={onBack}>
      <Header title="Transaction details" />
      <View
        style={{
          backgroundColor: C.paper,
          borderRadius: 20,
          padding: 22,
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <View
          style={{
            height: 54,
            width: 54,
            borderRadius: 27,
            backgroundColor: C.mintSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CheckCircle2 size={28} color={C.mint} />
        </View>
        <Text style={{ fontSize: 12, color: C.muted, marginTop: 15 }}>
          {item.status} transaction
        </Text>
        <Text
          style={{
            fontSize: 27,
            fontWeight: '800',
            color: item.status === 'Credit' ? C.mint : C.ink,
            marginTop: 5,
          }}
        >
          {item.amount}
        </Text>
        <Text style={{ fontSize: 12, color: C.muted, marginTop: 7 }}>{item.meta}</Text>
      </View>
      <Card>
        <RowText left="Name" right={item.name} />
        <RowText
          left="Transaction type"
          right={item.status === 'Debit' ? 'Withdrawal' : 'Transfer'}
        />
        <RowText left="Status" right="Successful" />
        <RowText left="Reference" right={item.reference} />
      </Card>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
        <View style={{ flex: 1 }}>
          <Button kind="outline" title="Share transaction" onPress={share} />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title="Transfer again"
            onPress={() =>
              Alert.alert(
                'Transfer',
                'A new transfer can be started when wallet transfers are connected.',
              )
            }
          />
        </View>
      </View>
    </Shell>
  );
}
function DateFilter({ title, onBack }) {
  const [period, setPeriod] = useState('Custom Period');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [picker, setPicker] = useState(null);
  const options = ['Custom Period', 'Current week', 'Last week', 'Current month', 'Last month'];
  const format = (date) =>
    date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const chooseDate = (key, date) => {
    if (Platform.OS === 'ios') {
      setPicker(key);
      return;
    }
    setPicker(null);
    key === 'start' ? setStartDate(date) : setEndDate(date);
  };
  return (
    <Shell back={onBack}>
      <Header title={title} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 26 }}>
        <View style={{ flexDirection: 'row', gap: 9 }}>
          {options.map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => setPeriod(item)}
              style={{
                height: 40,
                paddingHorizontal: 14,
                borderRadius: 18,
                justifyContent: 'center',
                backgroundColor: period === item ? C.mint : C.paper,
                borderWidth: period === item ? 0 : 1,
                borderColor: C.blue,
              }}
            >
              <Text style={{ fontSize: 11, color: period === item ? C.white : C.blue }}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      {[
        ['Start date', 'start', startDate],
        ['End date', 'end', endDate],
      ].map(([label, key, date]) => (
        <View key={key} style={{ marginBottom: 16 }}>
          <Text style={s.label}>{label}</Text>
          <TouchableOpacity
            onPress={() => setPicker(key)}
            style={{
              height: 52,
              borderRadius: 18,
              backgroundColor: C.paper,
              paddingHorizontal: 16,
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 14, color: C.ink }}>{format(date)}</Text>
          </TouchableOpacity>
        </View>
      ))}
      {picker && Platform.OS === 'android' && (
        <DateTimePicker
          value={picker === 'start' ? startDate : endDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            if (date) picker === 'start' ? setStartDate(date) : setEndDate(date);
            setPicker(null);
          }}
        />
      )}
      <Modal
        transparent
        visible={Platform.OS === 'ios' && picker !== null}
        animationType="slide"
        onRequestClose={() => setPicker(null)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,.35)' }}>
          <View
            style={{
              backgroundColor: C.paper,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 18,
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: '800' }}>
              {picker === 'start' ? 'Start date' : 'End date'}
            </Text>
            <DateTimePicker
              value={picker === 'start' ? startDate : endDate}
              mode="date"
              display="spinner"
              onChange={(_, date) =>
                date && (picker === 'start' ? setStartDate(date) : setEndDate(date))
              }
            />
            <Button title="Done" onPress={() => setPicker(null)} />
          </View>
        </View>
      </Modal>
      <View style={{ flexDirection: 'row', gap: 17, marginTop: 40 }}>
        <View style={{ flex: 1 }}>
          <Button
            kind="outline"
            title="Clear all"
            onPress={() => {
              setPeriod('Custom Period');
              setStartDate(new Date());
              setEndDate(new Date());
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="Apply" onPress={onBack} />
        </View>
      </View>
    </Shell>
  );
}
function PalWalletLatest({
  wallet,
  profileDetails = {},
  transactions = [],
  onWithdraw,
  onTransactions,
  onOpenTransaction,
  onNotify,
  onBack,
}) {
  const [visible, setVisible] = useState(true);
  return (
    <Shell back={onBack}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <Raised3D
          style={{
            height: 60,
            flex: 1,
            borderRadius: 30,
            justifyContent: 'center',
            paddingHorizontal: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {profileDetails.photoUrl ? (
              <Image
                source={{ uri: profileDetails.photoUrl }}
                style={{ height: 38, width: 38, borderRadius: 19 }}
              />
            ) : (
              <ImagePlaceholder size={38} profile />
            )}
            <Text style={{ color: C.white, fontSize: 13, fontWeight: '800', flex: 1 }}>
              {profileDetails.name ? `Hello ${profileDetails.name}` : 'Your wallet'}
            </Text>
          </View>
        </Raised3D>
        <TouchableOpacity onPress={onNotify} accessibilityLabel="Notifications">
          <Raised3D
            style={{
              height: 60,
              width: 60,
              borderRadius: 30,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bell size={23} color={C.white} />
          </Raised3D>
        </TouchableOpacity>
      </View>
      <AssetBackground
        source={uiPlaceholders.walletBalanceBackground}
        art="walletBalance"
        style={{ backgroundColor: C.blue, borderRadius: 23, padding: 20, overflow: 'hidden' }}
      >
        <Text style={{ fontSize: 12, color: C.white }}>Wallet balance</Text>
        <TouchableOpacity
          onPress={() => setVisible((v) => !v)}
          style={{ position: 'absolute', top: 17, right: 19 }}
        >
          {visible ? <Eye size={18} color={C.white} /> : <EyeOff size={18} color={C.white} />}
        </TouchableOpacity>
        <Text style={{ fontSize: 25, fontWeight: '800', color: C.white, marginTop: 14 }}>
          {visible ? money(wallet.available) : '••••••••'}
        </Text>
        <TouchableOpacity
          onPress={onWithdraw}
          style={{
            height: 40,
            borderRadius: 20,
            backgroundColor: C.paper,
            alignSelf: 'flex-end',
            paddingHorizontal: 16,
            marginTop: 16,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              height: 20,
              width: 20,
              borderRadius: 10,
              backgroundColor: C.blue,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 6,
            }}
          >
            <Text style={{ color: C.white, fontSize: 17, fontWeight: '800', lineHeight: 20 }}>
              +
            </Text>
          </View>
          <Text style={{ color: C.blue, fontSize: 12, fontWeight: '800' }}>Withdraw</Text>
        </TouchableOpacity>
      </AssetBackground>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 23, marginBottom: 11 }}>
        <Text style={{ fontSize: 13, fontWeight: '800', flex: 1 }}>Transactions</Text>
        <TouchableOpacity onPress={onTransactions} style={{ padding: 10, margin: -10 }}>
          <Text style={{ fontSize: 12, color: C.blue, fontWeight: '800' }}>View all</Text>
        </TouchableOpacity>
      </View>
      {transactions.length ? (
        transactions.slice(0, 4).map((row, index) => (
          <TouchableOpacity
            key={row.id || row.reference || index}
            onPress={() => onOpenTransaction(row)}
            style={{
              minHeight: 61,
              borderRadius: 31,
              backgroundColor: C.paper,
              paddingHorizontal: 13,
              marginBottom: 9,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Banknote size={19} color={C.blue} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: C.ink }}>{row.name}</Text>
              <Text style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{row.meta}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: row.color || C.ink }}>
                {row.amount}
              </Text>
              <Text style={{ fontSize: 9, color: row.color || C.ink, marginTop: 3 }}>
                {row.status}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={{ textAlign: 'center', color: C.muted, marginTop: 12 }}>
          No transactions yet.
        </Text>
      )}
      <AssetBackground
        source={uiPlaceholders.walletPromoCard}
        placeholderLabel="WALLET AD IMAGE (ADD YOUR AD IMAGE)"
        style={{
          height: 94,
          backgroundColor: '#15A877',
          borderRadius: 18,
          marginTop: 17,
          justifyContent: 'center',
          padding: 18,
          overflow: 'hidden',
        }}
      />
    </Shell>
  );
}

export { WalletTransactions, TransactionDetails, DateFilter, PalWalletLatest };
