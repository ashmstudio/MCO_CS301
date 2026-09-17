const sections = document.querySelectorAll('.section');
const navButtons = document.querySelectorAll('.nav-btn');
const registerNavButton = document.getElementById('registerNavButton');
const loginNavButton = document.getElementById('loginNavButton');
const logoutNavButton = document.getElementById('logoutNavButton');
const loginMessage = document.getElementById('loginMessage');
const registerMessage = document.getElementById('registerMessage');
const assessmentMessage = document.getElementById('assessmentMessage');
const assessmentNotice = document.getElementById('assessmentNotice');
const assessmentWizard = document.getElementById('assessmentWizard');
const studentNameInput = document.getElementById('studentName');
const accountPanel = document.getElementById('accountPanel');
const accountName = document.getElementById('accountName');
const resultSummary = document.getElementById('resultSummary');
const statusBadge = document.getElementById('statusBadge');
const recommendationBox = document.getElementById('recommendationBox');
const wizardResultSummary = document.getElementById('wizardResultSummary');
const wizardStatusBadge = document.getElementById('wizardStatusBadge');
const wizardRecommendationBox = document.getElementById('wizardRecommendationBox');
const historyList = document.getElementById('historyList');
const historyPanel = document.querySelector('.history-panel');
const stepIndicator = document.getElementById('stepIndicator');
const assessmentBackBtn = document.getElementById('assessmentBackBtn');
const assessmentNextBtn = document.getElementById('assessmentNextBtn');
const assessmentSteps = Array.from(document.querySelectorAll('.assessment-step'));
const accountTabButtons = Array.from(document.querySelectorAll('.account-tab'));
const accountTabPanels = Array.from(document.querySelectorAll('.account-tab-panel'));
const accountFullName = document.getElementById('accountFullName');
const accountEmail = document.getElementById('accountEmail');
const accountRegistrationDate = document.getElementById('accountRegistrationDate');
const accountCurrentSavings = document.getElementById('accountCurrentSavings');
const accountSavingsGoal = document.getElementById('accountSavingsGoal');
const accountGoalPurpose = document.getElementById('accountGoalPurpose');
const accountSavingPeriod = document.getElementById('accountSavingPeriod');
const accountPlannedSavings = document.getElementById('accountPlannedSavings');
const accountAssessmentDate = document.getElementById('accountAssessmentDate');
const accountAssessmentResult = document.getElementById('accountAssessmentResult');
const accountAvailableMoney = document.getElementById('accountAvailableMoney');
const accountRequiredSavings = document.getElementById('accountRequiredSavings');
const accountHistoryList = document.getElementById('accountHistoryList');
const editAccountName = document.getElementById('editAccountName');
const editAccountEmail = document.getElementById('editAccountEmail');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const accountProfileMessage = document.getElementById('accountProfileMessage');

const state = {
  currentUser: null,
  lastAssessment: null,
  currentStep: 1,
};

function showSection(sectionId) {
  sections.forEach((section) => {
    section.classList.toggle('active', section.id === sectionId);
  });

  navButtons.forEach((button) => {
    const isActive = button.dataset.target === sectionId;
    button.classList.toggle('active', isActive);
  });
}

function setMessage(element, message, type = '') {
  element.textContent = message;
  element.className = 'form-message';
  if (type) {
    element.classList.add(type);
  }
}

function switchAccountTab(tabName) {
  accountTabButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.accountTab === tabName);
  });

  accountTabPanels.forEach((panel) => {
    panel.classList.toggle('active', panel.id === `account${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Tab`);
  });
}

function showAssessmentStep(stepNumber) {
  state.currentStep = stepNumber;
  assessmentSteps.forEach((step) => {
    step.classList.toggle('active', Number(step.dataset.step) === Number(stepNumber));
  });

  const totalSteps = 5;
  stepIndicator.textContent = `Step ${stepNumber} of ${totalSteps}`;
  assessmentBackBtn.classList.toggle('hidden', stepNumber === 1);

  assessmentNextBtn.classList.remove('hidden');
  assessmentNextBtn.textContent = stepNumber === totalSteps ? 'Calculate Assessment' : 'Next';
}

