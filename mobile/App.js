import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as SecureStore from "expo-secure-store";
import * as Sharing from "expo-sharing";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { apiError, authApi, financeApi } from "./src/api";
import {
  PERIODS,
  formatMoney,
  fromBaseAmount,
  fromDateInput,
  getEditableTransactionAmount,
  isValidDateInput,
  parseCsv,
  toBaseAmount,
  toCsv,
  toDateInput,
} from "./src/format";

const Tabs = createBottomTabNavigator();
const COLORS = {
  background: "#090e1b",
  surface: "#121b2d",
  surfaceRaised: "#1b2940",
  input: "#0d1526",
  border: "#2b3a54",
  text: "#f3f7fb",
  muted: "#9aaac0",
  green: "#5eead4",
  greenWash: "#123b3d",
  greenBorder: "#17615c",
  greenText: "#99f6e4",
  red: "#fb7185",
  redWash: "#4a1d2b",
  redText: "#fecdd3",
  blue: "#a78bfa",
  blueWash: "#29234f",
  amber: "#fbbf24",
};
const DEFAULT_PAGE_SIZE = 50;

const messageFrom = (error) => apiError(error);
const fullName = (user) => user?.username || user?.email || "there";
const freshEntry = (kind) => ({
  kind,
  title: "",
  amount: "",
  date: toDateInput(),
  paymentMethod: "cash",
  purpose: "",
  txType: "expense",
  envelopeId: "",
  incomeSource: "",
  taxPercentage: "",
  taxAmount: "",
  taxApplication: "exclusive",
});

function AppButton({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  compact = false,
  accessibilityLabel,
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        variant === "secondary" && styles.buttonSecondary,
        variant === "danger" && styles.buttonDanger,
        variant === "quiet" && styles.buttonQuiet,
        (pressed || disabled) && styles.buttonPressed,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          variant === "secondary" && styles.buttonSecondaryText,
          variant === "quiet" && styles.buttonQuietText,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function SectionTitle({ title, action, onAction }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} accessibilityRole="button">
          <Text style={styles.linkText}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  secureTextEntry = false,
}) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.muted}
        keyboardType={keyboardType || "default"}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        returnKeyType={multiline ? "default" : "done"}
        onSubmitEditing={multiline ? undefined : Keyboard.dismiss}
        autoCapitalize={
          secureTextEntry || keyboardType === "email-address" ? "none" : "sentences"
        }
        autoCorrect={!secureTextEntry && keyboardType !== "email-address"}
        style={[styles.input, multiline && styles.inputMultiline]}
      />
    </View>
  );
}

