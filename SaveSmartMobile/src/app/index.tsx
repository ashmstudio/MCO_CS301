import Constants from 'expo-constants';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Mode = 'login' | 'register';
type FieldName = 'monthlyAllowance' | 'food' | 'transportation' | 'school' | 'internet' | 'personal' | 'other' | 'currentSavings' | 'savingsGoal' | 'savingPeriod' | 'plannedMonthlySavings';
type Result = { statusLabel: string; recommendation: string; availableMoney: number; expectedSavings: number };

const hostUri = Constants.expoConfig?.hostUri;
const lanHost = hostUri?.split(':')[0];
const API_BASE = Platform.OS === 'web' ? 'http://127.0.0.1:5000' : `http://${lanHost || '127.0.0.1'}:5000`;
const initialValues: Record<FieldName, string> = { monthlyAllowance: '', food: '', transportation: '', school: '', internet: '', personal: '', other: '', currentSavings: '0', savingsGoal: '', savingPeriod: '', plannedMonthlySavings: '' };

async function apiRequest(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${path}`, { ...options, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const data = await response.json();
  if (!response.ok || data.success === false) throw new Error(data.message || 'Request failed.');
  return data;
}

export default function HomeScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [values, setValues] = useState(initialValues);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [message, setMessage] = useState(`API: ${API_BASE}`);
  const [busy, setBusy] = useState(false);

  function updateValue(field: FieldName, value: string) { setValues((current) => ({ ...current, [field]: value })); }

  async function submitAuth() {
    setBusy(true); setMessage('');
    try {
      const payload = mode === 'register' ? { name: name.trim(), email: email.trim(), password, confirmPassword } : { email: email.trim(), password };
      const data = await apiRequest(mode === 'register' ? '/api/register' : '/api/login', { method: 'POST', body: JSON.stringify(payload) });
      setUser(data.user); setName(data.user.name || name); setMessage('Connected. Complete your savings assessment below.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to connect to SaveSmart.'); } finally { setBusy(false); }
  }

  async function submitAssessment() {
    if (!values.monthlyAllowance || !values.savingsGoal || !values.savingPeriod || !values.plannedMonthlySavings) { setMessage('Please complete allowance, goal, period, and planned savings.'); return; }
    setBusy(true); setMessage('Calculating your plan...');
    try {
      const data = await apiRequest('/api/assessment', { method: 'POST', body: JSON.stringify({ studentName: name, allowanceFrequency: 'monthly', ...values }) });
      setResult(data.result); setMessage('Assessment saved successfully.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to submit assessment.'); } finally { setBusy(false); }
  }

  async function logout() { await apiRequest('/api/logout', { method: 'POST' }); setUser(null); setResult(null); setMessage(`Disconnected. API: ${API_BASE}`); }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}><View><Text style={styles.kicker}>STUDENT SAVINGS</Text><Text style={styles.title}>SaveSmart</Text></View>{user && <Pressable onPress={logout} style={styles.linkButton}><Text style={styles.linkText}>Log out</Text></Pressable>}</View>
          {!user ? <View style={styles.card}>
            <Text style={styles.cardTitle}>{mode === 'login' ? 'Welcome back' : 'Create your account'}</Text><Text style={styles.muted}>{mode === 'login' ? 'Sign in to assess your savings goal.' : 'Start planning your money with SaveSmart.'}</Text>
            {mode === 'register' && <TextInput value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor="#8c9187" style={styles.input} />}
            <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="#8c9187" keyboardType="email-address" autoCapitalize="none" style={styles.input} />
            <TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor="#8c9187" secureTextEntry style={styles.input} />
            {mode === 'register' && <TextInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm password" placeholderTextColor="#8c9187" secureTextEntry style={styles.input} />}
            <Pressable disabled={busy} onPress={submitAuth} style={styles.primary}><Text style={styles.primaryText}>{busy ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}</Text></Pressable>
            <Pressable onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setMessage(''); }}><Text style={styles.switchText}>{mode === 'login' ? 'Need an account? Register' : 'Already registered? Log in'}</Text></Pressable>
          </View> : <View style={styles.card}>
            <Text style={styles.cardTitle}>Build your plan</Text><Text style={styles.muted}>Monthly amounts in pesos. Fill in the required fields.</Text>
            <Field label="Monthly allowance *" value={values.monthlyAllowance} onChange={(v) => updateValue('monthlyAllowance', v)} /><Text style={styles.sectionLabel}>Monthly expenses</Text>
            {(['food', 'transportation', 'school', 'internet', 'personal', 'other'] as FieldName[]).map((field) => <Field key={field} label={field.replace(/([A-Z])/g, ' $1')} value={values[field]} onChange={(v) => updateValue(field, v)} />)}
            <Text style={styles.sectionLabel}>Savings goal</Text>{(['currentSavings', 'savingsGoal', 'savingPeriod', 'plannedMonthlySavings'] as FieldName[]).map((field) => <Field key={field} label={`${field.replace(/([A-Z])/g, ' $1')}${field !== 'currentSavings' ? ' *' : ''}`} value={values[field]} onChange={(v) => updateValue(field, v)} />)}
            <Pressable disabled={busy} onPress={submitAssessment} style={styles.primary}><Text style={styles.primaryText}>{busy ? 'Calculating...' : 'Calculate assessment'}</Text></Pressable>
          </View>}
          {!!message && <Text style={styles.message}>{message}</Text>}
          {result && <View style={styles.result}><Text style={styles.kicker}>LATEST RESULT</Text><Text style={styles.resultStatus}>{result.statusLabel}</Text><Text style={styles.resultText}>{result.recommendation}</Text><Text style={styles.resultMetric}>Available money: {peso(result.availableMoney)}</Text><Text style={styles.resultMetric}>Expected savings: {peso(result.expectedSavings)}</Text></View>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <TextInput value={value} onChangeText={onChange} placeholder={label} placeholderTextColor="#8c9187" keyboardType="decimal-pad" style={styles.input} />; }
function peso(value: string | number | undefined) { return `₱${Number(value || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}`; }

const styles = StyleSheet.create({
  flex: { flex: 1 }, safe: { flex: 1, backgroundColor: '#f5f2e9' }, content: { width: '100%', maxWidth: 620, alignSelf: 'center', padding: 24, paddingBottom: 48 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }, kicker: { color: '#b34d32', fontSize: 12, fontWeight: '800', letterSpacing: 1.5 }, title: { color: '#19352d', fontSize: 42, fontWeight: '800' },
  card: { backgroundColor: '#fffdf7', borderRadius: 14, padding: 22, borderWidth: 1, borderColor: '#e3ddcf', shadowColor: '#19352d', shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 2 }, cardTitle: { color: '#19352d', fontSize: 26, fontWeight: '800', marginTop: 4 }, muted: { color: '#687268', lineHeight: 21, marginTop: 6, marginBottom: 18 }, input: { backgroundColor: '#f3f0e7', borderWidth: 1, borderColor: '#ded8ca', borderRadius: 9, color: '#19352d', paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, marginBottom: 11 }, primary: { backgroundColor: '#b34d32', borderRadius: 9, alignItems: 'center', paddingVertical: 15, marginTop: 8 }, primaryText: { color: '#fffdf7', fontSize: 16, fontWeight: '800' }, linkButton: { padding: 8 }, linkText: { color: '#b34d32', fontWeight: '700' }, switchText: { color: '#b34d32', textAlign: 'center', marginTop: 17, fontWeight: '700' }, sectionLabel: { color: '#19352d', fontSize: 14, fontWeight: '800', marginTop: 14, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }, message: { color: '#687268', textAlign: 'center', lineHeight: 20, marginTop: 18 }, result: { backgroundColor: '#19352d', borderRadius: 14, padding: 22, marginTop: 22 }, resultStatus: { color: '#f3bf73', fontSize: 24, fontWeight: '800', marginTop: 7 }, resultText: { color: '#f5f2e9', lineHeight: 22, marginTop: 10 }, resultMetric: { color: '#f3bf73', fontSize: 16, fontWeight: '700', marginTop: 14 },
});