function formatMoney(value) {
  const num = Number(value || 0);
  return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function setUserState(user) {
  state.currentUser = user;
  const isRegistered = Boolean(user && user.name);

  if (isRegistered) {
    registerNavButton.textContent = 'My Account';
    registerNavButton.dataset.target = 'account';
    loginNavButton.classList.add('hidden');
    logoutNavButton.classList.remove('hidden');
    accountPanel.classList.remove('hidden');
    accountName.textContent = user.name;
    studentNameInput.value = user.name;
  } else {
    registerNavButton.textContent = 'Register';
    registerNavButton.dataset.target = 'register';
    loginNavButton.classList.remove('hidden');
    logoutNavButton.classList.add('hidden');
    accountPanel.classList.add('hidden');
    historyPanel.classList.add('hidden');
    studentNameInput.value = '';
  }
}

function updateAssessmentAccess() {
  const registered = Boolean(state.currentUser && state.currentUser.name);
  const notice = document.getElementById('assessmentNotice');

  if (registered) {
    assessmentWizard.classList.remove('hidden');
    notice.classList.add('hidden');
    studentNameInput.value = state.currentUser.name;
    showAssessmentStep(1);
  } else {
    assessmentWizard.classList.add('hidden');
    notice.classList.remove('hidden');
    studentNameInput.value = '';
  }
}

async function fetchCurrentUser() {
  try {
    const response = await fetch('/api/current-user');
    const data = await response.json();

    if (data.logged_in) {
      setUserState(data);
      await loadHistory();
    } else {
      setUserState(null);
    }
    updateAssessmentAccess();
  } catch (error) {
    setUserState(null);
    updateAssessmentAccess();
  }
}

async function loadHistory() {
  try {
    const response = await fetch('/api/history');
    const data = await response.json();
    const items = data.assessments || [];

    if (!items.length) {
      historyList.innerHTML = '<p>No previous assessments yet.</p>';
      historyPanel.classList.remove('hidden');
      return;
    }

    historyList.innerHTML = items.slice(0, 3).map((item) => {
      const status = item.assessment_status || 'GOAL ACHIEVABLE';
      return `
        <div class="history-item">
          <h4>${item.date}</h4>
          <p>Goal: ${formatMoney(item.savings_goal)} | Period: ${item.saving_period} months | Status: ${status}</p>
        </div>
      `;
    }).join('');
    historyPanel.classList.remove('hidden');
  } catch (error) {
    historyList.innerHTML = '<p>No previous assessments yet.</p>';
    historyPanel.classList.add('hidden');
  }
}

function buildAssessmentPayloadFromForm() {
  return {
    studentName: document.getElementById('studentName').value,
    monthlyAllowance: document.getElementById('monthlyAllowance').value,
    allowanceFrequency: document.getElementById('allowanceFrequency').value,
    food: document.getElementById('food').value,
    transportation: document.getElementById('transportation').value,
    school: document.getElementById('school').value,
    internet: document.getElementById('internet').value,
    personal: document.getElementById('personal').value,
    other: document.getElementById('other').value,
    currentSavings: document.getElementById('currentSavings').value,
    goalPurpose: document.getElementById('goalPurpose').value,
    savingsGoal: document.getElementById('savingsGoal').value,
    savingPeriod: document.getElementById('savingPeriod').value,
    plannedMonthlySavings: document.getElementById('plannedMonthlySavings').value,
  };
}

function validateNumberField(value, label) {
  if (value === '' || value === null || value === undefined) {
    return `${label} is required.`;
  }
  const num = Number(value);
  if (Number.isNaN(num) || num < 0) {
    return `Please enter a valid amount for ${label.toLowerCase()}.`;
  }
  return '';
}

function validateAssessmentStep(stepNumber) {
  const values = buildAssessmentPayloadFromForm();

  if (stepNumber === 1) {
    if (!values.studentName || !values.studentName.trim()) {
      return 'Please enter your name.';
    }
    return '';
  }

  if (stepNumber === 2) {
    if (!values.monthlyAllowance && values.monthlyAllowance !== '0') {
      return 'Please enter your monthly allowance.';
    }
    if (Number(values.monthlyAllowance) < 0) {
      return 'Please enter a valid amount for monthly allowance.';
    }
    return '';
  }

  if (stepNumber === 3) {
    const checks = [
      ['Food / Meals', values.food],
      ['Transportation', values.transportation],
      ['School Expenses', values.school],
      ['Mobile Data / Internet', values.internet],
      ['Personal Expenses', values.personal],
      ['Other Expenses', values.other],
    ];

    for (const [label, value] of checks) {
      const error = validateNumberField(value || '0', label);
      if (error) {
        return error;
      }
    }
    return '';
  }

  if (stepNumber === 4) {
    if (!values.savingsGoal && values.savingsGoal !== '0') {
      return 'Please enter your savings goal.';
    }
    if (!values.savingPeriod || Number(values.savingPeriod) <= 0) {
      return 'Saving period must be greater than 0.';
    }
    if (Number(values.currentSavings) < 0 || Number(values.savingsGoal) < 0) {
      return 'Please enter valid non-negative amounts.';
    }
    return '';
  }

  if (stepNumber === 5) {
    if (!values.plannedMonthlySavings && values.plannedMonthlySavings !== '0') {
      return 'Please enter a planned monthly savings amount.';
    }
    if (Number(values.plannedMonthlySavings) < 0) {
      return 'Please enter a valid amount for planned monthly savings.';
    }
    return '';
  }

  return '';
}

function renderResultView(result) {
  state.lastAssessment = result;
  const rows = [
    ['Estimated Monthly Income', result.estimatedMonthlyIncome],
    ['Total Monthly Expenses', result.totalMonthlyExpenses],
    ['Available Money', result.availableMoney],
    ['Current Savings', result.currentSavings],
    ['Savings Goal', result.savingsGoal],
    ['Required Monthly Savings', result.requiredMonthlySavings],
    ['Planned Monthly Savings', result.plannedMonthlySavings],
    ['Saving Period', `${result.savingPeriod} months`],
    ['Expected Savings', result.expectedSavings],
  ];

  const summaryTarget = wizardResultSummary || resultSummary;
  summaryTarget.innerHTML = rows.map(([label, value]) => `
    <div class="summary-row">
      <span>${label}</span>
      <strong>${typeof value === 'string' && value.includes('months') ? value : formatMoney(value)}</strong>
    </div>
  `).join('');

  const statusClass = {
    GREEN: 'status-green',
    YELLOW: 'status-yellow',
    RED: 'status-red',
  }[result.status] || 'status-green';

  const badgeTarget = wizardStatusBadge || statusBadge;
  const recommendationTarget = wizardRecommendationBox || recommendationBox;
  badgeTarget.className = `status-badge ${statusClass}`;
  badgeTarget.textContent = result.statusLabel;
  recommendationTarget.textContent = result.recommendation;

  document.getElementById('recalcPlan').value = result.plannedMonthlySavings;
  document.getElementById('recalcPeriod').value = result.savingPeriod;
}

function displayResult(result) {
  renderResultView(result);
  showSection('result');
  setMessage(assessmentMessage, 'Assessment saved successfully.', 'success');
}

async function submitAssessment() {
  const errorMessage = validateAssessmentStep(state.currentStep);
  if (errorMessage) {
    setMessage(assessmentMessage, errorMessage, 'error');
    return;
  }

  if (state.currentStep < 5) {
    showAssessmentStep(state.currentStep + 1);
    return;
  }

  const payload = buildAssessmentPayloadFromForm();
  try {
    const response = await fetch('/api/assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      setMessage(assessmentMessage, data.message || 'Unable to process assessment.', 'error');
      return;
    }

    displayResult(data.result);
    await loadHistory();
  } catch (error) {
    setMessage(assessmentMessage, 'Unable to process assessment. Please try again.', 'error');
  }
}

async function submitRegistration(event) {
  event.preventDefault();
  const payload = {
    name: document.getElementById('registerName').value.trim(),
    email: document.getElementById('registerEmail').value.trim(),
    password: document.getElementById('registerPassword').value,
    confirmPassword: document.getElementById('registerConfirmPassword').value,
  };

  if (!payload.name) {
    setMessage(registerMessage, 'Please enter your name.', 'error');
    return;
  }
  if (!payload.email) {
    setMessage(registerMessage, 'Please enter your email.', 'error');
    return;
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.email)) {
    setMessage(registerMessage, 'Please enter a valid email.', 'error');
    return;
  }
  if (!payload.password) {
    setMessage(registerMessage, 'Please enter a password.', 'error');
    return;
  }
  if (payload.password.length < 6) {
    setMessage(registerMessage, 'Password must be at least 6 characters long.', 'error');
    return;
  }
  if (!payload.confirmPassword) {
    setMessage(registerMessage, 'Please confirm your password.', 'error');
    return;
  }
  if (payload.password !== payload.confirmPassword) {
    setMessage(registerMessage, 'Passwords do not match.', 'error');
    return;
  }

  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
      setMessage(registerMessage, data.message || 'Unable to create account. Please check your information.', 'error');
      return;
    }

    setMessage(registerMessage, data.message, 'success');
    setUserState(data.user);
    updateAssessmentAccess();
    await loadHistory();
    showSection('assessment');
  } catch (error) {
    setMessage(registerMessage, 'Unable to create account. Please check your information.', 'error');
  }
}