function SelectField({ label, value, onValueChange, options }) {
  const [visible, setVisible] = useState(false);
  const selectedOption = options.find(([optionValue]) => optionValue === value);

  return (
    <View style={styles.field}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: selectedOption?.[1] || "" }}
        onPress={() => setVisible(true)}
        style={({ pressed }) => [styles.selectTrigger, pressed && styles.buttonPressed]}
      >
        <Text style={styles.selectValue} numberOfLines={1}>
          {selectedOption?.[1] || "Select an option"}
        </Text>
        <Text style={styles.selectChevron}>⌄</Text>
      </Pressable>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          style={styles.selectBackdrop}
          onPress={() => setVisible(false)}
          accessibilityRole="button"
          accessibilityLabel="Close options"
        >
          <Pressable style={styles.selectSheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.selectHeader}>
              <View style={styles.selectHeaderText}>
                <Text style={styles.selectTitle}>{label || "Choose an option"}</Text>
                <Text style={styles.selectSubtitle}>Select one option</Text>
              </View>
              <Pressable
                onPress={() => setVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close options"
                hitSlop={8}
              >
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>
            <ScrollView
              style={styles.selectOptions}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {options.map(([optionValue, optionLabel]) => {
                const selected = optionValue === value;
                return (
                  <Pressable
                    key={String(optionValue)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => {
                      onValueChange(optionValue);
                      setVisible(false);
                    }}
                    style={({ pressed }) => [
                      styles.selectOption,
                      selected && styles.selectOptionSelected,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Text style={[styles.selectOptionText, selected && styles.selectOptionTextSelected]}>
                      {optionLabel}
                    </Text>
                    {selected ? <Text style={styles.selectCheck}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function ScreenHeader({ title, subtitle, right }) {
  return (
    <View style={styles.screenHeader}>
      <View style={styles.screenHeaderText}>
        <Text style={styles.screenTitle}>{title}</Text>
        {subtitle ? <Text style={styles.screenSubtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

function ScreenFrame({ children, refreshing, onRefresh }) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
            tintColor={COLORS.green}
            colors={[COLORS.green]}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

function LoginScreen({ onLogin, onRegister, busy, error }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = () =>
    (isRegister ? onRegister({ username, email, password }) : onLogin({ email, password }));

  return (
    <SafeAreaView style={styles.authScreen}>
      <ExpoStatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.authKeyboard}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          contentContainerStyle={styles.authContent}
        >
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>$</Text>
          </View>
          <Text style={styles.authTitle}>Budget Tracker</Text>
          <Text style={styles.authSubtitle}>
            Your money, organized around what matters.
          </Text>
          <Card style={styles.authCard}>
            <Text style={styles.cardTitle}>
              {isRegister ? "Create your account" : "Welcome back"}
            </Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {isRegister ? (
              <Field
                label="Name"
                value={username}
                onChangeText={setUsername}
                placeholder="Your name"
              />
            ) : null}
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              secureTextEntry
            />
            <AppButton
              title={busy ? "Please wait..." : isRegister ? "Create account" : "Sign in"}
              onPress={submit}
              disabled={busy || !email || !password || (isRegister && !username)}
            />
            <Pressable
              onPress={() => setIsRegister((value) => !value)}
              style={styles.authSwitch}
            >
              <Text style={styles.authSwitchText}>
                {isRegister
                  ? "Already have an account? Sign in"
                  : "New to Budget Tracker? Create account"}
              </Text>
            </Pressable>
          </Card>
          <Text style={styles.authFootnote}>
            Sign in with the same account you use on the web app.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function AmountCard({ label, value, tone = COLORS.text, hint }) {
  return (
    <Card style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color: tone }]} numberOfLines={1}>
        {value}
      </Text>
      {hint ? <Text style={styles.metricHint}>{hint}</Text> : null}
    </Card>
  );
}

function PeriodPicker({ period, setPeriod }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.periodList}
    >
      {PERIODS.map(([key, label]) => {
        const selected = period === key;
        return (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => setPeriod(key)}
            style={[styles.periodChip, selected && styles.periodChipSelected]}
          >
            <Text style={[styles.periodText, selected && styles.periodTextSelected]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function HomeScreen({
  user,
  period,
  setPeriod,
  totals,
  envelopes,
  incomeEnvelopes,
  transactions,
  currency,
  rate,
  loading,
  refresh,
  openEntry,
  navigate,
}) {
  const net = Number(totals.income || 0) - Number(totals.expense || 0);
  const quickActions = [
    ["New expense", () => openEntry("transaction", null, "expense"), COLORS.red],
    ["Add income", () => openEntry("transaction", null, "income"), COLORS.green],
    ["Fill amount", () => openEntry("fill"), COLORS.blue],
    ["New envelope", () => openEntry("expense-envelope"), COLORS.amber],
  ];

  return (
    <ScreenFrame refreshing={loading} onRefresh={refresh}>
      <ScreenHeader
        title={`Good day, ${fullName(user)}`}
        subtitle="Here is your financial snapshot."
      />
      <PeriodPicker period={period} setPeriod={setPeriod} />
      <View style={styles.metricsGrid}>
        <AmountCard
          label="Income"
          value={formatMoney(totals.income, currency, rate)}
          tone={COLORS.green}
          hint="Posted in this period"
        />
        <AmountCard
          label="Expenses"
          value={formatMoney(totals.expense, currency, rate)}
          tone={COLORS.red}
          hint="Posted in this period"
        />
        <AmountCard
          label="Tax"
          value={formatMoney(totals.tax, currency, rate)}
          tone={COLORS.amber}
          hint="Tax on expenses"
        />
        <AmountCard
          label="Net"
          value={formatMoney(net, currency, rate)}
          tone={net >= 0 ? COLORS.blue : COLORS.red}
          hint="Income minus expenses"
        />
      </View>

      <SectionTitle title="Quick actions" />
      <View style={styles.quickGrid}>
        {quickActions.map(([label, action, color]) => (
          <Pressable
            key={label}
            onPress={action}
            accessibilityRole="button"
            style={styles.quickAction}
          >
            <View style={[styles.quickDot, { backgroundColor: color }]} />
            <Text style={styles.quickActionText}>{label}</Text>
          </Pressable>
        ))}
        <Pressable style={styles.quickAction} onPress={() => openEntry("income-envelope")}>
          <View style={[styles.quickDot, { backgroundColor: COLORS.green }]} />
          <Text style={styles.quickActionText}>Income envelope</Text>
        </Pressable>
        <Pressable style={styles.quickAction} onPress={() => navigate("Envelopes")}>
          <View style={[styles.quickDot, { backgroundColor: COLORS.blue }]} />
          <Text style={styles.quickActionText}>Transfer funds</Text>
        </Pressable>
      </View>

      <SectionTitle title="Income envelopes" action="View all" onAction={() => navigate("Envelopes")} />
      {incomeEnvelopes.length ? (
        incomeEnvelopes.slice(0, 3).map((env) => (
          <Card key={env._id} style={styles.listCard}>
            <View style={styles.listRow}>
              <View style={styles.flexFill}>
                <Text style={styles.itemTitle}>{env.name}</Text>
                <Text style={styles.itemMeta}>Allocated income</Text>
              </View>
              <Text style={[styles.amountText, { color: COLORS.green }]}>
                {formatMoney(env.allocatedAmount, currency, rate)}
              </Text>
            </View>
          </Card>
        ))
      ) : (
        <EmptyState title="No income envelopes yet" text="Create one to track where your income goes." />
      )}

      <SectionTitle title="Expense envelopes" action="View all" onAction={() => navigate("Envelopes")} />
      {envelopes.length ? (
        envelopes.slice(0, 3).map((env) => (
          <Card key={env._id} style={styles.listCard}>
            <View style={styles.listRow}>
              <View style={styles.flexFill}>
                <Text style={styles.itemTitle}>{env.name}</Text>
                <Text style={styles.itemMeta}>
                  {formatMoney(env.currentBalance ?? env.allocatedAmount, currency, rate)} available
                </Text>
              </View>
              <Text style={styles.amountText}>
                {formatMoney(env.allocatedAmount, currency, rate)}
              </Text>
            </View>
          </Card>
        ))
      ) : (
        <EmptyState title="No expense envelopes yet" text="Create a budget envelope to get started." />
      )}

      <SectionTitle title="Recent activity" action="See all" onAction={() => navigate("Activity")} />
      {transactions.slice(0, 5).map((tx) => (
        <TransactionRow key={tx._id} tx={tx} currency={currency} rate={rate} />
      ))}
      {!transactions.length ? (
        <EmptyState title="No transactions for this period" text="Your latest activity will show here." />
      ) : null}
    </ScreenFrame>
  );
}

function EmptyState({ title, text }) {
  return (
    <Card style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </Card>
  );
}

function TransactionRow({ tx, currency, rate, onEdit, onDelete }) {
  const isIncome = tx.type === "income" || tx.type === "fill";
  return (
    <Card style={styles.listCard}>
      <View style={styles.listRow}>
        <View style={[styles.transactionIcon, { backgroundColor: isIncome ? COLORS.greenWash : COLORS.redWash }]}>
          <Text style={{ color: isIncome ? COLORS.green : COLORS.red, fontWeight: "800" }}>
            {isIncome ? "+" : "−"}
          </Text>
        </View>
        <View style={styles.flexFill}>
          <Text style={styles.itemTitle} numberOfLines={1}>{tx.title || "Transaction"}</Text>
          <Text style={styles.itemMeta} numberOfLines={1}>
            {tx.date ? new Date(tx.date).toLocaleDateString() : "No date"}
            {tx.paymentMethod ? ` · ${tx.paymentMethod}` : ""}
          </Text>
        </View>
        <View style={styles.itemAmount}>
          <Text style={[styles.amountText, { color: isIncome ? COLORS.green : COLORS.red }]}>
            {isIncome ? "+" : "−"}{formatMoney(tx.amount, currency, rate)}
          </Text>
          {onEdit || onDelete ? (
            <View style={styles.rowActions}>
              {onEdit ? (
                <Pressable onPress={onEdit} accessibilityRole="button">
                  <Text style={styles.linkText}>Edit</Text>
                </Pressable>
              ) : null}
              {onDelete ? (
                <Pressable onPress={onDelete} accessibilityRole="button">
                  <Text style={styles.dangerLink}>Delete</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
      {tx.purpose ? <Text style={styles.purposeText}>{tx.purpose}</Text> : null}
    </Card>
  );
}

function TransferRow({ transfer, currency, rate, envelopes, incomeEnvelopes, onEdit, onDelete }) {
  const list = transfer.type === "income" ? incomeEnvelopes : envelopes;
  const from = list.find((env) => String(env._id) === String(transfer.fromEnvelopeId));
  const to = list.find((env) => String(env._id) === String(transfer.toEnvelopeId));
  return (
    <Card style={styles.listCard}>
      <View style={styles.listRow}>
        <View style={[styles.transactionIcon, { backgroundColor: COLORS.blueWash }]}>
          <Text style={{ color: COLORS.blue, fontWeight: "800" }}>↔</Text>
        </View>
        <View style={styles.flexFill}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {from?.name || transfer.fromName || "Source"} → {to?.name || transfer.toName || "Destination"}
          </Text>
          <Text style={styles.itemMeta}>
            {transfer.date ? new Date(transfer.date).toLocaleDateString() : "Transfer"}
          </Text>
        </View>
        <View style={styles.itemAmount}>
          <Text style={[styles.amountText, { color: COLORS.blue }]}>
            {formatMoney(transfer.amount, currency, rate)}
          </Text>
          <View style={styles.rowActions}>
            <Pressable onPress={onEdit} accessibilityRole="button"><Text style={styles.linkText}>Edit</Text></Pressable>
            <Pressable onPress={onDelete} accessibilityRole="button"><Text style={styles.dangerLink}>Delete</Text></Pressable>
          </View>
        </View>
      </View>
      {transfer.purpose ? <Text style={styles.purposeText}>{transfer.purpose}</Text> : null}
    </Card>
  );
}

function ActivityScreen({
  period,
  setPeriod,
  transactions,
  transfers,
  envelopes,
  incomeEnvelopes,
  currency,
  rate,
  loading,
  page,
  pages,
  total,
  setPage,
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
  activityTab,
  setActivityTab,
  refresh,
  openEntry,
  deleteTransaction,
  deleteTransfer,
  editTransfer,
  exportData,
  importData,
}) {
  const pageControls = (
    <View style={styles.pagination}>
      <AppButton title="Previous" variant="secondary" compact disabled={page <= 1} onPress={() => setPage(page - 1)} />
      <Text style={styles.paginationText}>Page {page} of {pages} · {total} records</Text>
      <AppButton title="Next" variant="secondary" compact disabled={page >= pages} onPress={() => setPage(page + 1)} />
    </View>
  );
  const filteredTransfers = transfers.filter((transfer) => {
    const sourceList = transfer.type === "income" ? incomeEnvelopes : envelopes;
    const source =
      sourceList.find((env) => String(env._id) === String(transfer.fromEnvelopeId))?.name ||
      transfer.fromName ||
      "";
    const destination =
      sourceList.find((env) => String(env._id) === String(transfer.toEnvelopeId))?.name ||
      transfer.toName ||
      "";
    const needle = search.trim().toLowerCase();
    return (
      !needle ||
      source.toLowerCase().includes(needle) ||
      destination.toLowerCase().includes(needle) ||
      String(transfer.purpose || "").toLowerCase().includes(needle)
    );
  });

  return (
    <ScreenFrame refreshing={loading} onRefresh={refresh}>
      <ScreenHeader
        title="Activity"
        subtitle="Transactions, transfers, search, and CSV tools."
        right={<AppButton title="+ Add" compact onPress={() => openEntry("transaction")} />}
      />
      <PeriodPicker period={period} setPeriod={setPeriod} />
      <View style={styles.segmentRow}>
        {["transactions", "transfers"].map((key) => (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected: activityTab === key }}
            onPress={() => setActivityTab(key)}
            style={[styles.segment, activityTab === key && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, activityTab === key && styles.segmentTextActive]}>
              {key === "transactions" ? "Transactions" : "Transfers"}
            </Text>
          </Pressable>
        ))}
      </View>
      {activityTab === "transactions" ? (
        <>
          <Field label="Search transactions" value={search} onChangeText={setSearch} placeholder="Title or purpose" />
          <SelectField
            label="Type"
            value={typeFilter}
            onValueChange={(value) => { setTypeFilter(value); setPage(1); }}
            options={[["all", "All types"], ["income", "Income"], ["expense", "Expense"]]}
          />
          <View style={styles.toolbar}>
            <AppButton title="Export CSV" variant="secondary" compact onPress={exportData} />
            <AppButton title="Import CSV" variant="secondary" compact onPress={importData} />
          </View>
          {pageControls}
          {transactions.map((tx) => (
            <TransactionRow
              key={tx._id}
              tx={tx}
              currency={currency}
              rate={rate}
              onEdit={() => openEntry(tx.type === "income" && !tx.envelopeId ? "fill" : "transaction", tx)}
              onDelete={() => deleteTransaction(tx._id)}
            />
          ))}
          {!transactions.length && !loading ? <EmptyState title="No transactions found" text="Try changing the period or search." /> : null}
          {pageControls}
        </>
      ) : (
        <>
          <Field label="Search transfers" value={search} onChangeText={setSearch} placeholder="Envelope name or purpose" />
          <View style={styles.toolbar}>
            <Text style={styles.itemMeta}>Transfers for the selected period</Text>
            <AppButton title="+ Transfer" compact onPress={() => openEntry("transfer")} />
          </View>
          {filteredTransfers.map((transfer) => (
            <TransferRow
              key={transfer._id}
              transfer={transfer}
              currency={currency}
              rate={rate}
              envelopes={envelopes}
              incomeEnvelopes={incomeEnvelopes}
              onEdit={() => editTransfer(transfer)}
              onDelete={() => deleteTransfer(transfer._id)}
            />
          ))}
          {!filteredTransfers.length && !loading ? <EmptyState title="No transfers found" text="Transfers between envelopes will appear here." /> : null}
        </>
      )}
    </ScreenFrame>
  );
}

function EnvelopeCard({
  env,
  currency,
  rate,
  onEdit,
  onDelete,
  onTransfer,
  expanded,
  onToggle,
  linkedTransactions,
  linkedLoading,
  linkedError,
  income = false,
}) {
  const balance = env.currentBalance ?? env.allocatedAmount;
  return (
    <Card style={styles.envelopeCard}>
      <View style={styles.listRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          onPress={onToggle}
          style={styles.flexFill}
        >
          <Text style={styles.itemTitle}>{env.name}</Text>
          <Text style={styles.itemMeta}>
            {income ? "Income pool" : "Available"} · {formatMoney(balance, currency, rate)}
          </Text>
          <Text style={styles.linkText}>{expanded ? "Hide details" : "View details"}</Text>
        </Pressable>
        <Text style={styles.amountText}>{formatMoney(env.allocatedAmount, currency, rate)}</Text>
      </View>
      <View style={styles.envelopeActions}>
        <AppButton title="Transfer" variant="secondary" compact onPress={onTransfer} />
        <AppButton title="Edit" variant="secondary" compact onPress={onEdit} />
        <AppButton title="Delete" variant="danger" compact onPress={onDelete} />
      </View>
      {expanded ? (
        <View style={styles.envelopeDetails}>
          <View style={styles.listRow}>
            <Text style={styles.itemMeta}>Allocated</Text>
            <Text style={styles.amountText}>{formatMoney(env.allocatedAmount, currency, rate)}</Text>
          </View>
          <View style={styles.listRow}>
            <Text style={styles.itemMeta}>{income ? "Linked activity" : "Spent"}</Text>
            <Text style={styles.amountText}>
              {formatMoney(
                linkedTransactions
                  .filter((tx) => tx.type === "expense")
                  .reduce((sum, tx) => sum + Number(tx.amount || 0), 0),
                currency,
                rate,
              )}
            </Text>
          </View>
          <Text style={styles.itemMeta}>Activity in the selected period</Text>
          {linkedLoading ? <ActivityIndicator color={COLORS.green} /> : null}
          {linkedError ? <Text style={styles.errorText}>{linkedError}</Text> : null}
          {!linkedLoading && !linkedError && linkedTransactions.length === 0 ? (
            <Text style={styles.itemMeta}>No linked transactions for this period.</Text>
          ) : null}
          {linkedTransactions.slice(0, 5).map((tx) => (
            <View key={tx._id} style={styles.listRow}>
              <Text style={[styles.itemMeta, styles.flexFill]} numberOfLines={1}>
                {tx.title}
              </Text>
              <Text style={styles.amountText}>
                {formatMoney(tx.amount, currency, rate)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

function EnvelopesScreen({
  envelopes,
  incomeEnvelopes,
  currency,
  rate,
  period,
  loading,
  refresh,
  openEntry,
  deleteEnvelope,
}) {
  const [listType, setListType] = useState("expense");
  const [expanded, setExpanded] = useState(null);
  const [linkedResult, setLinkedResult] = useState(null);
  const linkedKey = expanded ? `${expanded.income ? "income" : "expense"}:${expanded.id}:${period}` : "";
  const linkedState = linkedResult?.key === linkedKey ? linkedResult : null;

  useEffect(() => {
    if (!expanded) return undefined;
    let active = true;
    setLinkedResult({ key: linkedKey, transactions: [], loading: true, error: "" });
    financeApi
      .allTransactions(period, expanded.income
        ? { incomeSource: expanded.id }
        : { envelopeId: expanded.id })
      .then(({ transactions }) => {
        if (active) setLinkedResult({ key: linkedKey, transactions, loading: false, error: "" });
      })
      .catch((requestError) => {
        if (active) setLinkedResult({
          key: linkedKey,
          transactions: [],
          loading: false,
          error: messageFrom(requestError),
        });
      });
    return () => { active = false; };
  }, [expanded, linkedKey, period]);

  return (
    <ScreenFrame refreshing={loading} onRefresh={refresh}>
      <ScreenHeader title="Envelopes" subtitle="Plan budgets and move money between pools." />
      <View style={styles.toolbar}>
        <AppButton title="Expense envelope" compact onPress={() => openEntry("expense-envelope")} />
        <AppButton title="Income envelope" compact variant="secondary" onPress={() => openEntry("income-envelope")} />
      </View>
      <View style={styles.segmentRow}>
        {["expense", "income"].map((key) => (
          <Pressable
            key={key}
            onPress={() => setListType(key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: listType === key }}
            style={[styles.segment, listType === key && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, listType === key && styles.segmentTextActive]}>
              {key === "expense" ? `Expense (${envelopes.length})` : `Income (${incomeEnvelopes.length})`}
            </Text>
          </Pressable>
        ))}
      </View>
      {(listType === "expense" ? envelopes : incomeEnvelopes).map((env) => (
        <EnvelopeCard
          key={env._id}
          env={env}
          currency={currency}
          rate={rate}
          income={listType === "income"}
          expanded={expanded?.id === env._id && expanded?.income === (listType === "income")}
          onToggle={() => {
            const income = listType === "income";
            setExpanded((current) =>
              current?.id === env._id && current?.income === income
                ? null
                : { id: env._id, income },
            );
          }}
          linkedTransactions={linkedState?.transactions || []}
          linkedLoading={Boolean(expanded && (!linkedState || linkedState.loading))}
          linkedError={linkedState?.error || ""}
          onEdit={() => openEntry(listType === "income" ? "income-envelope" : "expense-envelope", env)}
          onDelete={() => deleteEnvelope(env._id, listType === "income")}
          onTransfer={() => openEntry("transfer", {
            type: listType === "income" ? "income" : "expense",
            fromId: env._id,
          })}
        />
      ))}
      {!(listType === "expense" ? envelopes : incomeEnvelopes).length ? (
        <EmptyState
          title={`No ${listType} envelopes yet`}
          text="Add an envelope to keep your money organized."
        />
      ) : null}
      <SectionTitle title="Move money" />
      <Card>
        <Text style={styles.bodyText}>Move funds between envelopes while keeping a transfer history.</Text>
        <AppButton title="Create transfer" onPress={() => openEntry("transfer")} />
      </Card>
    </ScreenFrame>
  );
}

function AnalyticsScreen({ currency, rate, refreshTransactions }) {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const end = new Date();
      const start = new Date(end.getFullYear(), end.getMonth() - 5, 1);
      const result = await financeApi.allTransactions("all", {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });
      setTransactions(result.transactions);
    } catch (requestError) {
      setError(messageFrom(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload, refreshTransactions]);

  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
      const next = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      const withinMonth = transactions.filter((tx) => {
        const txDate = new Date(tx.date);
        return txDate >= date && txDate < next;
      });
      return {
        label: date.toLocaleDateString(undefined, { month: "short" }),
        income: withinMonth.filter((tx) => tx.type === "income").reduce((sum, tx) => sum + Number(tx.amount || 0), 0),
        expense: withinMonth.filter((tx) => tx.type === "expense").reduce((sum, tx) => sum + Number(tx.amount || 0), 0),
      };
    });
  }, [transactions]);
  const maxAmount = Math.max(1, ...months.flatMap((month) => [month.income, month.expense]));
  const expensesByCategory = useMemo(() => {
    const totals = new Map();
    transactions.filter((tx) => tx.type === "expense").forEach((tx) => {
      const name = tx.envelopeId?.name || "Other";
      totals.set(name, (totals.get(name) || 0) + Number(tx.amount || 0));
    });
    return [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [transactions]);

  return (
    <ScreenFrame refreshing={loading} onRefresh={reload}>
      <ScreenHeader title="Analytics" subtitle="Income and spending over the last six months." />
      {loading ? <ActivityIndicator color={COLORS.green} /> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <Card>
        <Text style={styles.cardTitle}>Monthly trend</Text>
        <View style={styles.chart}>
          {months.map((month) => (
            <View key={month.label} style={styles.chartColumn}>
              <View style={styles.barGroup}>
                <View style={[styles.bar, { height: `${Math.max(3, month.income / maxAmount * 100)}%`, backgroundColor: COLORS.green }]} />
                <View style={[styles.bar, { height: `${Math.max(3, month.expense / maxAmount * 100)}%`, backgroundColor: COLORS.red }]} />
              </View>
              <Text style={styles.chartLabel}>{month.label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.legendRow}>
          <Text style={[styles.legend, { color: COLORS.green }]}>● Income</Text>
          <Text style={[styles.legend, { color: COLORS.red }]}>● Expenses</Text>
        </View>
      </Card>
      <SectionTitle title="Spending by envelope" />
      {expensesByCategory.map(([label, amount]) => (
        <Card key={label} style={styles.listCard}>
          <View style={styles.listRow}>
            <Text style={[styles.itemTitle, styles.flexFill]}>{label}</Text>
            <Text style={[styles.amountText, { color: COLORS.red }]}>{formatMoney(amount, currency, rate)}</Text>
          </View>
        </Card>
      ))}
      {!loading && !expensesByCategory.length ? <EmptyState title="No expenses to analyze" text="Expense activity will show here." /> : null}
    </ScreenFrame>
  );
}

function SettingsScreen({
  user,
  currency,
  setCurrency,
  rate,
  pageSize,
  setPageSize,
  savePageSize,
  saving,
  logout,
}) {
  return (
    <ScreenFrame>
      <ScreenHeader title="Settings" subtitle="Manage your preferences and account." />
      <Card>
        <Text style={styles.cardTitle}>Display currency</Text>
        <Text style={styles.bodyText}>Amounts are stored in PKR. USD is shown using the current approximate exchange rate.</Text>
        <SelectField
          label="Currency"
          value={currency}
          onValueChange={setCurrency}
          options={[["PKR", "Pakistani rupee (PKR)"], ["USD", "US dollar (USD)"]]}
        />
        <Text style={styles.itemMeta}>1 USD ≈ {Number(rate).toFixed(2)} PKR</Text>
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Transaction history</Text>
        <Text style={styles.bodyText}>Choose how many records to show per page.</Text>
        <SelectField
          label="Rows per page"
          value={pageSize}
          onValueChange={setPageSize}
          options={[10, 25, 50, 75, 100].map((size) => [size, `${size} transactions`])}
        />
        <AppButton title={saving ? "Saving..." : "Save settings"} onPress={savePageSize} disabled={saving} />
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Account</Text>
        <Text style={styles.itemTitle}>{fullName(user)}</Text>
        <Text style={styles.itemMeta}>{user?.email}</Text>
        <View style={{ height: 14 }} />
        <AppButton title="Sign out" variant="danger" onPress={logout} />
      </Card>
      <Text style={styles.versionText}>Budget Tracker mobile · Connected to your existing account</Text>
    </ScreenFrame>
  );
}

function EntryModal({
  entry,
  setEntry,
  visible,
  busy,
  onClose,
  onSave,
  envelopes,
  incomeEnvelopes,
  currency,
  rate,
}) {
  const set = (key, value) => setEntry((current) => ({ ...current, [key]: value }));
  const kind = entry?.kind;
  if (!entry) return null;
  const isExpenseEnvelope = kind === "expense-envelope";
  const isIncomeEnvelope = kind === "income-envelope";
  const isEnvelope = isExpenseEnvelope || isIncomeEnvelope;
  const isTransfer = kind === "transfer";
  const isFill = kind === "fill";
  const sourceEnvelopes = entry.transferType === "income" ? incomeEnvelopes : envelopes;
  const displayTitle =
    isExpenseEnvelope ? "Expense envelope" :
    isIncomeEnvelope ? "Income envelope" :
    isTransfer ? "Transfer funds" :
    isFill ? "Fill amount" :
    entry._id ? "Edit transaction" : "New transaction";

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={Keyboard.dismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss keyboard"
        />
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{displayTitle}</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close form">
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
            contentContainerStyle={styles.modalBody}
          >
            {isEnvelope ? (
              <>
                <Field label="Envelope name" value={entry.title} onChangeText={(value) => set("title", value)} placeholder="e.g. Groceries" />
                <Field label={`Allocated amount (${currency})`} value={entry.amount} onChangeText={(value) => set("amount", value)} placeholder="0.00" keyboardType="decimal-pad" />
              </>
            ) : isTransfer ? (
              <>
                <SelectField
                  label="Envelope type"
                  value={entry.transferType || "expense"}
                  onValueChange={(value) => setEntry((current) => ({ ...current, transferType: value, fromId: "", toId: "" }))}
                  options={[["expense", "Expense envelopes"], ["income", "Income envelopes"]]}
                />
                <SelectField
                  label="From"
                  value={entry.fromId || ""}
                  onValueChange={(value) => set("fromId", value)}
                  options={[["", "Select source"], ...sourceEnvelopes.map((env) => [env._id, env.name])]}
                />
                <SelectField
                  label="To"
                  value={entry.toId || ""}
                  onValueChange={(value) => set("toId", value)}
                  options={[["", "Select destination"], ...sourceEnvelopes.map((env) => [env._id, env.name])]}
                />
                <Field label={`Amount (${currency})`} value={entry.amount} onChangeText={(value) => set("amount", value)} placeholder="0.00" keyboardType="decimal-pad" />
                <Field label="Date (YYYY-MM-DD)" value={entry.date} onChangeText={(value) => set("date", value)} placeholder="YYYY-MM-DD" />
                <Field label="Purpose (optional)" value={entry.purpose} onChangeText={(value) => set("purpose", value)} placeholder="Why are you moving this money?" />
              </>
            ) : (
              <>
                {!isFill ? (
                  <SelectField
                    label="Transaction type"
                    value={entry.txType || "expense"}
                    onValueChange={(value) => set("txType", value)}
                    options={[["expense", "Expense"], ["income", "Income"]]}
                  />
                ) : null}
                <Field label="Title" value={entry.title} onChangeText={(value) => set("title", value)} placeholder={isFill ? "Salary, bonus..." : "What was this for?"} />
                <Field label={`Amount (${currency})`} value={entry.amount} onChangeText={(value) => set("amount", value)} placeholder="0.00" keyboardType="decimal-pad" />
                <Field label="Date (YYYY-MM-DD)" value={entry.date} onChangeText={(value) => set("date", value)} placeholder="YYYY-MM-DD" />
                <SelectField
                  label={
                    isFill
                      ? "Income envelope target"
                      : entry.txType === "expense"
                        ? "Pay from income envelope"
                        : "Income source"
                  }
                  value={entry.incomeSource || ""}
                  onValueChange={(value) => set("incomeSource", value)}
                  options={[["", "Select income envelope"], ...incomeEnvelopes.map((env) => [env._id, env.name])]}
                />
                {!isFill ? (
                  <SelectField
                    label="Expense envelope"
                    value={entry.envelopeId || ""}
                    onValueChange={(value) => set("envelopeId", value)}
                    options={[["", "No envelope"], ...envelopes.map((env) => [env._id, env.name])]}
                  />
                ) : null}
                <SelectField
                  label="Payment method"
                  value={entry.paymentMethod || "cash"}
                  onValueChange={(value) => set("paymentMethod", value)}
                  options={["cash", "card", "bank", "online", "other"].map((method) => [method, method[0].toUpperCase() + method.slice(1)])}
                />
                <Field label="Purpose (optional)" value={entry.purpose} onChangeText={(value) => set("purpose", value)} placeholder="Add a note" multiline />
                {!isFill && entry.txType === "expense" ? (
                  <>
                    <Field label="Tax percentage (optional)" value={entry.taxPercentage} onChangeText={(value) => set("taxPercentage", value)} placeholder="0" keyboardType="decimal-pad" />
                    <Field label={`Tax amount (${currency}, optional)`} value={entry.taxAmount} onChangeText={(value) => set("taxAmount", value)} placeholder="0.00" keyboardType="decimal-pad" />
                    <SelectField
                      label="Tax application"
                      value={entry.taxApplication || "exclusive"}
                      onValueChange={(value) => set("taxApplication", value)}
                      options={[["exclusive", "Add tax to amount"], ["inclusive", "Tax included in amount"]]}
                    />
                  </>
                ) : null}
              </>
            )}
            {isEnvelope && entry._id ? (
              <Text style={styles.itemMeta}>Current allocation: {formatMoney(entry.originalAmount, currency, rate)}</Text>
            ) : null}
            <AppButton
              title={busy ? "Saving..." : isEnvelope ? (entry._id ? "Save envelope" : "Create envelope") : isTransfer ? (entry._id ? "Update transfer" : "Transfer funds") : entry._id ? "Save transaction" : "Save transaction"}
              onPress={onSave}
              disabled={busy}
            />
            <AppButton title="Cancel" variant="secondary" onPress={onClose} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function AppContent() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [period, setPeriod] = useState("monthly");
  const [envelopes, setEnvelopes] = useState([]);
  const [incomeEnvelopes, setIncomeEnvelopes] = useState([]);
  const [dashboardTransactions, setDashboardTransactions] = useState([]);
  const [totals, setTotals] = useState({ income: 0, expense: 0, tax: 0 });
  const [transfers, setTransfers] = useState([]);
  const [activityTransactions, setActivityTransactions] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [activityTab, setActivityTab] = useState("transactions");
  const [currency, setCurrencyState] = useState("PKR");
  const [rate, setRate] = useState(278);
  const [saving, setSaving] = useState(false);
  const [entry, setEntry] = useState(null);
  const [error, setError] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [storedUser, savedCurrency] = await Promise.all([
          SecureStore.getItemAsync("budgetTrackerUser"),
          SecureStore.getItemAsync("budgetTrackerCurrency"),
        ]);
        if (active && storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed?.token) setUser(parsed);
        }
        if (active && (savedCurrency === "PKR" || savedCurrency === "USD")) {
          setCurrencyState(savedCurrency);
        }
      } catch {
        await SecureStore.deleteItemAsync("budgetTrackerUser");
        await SecureStore.deleteItemAsync("budgetTrackerToken");
      } finally {
        if (active) setAuthLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((response) => {
        if (!response.ok) throw new Error("Exchange-rate request failed");
        return response.json();
      })
      .then((data) => {
        const value = Number(data?.rates?.PKR);
        if (active && Number.isFinite(value) && value > 0) setRate(value);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const refresh = useCallback(async () => {
    if (!user?.token) return;
    setDashboardLoading(true);
    setError("");
    try {
      const [envRes, incomeRes, txRes, transferRes, settingRes] = await Promise.all([
        financeApi.envelopes(),
        financeApi.incomeEnvelopes(),
        financeApi.transactions(period, 1, 50),
        financeApi.transfers(period),
        financeApi.settings(),
      ]);
      setEnvelopes(Array.isArray(envRes.data) ? envRes.data : []);
      setIncomeEnvelopes(Array.isArray(incomeRes.data) ? incomeRes.data : []);
      setDashboardTransactions(Array.isArray(txRes.data?.transactions) ? txRes.data.transactions : []);
      setTotals(txRes.data?.totals || { income: 0, expense: 0, tax: 0 });
      setTransfers(Array.isArray(transferRes.data) ? transferRes.data : []);
      const nextSize = Number(settingRes.data?.transactionPageSize);
      if (Number.isFinite(nextSize) && nextSize >= 1) setPageSize(nextSize);
    } catch (requestError) {
      setError(messageFrom(requestError));
    } finally {
      setDashboardLoading(false);
    }
  }, [user?.token, period]);

  useEffect(() => { void refresh(); }, [refresh, refreshVersion]);

  const loadActivity = useCallback(async () => {
    if (!user?.token) return;
    setActivityLoading(true);
    try {
      const { data } = await financeApi.transactions(period, page, pageSize, {
        search,
        type: typeFilter,
      });
      setActivityTransactions(Array.isArray(data.transactions) ? data.transactions : []);
      setPages(Number(data.pages) || 1);
      setTotal(Number(data.total) || 0);
    } catch (requestError) {
      setError(messageFrom(requestError));
    } finally {
      setActivityLoading(false);
    }
  }, [user?.token, period, page, pageSize, search, typeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => { void loadActivity(); }, 250);
    return () => clearTimeout(timer);
  }, [loadActivity, refreshVersion]);

  const handleAuth = async (method, credentials) => {
    setAuthBusy(true);
    setAuthError("");
    try {
      const { data } = await method(credentials);
      if (!data?.token) throw new Error("The server did not return an authentication token.");
      await Promise.all([
        SecureStore.setItemAsync("budgetTrackerToken", data.token),
        SecureStore.setItemAsync("budgetTrackerUser", JSON.stringify(data)),
      ]);
      setUser(data);
    } catch (requestError) {
      setAuthError(messageFrom(requestError));
    } finally {
      setAuthBusy(false);
    }
  };

  const logout = async () => {
    await Promise.all([
      SecureStore.deleteItemAsync("budgetTrackerToken"),
      SecureStore.deleteItemAsync("budgetTrackerUser"),
    ]);
    setUser(null);
    setEntry(null);
    setEnvelopes([]);
    setIncomeEnvelopes([]);
    setDashboardTransactions([]);
    setActivityTransactions([]);
    setTransfers([]);
  };

  const setCurrency = async (nextCurrency) => {
    setCurrencyState(nextCurrency);
    await SecureStore.setItemAsync("budgetTrackerCurrency", nextCurrency);
  };

  const changePeriod = (value) => {
    setPeriod(value);
    setPage(1);
  };

  const openEntry = (kind, record = null, txType = "expense") => {
    if (kind === "expense-envelope" || kind === "income-envelope") {
      setEntry({
        kind,
        _id: record?._id,
        title: record?.name || "",
        amount: record
          ? String(fromBaseAmount(record.allocatedAmount, currency, rate).toFixed(2))
          : "",
        originalAmount: record?.allocatedAmount,
      });
      return;
    }
    if (kind === "transfer") {
      const transfer = record;
      const amount = transfer
        ? fromBaseAmount(transfer.amount, currency, rate).toFixed(2)
        : "";
      setEntry({
        kind,
        _id: transfer?._id,
        transferType: transfer?.type || record?.type || "expense",
        fromId: transfer?.fromEnvelopeId || record?.fromId || "",
        toId: transfer?.toEnvelopeId || "",
        amount,
        purpose: transfer?.purpose || "",
        date: toDateInput(transfer?.date),
      });
      return;
    }
    if (record) {
      const isFill = kind === "fill";
      setEntry({
        ...freshEntry(kind),
        _id: record._id,
        title: record.title || "",
        amount: fromBaseAmount(
          getEditableTransactionAmount(record),
          currency,
          rate,
        ).toFixed(2),
        date: toDateInput(record.date),
        paymentMethod: record.paymentMethod || "cash",
        purpose: record.purpose || "",
        txType: record.type === "income" ? "income" : "expense",
        envelopeId: record.envelopeId?._id || record.envelopeId || "",
        incomeSource: record.incomeSource?._id || record.incomeSource || "",
        taxPercentage: record.taxPercentage == null ? "" : String(record.taxPercentage),
        taxAmount: record.taxAmount
          ? fromBaseAmount(record.taxAmount, currency, rate).toFixed(2)
          : "",
        taxApplication: record.taxApplication || "exclusive",
        kind: isFill ? "fill" : "transaction",
      });
    } else {
      setEntry({ ...freshEntry(kind), txType });
    }
  };

  const runMutation = async (operation, successCallback) => {
    setSaving(true);
    setError("");
    try {
      await operation();
      setEntry(null);
      setRefreshVersion((version) => version + 1);
      successCallback?.();
    } catch (requestError) {
      setError(messageFrom(requestError));
      Alert.alert("Couldn't complete that action", messageFrom(requestError));
    } finally {
      setSaving(false);
    }
  };

  const saveEntry = async () => {
    if (!entry) return;
    if (entry.kind.endsWith("-envelope")) {
      const name = entry.title.trim();
      const amount = toBaseAmount(entry.amount, currency, rate);
      if (!name || !Number.isFinite(amount) || amount <= 0) {
        Alert.alert("Check the form", "Enter an envelope name and a valid positive amount.");
        return;
      }
      const income = entry.kind === "income-envelope";
      return runMutation(
        () =>
          entry._id
            ? (income ? financeApi.updateIncomeEnvelope(entry._id, { name, allocatedAmount: amount }) : financeApi.updateEnvelope(entry._id, { name, allocatedAmount: amount }))
            : (income ? financeApi.createIncomeEnvelope({ name, allocatedAmount: amount }) : financeApi.createEnvelope({ name, allocatedAmount: amount })),
      );
    }
    if (entry.kind === "transfer") {
      const amount = toBaseAmount(entry.amount, currency, rate);
      if (!entry.fromId || !entry.toId || entry.fromId === entry.toId || !Number.isFinite(amount) || amount <= 0) {
        Alert.alert("Check the transfer", "Choose different source and destination envelopes and enter a positive amount.");
        return;
      }
      if (entry.date && !isValidDateInput(entry.date)) {
        Alert.alert("Check the transfer", "Enter a valid date in YYYY-MM-DD format.");
        return;
      }
      const data = {
        type: entry.transferType,
        fromId: entry.fromId,
        toId: entry.toId,
        amount,
        purpose: entry.purpose || undefined,
        date: fromDateInput(entry.date),
      };
      return runMutation(() => entry._id ? financeApi.updateTransfer(entry._id, data) : financeApi.transfer(data));
    }

    const isFill = entry.kind === "fill";
    const amount = toBaseAmount(entry.amount, currency, rate);
    const isExpense = !isFill && entry.txType === "expense";
    if (!entry.title.trim() || !Number.isFinite(amount) || amount <= 0) {
      Alert.alert("Check the form", "Enter a title and a valid positive amount.");
      return;
    }
    if (entry.date && !isValidDateInput(entry.date)) {
      Alert.alert("Check the form", "Enter a valid date in YYYY-MM-DD format.");
      return;
    }
    if (!entry.incomeSource) {
      Alert.alert("Choose an income envelope", "Select the income envelope for this entry.");
      return;
    }
    const taxPercent = isExpense && entry.taxPercentage?.trim()
      ? Number(entry.taxPercentage)
      : 0;
    let taxAmount = isExpense && entry.taxAmount?.trim()
      ? toBaseAmount(entry.taxAmount, currency, rate)
      : 0;
    if (!Number.isFinite(taxPercent) || taxPercent < 0 || !Number.isFinite(taxAmount) || taxAmount < 0) {
      Alert.alert("Check the tax details", "Enter valid non-negative tax values.");
      return;
    }
    if (isExpense && taxPercent > 0 && !taxAmount) taxAmount = amount * taxPercent / 100;
    const finalAmount =
      isExpense && entry.taxApplication === "exclusive" && taxAmount > 0
        ? amount + taxAmount
        : amount;
    const data = {
      title: entry.title.trim(),
      amount: finalAmount,
      type: isExpense ? "expense" : "income",
      envelopeId: isFill ? undefined : entry.envelopeId || undefined,
      incomeSource: entry.incomeSource || undefined,
      paymentMethod: entry.paymentMethod || "cash",
      purpose: entry.purpose || undefined,
      date: fromDateInput(entry.date),
      taxPercentage: isExpense ? taxPercent || undefined : undefined,
      taxAmount: isExpense ? taxAmount || undefined : undefined,
      taxApplication: isExpense ? entry.taxApplication : undefined,
    };
    return runMutation(
      () => entry._id ? financeApi.updateTransaction(entry._id, data) : financeApi.createTransaction(data),
    );
  };

  const confirmDelete = (label, operation) =>
    Alert.alert(`Delete ${label}?`, "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { void runMutation(operation); } },
    ]);

  const deleteEnvelope = (id, income) =>
    confirmDelete("envelope", () => income ? financeApi.deleteIncomeEnvelope(id) : financeApi.deleteEnvelope(id));
  const deleteTransaction = (id) =>
    confirmDelete("transaction", () => financeApi.deleteTransaction(id));
  const deleteTransfer = (id) =>
    confirmDelete("transfer", () => financeApi.deleteTransfer(id));

  const savePageSize = () =>
    void runMutation(async () => {
      await financeApi.updateSettings({ transactionPageSize: pageSize });
      setPage(1);
    });

  const exportData = async () => {
    try {
      const [{ transactions }, transferResponse] = await Promise.all([
        financeApi.allTransactions(period),
        financeApi.transfers(period),
      ]);
      const fileUri = `${FileSystem.cacheDirectory}budget-transactions.csv`;
      await FileSystem.writeAsStringAsync(
        fileUri,
        toCsv(
          transactions,
          Array.isArray(transferResponse.data) ? transferResponse.data : [],
        ),
        {
        encoding: FileSystem.EncodingType.UTF8,
        },
      );
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: "text/csv", dialogTitle: "Export transactions" });
      } else {
        Alert.alert("Export created", `File saved to ${fileUri}`);
      }
    } catch (requestError) {
      Alert.alert("Export failed", messageFrom(requestError));
    }
  };

  const importData = async () => {
    try {
      const file = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "application/vnd.ms-excel"],
        copyToCacheDirectory: true,
      });
      if (file.canceled || !file.assets?.[0]?.uri) return;
      const content = await FileSystem.readAsStringAsync(file.assets[0].uri);
      const rows = parseCsv(content);
      if (rows.length < 2) throw new Error("The selected CSV has no transaction rows.");
      const headers = rows[0].map((header) =>
        header.replace(/^\uFEFF/, "").trim().toLowerCase(),
      );
      const index = (name) => headers.indexOf(name.toLowerCase());
      const requiredHeaders = ["title", "amount", "type"];
      const missingHeaders = requiredHeaders.filter((name) => index(name) === -1);
      if (missingHeaders.length) {
        throw new Error(`The CSV is missing required columns: ${missingHeaders.join(", ")}.`);
      }
      const valueAt = (values, name) => {
        const column = index(name);
        return column === -1 ? "" : values[column] || "";
      };
      let created = 0;
      for (const [rowIndex, values] of rows.slice(1).entries()) {
        const title = valueAt(values, "title");
        const amount = Number(valueAt(values, "amount"));
        const type = valueAt(values, "type").toLowerCase();
        if (!title.trim() || !Number.isFinite(amount) || amount === 0 || !["income", "expense"].includes(type)) continue;
        const date = valueAt(values, "date");
        if (date && !isValidDateInput(date)) {
          throw new Error(`Invalid date on CSV row ${rowIndex + 2}.`);
        }
        const taxPercentageValue = valueAt(values, "taxpercentage");
        const taxAmountValue = valueAt(values, "taxamount");
        const taxApplicationValue = valueAt(values, "taxapplication").toLowerCase();
        const taxPercentage = taxPercentageValue === "" ? null : Number(taxPercentageValue);
        const taxAmount = taxAmountValue === "" ? null : Number(taxAmountValue);
        if (
          (taxPercentage !== null && (!Number.isFinite(taxPercentage) || taxPercentage < 0)) ||
          (taxAmount !== null && (!Number.isFinite(taxAmount) || taxAmount < 0)) ||
          (taxApplicationValue && !["exclusive", "inclusive"].includes(taxApplicationValue))
        ) {
          throw new Error(`Invalid tax details on CSV row ${rowIndex + 2}.`);
        }
        const sourceName = valueAt(values, "incomesource");
        const envelopeName = valueAt(values, "envelope");
        const incomeSource = incomeEnvelopes.find(
          (envelope) =>
            envelope.name.toLowerCase() === sourceName.toLowerCase() ||
            String(envelope._id) === sourceName,
        );
        const envelope = envelopes.find(
          (item) =>
            item.name.toLowerCase() === envelopeName.toLowerCase() ||
            String(item._id) === envelopeName,
        );
        const transaction = {
          title: title.trim(),
          amount: Math.abs(amount),
          type,
          paymentMethod: valueAt(values, "paymentmethod") || "cash",
          purpose: valueAt(values, "purpose") || undefined,
          date: date || undefined,
          incomeSource: incomeSource?._id || null,
          envelopeId: envelope?._id || null,
          taxPercentage,
          taxAmount,
          taxApplication: taxApplicationValue || null,
        };
        const id = values[index("id")] || "";
        if (/^[a-f\d]{24}$/i.test(id)) {
          try {
            await financeApi.updateTransaction(id, transaction);
          } catch (requestError) {
            if (requestError?.response?.status !== 404) throw requestError;
            await financeApi.createTransaction(transaction);
          }
        } else {
          await financeApi.createTransaction(transaction);
        }
        created += 1;
      }
      setRefreshVersion((version) => version + 1);
      Alert.alert("Import complete", `${created} transaction${created === 1 ? "" : "s"} imported.`);
    } catch (requestError) {
      Alert.alert("Import failed", messageFrom(requestError));
    }
  };

  const renderTabs = () => (
    <NavigationContainer>
      <Tabs.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: COLORS.green,
          tabBarInactiveTintColor: COLORS.muted,
          tabBarLabelStyle: styles.tabLabel,
          sceneStyle: { backgroundColor: COLORS.background },
        }}
      >
        <Tabs.Screen name="Home" options={{ tabBarLabel: "Home", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>⌂</Text> }}>
          {({ navigation }) => (
            <HomeScreen
              user={user}
              period={period}
              setPeriod={changePeriod}
              totals={totals}
              envelopes={envelopes}
              incomeEnvelopes={incomeEnvelopes}
              transactions={dashboardTransactions}
              currency={currency}
              rate={rate}
              loading={dashboardLoading}
              refresh={refresh}
              openEntry={openEntry}
              navigate={(name) => navigation.navigate(name)}
            />
          )}
        </Tabs.Screen>
        <Tabs.Screen name="Activity" options={{ tabBarLabel: "Activity", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>↕</Text> }}>
          {() => (
            <ActivityScreen
              period={period}
              setPeriod={changePeriod}
              transactions={activityTransactions}
              transfers={transfers}
              envelopes={envelopes}
              incomeEnvelopes={incomeEnvelopes}
              currency={currency}
              rate={rate}
              loading={activityLoading || dashboardLoading}
              page={page}
              pages={pages}
              total={total}
              pageSize={pageSize}
              setPage={setPage}
              search={search}
              setSearch={(value) => { setSearch(value); setPage(1); }}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              activityTab={activityTab}
              setActivityTab={setActivityTab}
              refresh={() => { void refresh(); void loadActivity(); }}
              openEntry={openEntry}
              deleteTransaction={deleteTransaction}
              deleteTransfer={deleteTransfer}
              editTransfer={(transfer) => openEntry("transfer", transfer)}
              exportData={exportData}
              importData={importData}
            />
          )}
        </Tabs.Screen>
        <Tabs.Screen name="Envelopes" options={{ tabBarLabel: "Envelopes", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>▤</Text> }}>
          {() => (
            <EnvelopesScreen
              envelopes={envelopes}
              incomeEnvelopes={incomeEnvelopes}
              currency={currency}
              rate={rate}
              period={period}
              loading={dashboardLoading}
              refresh={refresh}
              openEntry={openEntry}
              deleteEnvelope={deleteEnvelope}
            />
          )}
        </Tabs.Screen>
        <Tabs.Screen name="Analytics" options={{ tabBarLabel: "Analytics", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>▥</Text> }}>
          {() => <AnalyticsScreen currency={currency} rate={rate} refreshTransactions={refreshVersion} />}
        </Tabs.Screen>
        <Tabs.Screen name="Settings" options={{ tabBarLabel: "Settings", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>⚙</Text> }}>
          {() => (
            <SettingsScreen
              user={user}
              currency={currency}
              setCurrency={setCurrency}
              rate={rate}
              pageSize={pageSize}
              setPageSize={setPageSize}
              savePageSize={savePageSize}
              saving={saving}
              logout={logout}
            />
          )}
        </Tabs.Screen>
      </Tabs.Navigator>
    </NavigationContainer>
  );

  if (authLoading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={COLORS.green} size="large" />
        <Text style={styles.itemMeta}>Loading your account…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.app}>
      <ExpoStatusBar style="light" />
      {user ? (
        <>
          {error ? (
            <Pressable style={styles.errorBanner} onPress={() => setError("")}>
              <Text style={styles.errorBannerText}>{error}  ·  Tap to dismiss</Text>
            </Pressable>
          ) : null}
          {renderTabs()}
          <EntryModal
            entry={entry}
            setEntry={setEntry}
            visible={Boolean(entry)}
            busy={saving}
            onClose={() => setEntry(null)}
            onSave={saveEntry}
            envelopes={envelopes}
            incomeEnvelopes={incomeEnvelopes}
            currency={currency}
            rate={rate}
          />
        </>
      ) : (
        <LoginScreen
          onLogin={(credentials) => handleAuth(authApi.login, credentials)}
          onRegister={(credentials) => handleAuth(authApi.register, credentials)}
          busy={authBusy}
          error={authError}
        />
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: COLORS.background },
  loadingScreen: { flex: 1, backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center", gap: 12 },
  screen: { flex: 1, backgroundColor: COLORS.background },
  screenContent: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 28, gap: 12 },
  screenHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 4 },
  screenHeaderText: { flex: 1, minWidth: 0 },
  screenTitle: { color: COLORS.text, fontSize: 25, fontWeight: "800", letterSpacing: -0.5 },
  screenSubtitle: { color: COLORS.muted, fontSize: 13, marginTop: 4, lineHeight: 19 },
  card: { backgroundColor: COLORS.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: COLORS.border, gap: 12 },
  cardTitle: { color: COLORS.text, fontSize: 17, fontWeight: "700" },
  bodyText: { color: COLORS.muted, fontSize: 13, lineHeight: 20 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10, marginBottom: 1 },
  sectionTitle: { color: COLORS.text, fontSize: 17, fontWeight: "700" },
  linkText: { color: COLORS.green, fontWeight: "700", fontSize: 12 },
  dangerLink: { color: COLORS.red, fontWeight: "700", fontSize: 12 },
  button: { minHeight: 46, paddingHorizontal: 16, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#0f766e" },
  buttonCompact: { minHeight: 38, paddingHorizontal: 12 },
  buttonSecondary: { backgroundColor: COLORS.surfaceRaised, borderWidth: 1, borderColor: COLORS.border },
  buttonDanger: { backgroundColor: "#9f3048" },
  buttonQuiet: { backgroundColor: "transparent" },
  buttonPressed: { opacity: 0.72 },
  buttonText: { color: "#f0fdfa", fontSize: 13, fontWeight: "700" },
  buttonSecondaryText: { color: COLORS.text },
  buttonQuietText: { color: COLORS.muted },
  field: { gap: 6 },
  fieldLabel: { color: "#d1dbea", fontSize: 12, fontWeight: "600" },
  input: { minHeight: 48, borderRadius: 12, paddingHorizontal: 13, color: COLORS.text, backgroundColor: COLORS.input, borderWidth: 1, borderColor: COLORS.border, fontSize: 15 },
  inputMultiline: { minHeight: 80, paddingTop: 12, textAlignVertical: "top" },
  selectTrigger: { minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, borderRadius: 12, paddingHorizontal: 14, backgroundColor: COLORS.input, borderWidth: 1, borderColor: COLORS.border },
  selectValue: { flex: 1, color: COLORS.text, fontSize: 14 },
  selectChevron: { color: COLORS.green, fontSize: 22, lineHeight: 24, marginTop: -7 },
  selectBackdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 22, backgroundColor: "rgba(3, 7, 18, 0.78)" },
  selectSheet: { width: "100%", maxWidth: 460, maxHeight: "78%", borderRadius: 22, overflow: "hidden", backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  selectHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  selectHeaderText: { flex: 1, gap: 3 },
  selectTitle: { color: COLORS.text, fontSize: 17, fontWeight: "800" },
  selectSubtitle: { color: COLORS.muted, fontSize: 11 },
  selectOptions: { padding: 10 },
  selectOption: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingHorizontal: 14, marginVertical: 3, borderRadius: 12 },
  selectOptionSelected: { backgroundColor: COLORS.greenWash, borderWidth: 1, borderColor: COLORS.greenBorder },
  selectOptionText: { flex: 1, color: COLORS.text, fontSize: 14 },
  selectOptionTextSelected: { color: COLORS.greenText, fontWeight: "700" },
  selectCheck: { color: COLORS.green, fontSize: 17, fontWeight: "800" },
  periodList: { gap: 8, paddingVertical: 2 },
  periodChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 30, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  periodChipSelected: { backgroundColor: COLORS.greenWash, borderColor: COLORS.greenBorder },
  periodText: { color: COLORS.muted, fontSize: 12, fontWeight: "600" },
  periodTextSelected: { color: COLORS.greenText },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metricCard: { flexBasis: "47%", flexGrow: 1, padding: 14, gap: 7 },
  metricLabel: { color: COLORS.muted, fontSize: 12, fontWeight: "600" },
  metricValue: { fontSize: 19, fontWeight: "800" },
  metricHint: { color: COLORS.muted, fontSize: 10 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickAction: { flexBasis: "47%", flexGrow: 1, minHeight: 58, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 13, borderRadius: 14, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  quickDot: { height: 9, width: 9, borderRadius: 10 },
  quickActionText: { color: COLORS.text, fontWeight: "600", fontSize: 12, flexShrink: 1 },
  listCard: { padding: 13, gap: 6 },
  listRow: { flexDirection: "row", alignItems: "center", gap: 11 },
  flexFill: { flex: 1, minWidth: 0 },
  itemTitle: { color: COLORS.text, fontSize: 14, fontWeight: "600" },
  itemMeta: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
  amountText: { color: COLORS.text, fontWeight: "700", fontSize: 13 },
  itemAmount: { alignItems: "flex-end", gap: 7 },
  rowActions: { flexDirection: "row", gap: 12, marginTop: 4 },
  transactionIcon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  purposeText: { color: COLORS.muted, fontSize: 11, marginLeft: 45 },
  emptyState: { alignItems: "center", paddingVertical: 24 },
  emptyTitle: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  emptyText: { color: COLORS.muted, fontSize: 12, marginTop: 5, textAlign: "center" },
  segmentRow: { flexDirection: "row", padding: 4, backgroundColor: COLORS.surface, borderRadius: 13, borderWidth: 1, borderColor: COLORS.border },
  segment: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 10 },
  segmentActive: { backgroundColor: COLORS.surfaceRaised },
  segmentText: { color: COLORS.muted, fontSize: 12, fontWeight: "600" },
  segmentTextActive: { color: COLORS.text },
  toolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" },
  pagination: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 },
  paginationText: { color: COLORS.muted, fontSize: 10, flex: 1, textAlign: "center" },
  envelopeCard: { gap: 12 },
  envelopeActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" },
  chart: { height: 190, flexDirection: "row", alignItems: "stretch", justifyContent: "space-around", gap: 6, paddingTop: 10 },
  chartColumn: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 7 },
  barGroup: { flex: 1, width: "100%", flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 3 },
  bar: { width: "28%", minHeight: 3, borderTopLeftRadius: 5, borderTopRightRadius: 5 },
  chartLabel: { color: COLORS.muted, fontSize: 10 },
  legendRow: { flexDirection: "row", justifyContent: "center", gap: 18 },
  legend: { fontSize: 11, fontWeight: "600" },
  tabBar: { backgroundColor: COLORS.surface, borderTopColor: COLORS.border, height: 62, paddingTop: 5, paddingBottom: 5 },
  tabLabel: { fontSize: 10, fontWeight: "600" },
  authScreen: { flex: 1, backgroundColor: COLORS.background },
  authKeyboard: { flex: 1 },
  authContent: { flexGrow: 1, justifyContent: "center", padding: 22 },
  brandMark: { width: 54, height: 54, borderRadius: 18, backgroundColor: COLORS.greenWash, borderWidth: 1, borderColor: COLORS.greenBorder, alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 15 },
  brandMarkText: { color: COLORS.green, fontSize: 26, fontWeight: "800" },
  authTitle: { color: COLORS.text, textAlign: "center", fontSize: 27, fontWeight: "800" },
  authSubtitle: { color: COLORS.muted, textAlign: "center", marginTop: 8, marginBottom: 25, fontSize: 13 },
  authCard: { padding: 20, gap: 15 },
  authSwitch: { paddingVertical: 8 },
  authSwitchText: { color: COLORS.blue, textAlign: "center", fontSize: 12, fontWeight: "600" },
  authFootnote: { color: COLORS.muted, textAlign: "center", marginTop: 20, fontSize: 11 },
  errorText: { color: COLORS.red, fontSize: 12, lineHeight: 18 },
  errorBanner: { backgroundColor: COLORS.redWash, padding: 9 },
  errorBannerText: { color: COLORS.redText, fontSize: 11, textAlign: "center" },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.65)" },
  modalCard: { width: "100%", maxWidth: 560, maxHeight: "92%", alignSelf: "center", backgroundColor: COLORS.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: COLORS.border, paddingBottom: Platform.OS === "ios" ? 22 : 8 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 18, paddingBottom: 13, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { color: COLORS.text, fontSize: 18, fontWeight: "800" },
  closeText: { color: COLORS.muted, fontSize: 20, padding: 4 },
  modalBody: { padding: 18, gap: 14 },
  versionText: { color: COLORS.muted, textAlign: "center", paddingVertical: 12, fontSize: 10 },
});