async function submitLogin(event) {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    setMessage(loginMessage, 'Please enter your email and password.', 'error');
    return;
  }

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
      setMessage(loginMessage, 'Invalid email or password.', 'error');
      return;
    }

    setUserState(data.user);
    updateAssessmentAccess();
    await loadHistory();
    await loadAccountData();
    showSection('home');
  } catch (error) {
    setMessage(loginMessage, 'Unable to log in. Please try again.', 'error');
  }
}

async function logoutUser() {
  await fetch('/api/logout', { method: 'POST' });
  state.currentUser = null;
  setUserState(null);
  updateAssessmentAccess();
  showSection('home');
  setMessage(loginMessage, 'You have been logged out.', 'success');
}

async function handleNavClick(event) {
  const target = event.currentTarget.dataset.target;

  if (target === 'assessment') {
    if (!state.currentUser || !state.currentUser.name) {
      showSection('assessment');
      setMessage(assessmentMessage, 'Please log in first to continue.', 'error');
      updateAssessmentAccess();
      return;
    }
  }

  if (target === 'account') {
    if (!state.currentUser || !state.currentUser.name) {
      showSection('login');
      setMessage(loginMessage, 'Please log in first to continue.', 'error');
      return;
    }
    showSection('account');
    switchAccountTab('profile');
    await loadAccountData();
    return;
  }

  if (target === 'register') {
    showSection('register');
    return;
  }

  showSection(target);
}

async function recalculateAssessment(event) {
  event.preventDefault();
  if (!state.currentUser || !state.currentUser.name) {
    setMessage(assessmentMessage, 'Please log in first to continue.', 'error');
    showSection('home');
    return;
  }

  const plannedMonthlySavings = document.getElementById('recalcPlan').value;
  const savingPeriod = document.getElementById('recalcPeriod').value;
  if (!plannedMonthlySavings && plannedMonthlySavings !== '0') {
    setMessage(assessmentMessage, 'Please enter a planned monthly savings amount.', 'error');
    return;
  }
  if (!savingPeriod || Number(savingPeriod) <= 0) {
    setMessage(assessmentMessage, 'Saving period must be greater than 0.', 'error');
    return;
  }

  const payload = { ...buildAssessmentPayloadFromForm(), plannedMonthlySavings, savingPeriod };
  try {
    const response = await fetch('/api/assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      setMessage(assessmentMessage, data.message || 'Unable to recalculate.', 'error');
      return;
    }

    displayResult(data.result);
    await loadHistory();
  } catch (error) {
    setMessage(assessmentMessage, 'Unable to recalculate. Please try again.', 'error');
  }
}

async function loadAccountData() {
  if (!state.currentUser || !state.currentUser.name) {
    return;
  }

  try {
    const response = await fetch('/api/account');
    const data = await response.json();

    if (!data.logged_in) {
      return;
    }

    const user = data.user || {};
    const summary = data.summary || {};
    const assessments = data.assessments || [];

    accountFullName.textContent = user.name || 'N/A';
    accountEmail.textContent = user.email || 'N/A';
    accountRegistrationDate.textContent = user.registration_date || 'N/A';
    if (!assessments.length) {
      accountCurrentSavings.textContent = 'No assessment has been completed yet.';
      accountSavingsGoal.textContent = 'No assessment has been completed yet.';
      accountGoalPurpose.textContent = 'No assessment has been completed yet.';
      accountSavingPeriod.textContent = 'No assessment has been completed yet.';
      accountPlannedSavings.textContent = 'No assessment has been completed yet.';
    } else {
      accountCurrentSavings.textContent = formatMoney(summary.current_savings);
      accountSavingsGoal.textContent = formatMoney(summary.savings_goal);
      accountGoalPurpose.textContent = summary.goal_purpose;
      accountSavingPeriod.textContent = `${summary.saving_period} months`;
      accountPlannedSavings.textContent = formatMoney(summary.planned_monthly_savings);
    }
    accountAssessmentDate.textContent = assessments.length ? summary.last_assessment_date : 'N/A';
    accountAssessmentResult.textContent = assessments.length ? summary.last_result : 'N/A';
    accountAvailableMoney.textContent = assessments.length ? formatMoney(summary.available_money) : 'N/A';
    accountRequiredSavings.textContent = assessments.length ? formatMoney(summary.required_monthly_savings) : 'N/A';

    editAccountName.value = user.name || '';
    editAccountEmail.value = user.email || '';

    if (!assessments.length) {
      accountHistoryList.innerHTML = '<p>No previous assessments yet.</p>';
      return;
    }

    accountHistoryList.innerHTML = assessments.map((item) => `
      <div class="history-item">
        <h4>${item.date}</h4>
        <p>Goal: ${formatMoney(item.savings_goal)} | Planned Savings: ${formatMoney(item.planned_monthly_savings)}/month | Result: ${item.assessment_status || 'GOAL ACHIEVABLE'}</p>
      </div>
    `).join('');
  } catch (error) {
    accountHistoryList.innerHTML = '<p>No previous assessments yet.</p>';
  }
}

async function saveProfile() {
  if (!state.currentUser || !state.currentUser.name) {
    setMessage(accountProfileMessage, 'Please log in first to continue.', 'error');
    return;
  }

  const name = editAccountName.value.trim();
  const email = editAccountEmail.value.trim();

  if (!name) {
    setMessage(accountProfileMessage, 'Please enter your name.', 'error');
    return;
  }
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    setMessage(accountProfileMessage, 'Please enter a valid email.', 'error');
    return;
  }

  try {
    const response = await fetch('/api/account', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
      setMessage(accountProfileMessage, data.message || 'Unable to update profile.', 'error');
      return;
    }

    setMessage(accountProfileMessage, 'Profile updated successfully.', 'success');
    state.currentUser = { ...state.currentUser, name, email };
    setUserState(state.currentUser);
    await loadAccountData();
    await loadHistory();
  } catch (error) {
    setMessage(accountProfileMessage, 'Unable to update profile.', 'error');
  }
}

async function clearAccount() {
  const confirmed = window.confirm('Clear your account and saved assessment information?');
  if (!confirmed) {
    return;
  }

  try {
    await fetch('/api/clear-account', { method: 'POST' });
    state.currentUser = null;
    setUserState(null);
    updateAssessmentAccess();
    showSection('home');
    setMessage(registerMessage, 'Account cleared.', 'success');
    historyList.innerHTML = '<p>No previous assessments yet.</p>';
    accountHistoryList.innerHTML = '<p>No previous assessments yet.</p>';
  } catch (error) {
    console.error(error);
  }
}

async function clearAssessmentData() {
  if (!state.currentUser || !state.currentUser.name) {
    setMessage(accountProfileMessage, 'Please log in first to continue.', 'error');
    return;
  }

  const confirmed = window.confirm('Clear all saved assessment data for this account?');
  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch('/api/clear-assessment-data', { method: 'POST' });
    const data = await response.json();
    if (!response.ok || !data.success) {
      setMessage(accountProfileMessage, data.message || 'Unable to clear assessment data.', 'error');
      return;
    }

    setMessage(accountProfileMessage, 'Assessment data cleared.', 'success');
    await loadAccountData();
    await loadHistory();
  } catch (error) {
    setMessage(accountProfileMessage, 'Unable to clear assessment data.', 'error');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('registerForm').addEventListener('submit', submitRegistration);
  document.getElementById('loginForm').addEventListener('submit', submitLogin);
  document.getElementById('recalculateForm').addEventListener('submit', recalculateAssessment);
  document.getElementById('loginRegisterButton').addEventListener('click', () => showSection('register'));
  document.getElementById('loginNowButton').addEventListener('click', () => showSection('login'));
  document.getElementById('registerNowButton').addEventListener('click', () => showSection('register'));
  document.getElementById('registerHomeButton').addEventListener('click', () => showSection('register'));

  assessmentNextBtn.addEventListener('click', submitAssessment);
  assessmentBackBtn.addEventListener('click', () => {
    if (state.currentStep > 1) {
      showAssessmentStep(state.currentStep - 1);
    }
  });

  accountTabButtons.forEach((button) => {
    button.addEventListener('click', () => switchAccountTab(button.dataset.accountTab));
  });

  document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);
  document.getElementById('takeAssessmentBtn').addEventListener('click', () => {
    showSection('assessment');
    showAssessmentStep(1);
  });
  document.getElementById('accountLogoutBtn').addEventListener('click', logoutUser);
  document.getElementById('clearAssessmentDataBtn').addEventListener('click', clearAssessmentData);
  document.getElementById('clearAccountBtn').addEventListener('click', clearAccount);
  document.getElementById('backToHomeBtn').addEventListener('click', () => {
    showSection('home');
  });

  navButtons.forEach((button) => {
    button.addEventListener('click', handleNavClick);
  });

  registerNavButton.addEventListener('click', () => {
    if (state.currentUser && state.currentUser.name) {
      showSection('account');
      switchAccountTab('profile');
      loadAccountData();
    } else {
      showSection('register');
    }
  });
  loginNavButton.addEventListener('click', () => showSection('login'));
  logoutNavButton.addEventListener('click', logoutUser);

  document.getElementById('clearAccountButton').addEventListener('click', clearAccount);

  await fetchCurrentUser();
  showSection('home');
});
