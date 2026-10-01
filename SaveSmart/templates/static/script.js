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
const accountPanel = document.getElementById('accountPanel');
const accountName = document.getElementById('accountName');
const resultSummary = document.getElementById('resultSummary');
const statusBadge = document.getElementById('statusBadge');
const recommendationBox = document.getElementById('recommendationBox');
const historyList = document.getElementById('historyList');
const historyPanel = document.querySelector('.history-panel');
const stepIndicator = document.getElementById('stepIndicator');
const assessmentBackBtn = document.getElementById('assessmentBackBtn');
const assessmentResetBtn = document.getElementById('assessmentResetBtn');
const assessmentNextBtn = document.getElementById('assessmentNextBtn');
const assessmentSteps = Array.from(document.querySelectorAll('.assessment-step'));
const accountTabButtons = Array.from(document.querySelectorAll('.account-tab'));
const accountTabPanels = Array.from(document.querySelectorAll('.account-tab-panel'));
const accountActionsMenuBtn = document.getElementById('accountActionsMenuBtn');
const accountActionsPanel = document.getElementById('accountActionsPanel');
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

const dashboardNavItems = Array.from(document.querySelectorAll('[data-dashboard-view]'));
const dashboardPanels = Array.from(document.querySelectorAll('[data-dashboard-panel]'));

function moveExistingAssessmentIntoDashboard() {
  const wizardHost = document.getElementById('privateAssessmentWizardHost');
  const resultHost = document.getElementById('privateResultHost');
  const resultSection = document.getElementById('result');

  if (wizardHost && assessmentWizard) {
    wizardHost.appendChild(assessmentWizard);
  }
  if (resultHost && resultSection) {
    resultHost.appendChild(resultSection.firstElementChild);
    resultSection.classList.add('dashboard-result-source');
  }
}

function showDashboardView(viewName) {
  if (viewName === 'assessment') {
    showSection('account');
    dashboardPanels.forEach((panel) => {
      panel.classList.toggle('active', panel.dataset.dashboardPanel === 'assessment');
    });
    dashboardNavItems.forEach((item) => {
      item.classList.toggle('active', item.dataset.dashboardView === 'assessment');
    });
    updateAssessmentAccess();
    return;
  }

  showSection('account');
  dashboardPanels.forEach((panel) => {
    panel.classList.toggle('active', panel.dataset.dashboardPanel === viewName);
  });
  dashboardNavItems.forEach((item) => {
    item.classList.toggle('active', item.dataset.dashboardView === viewName);
  });
}

async function loadPrivateDashboard() {
  if (!state.currentUser) {
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
    const firstName = (user.name || 'there').trim().split(/\s+/)[0];
    const hasAssessment = assessments.length > 0;

    document.getElementById('privateDashboardFirstName').textContent = firstName;
    document.getElementById('dashboardUserName').textContent = user.name || 'Student';
    document.getElementById('dashboardUserEmail').textContent = user.email || 'Account';
    document.getElementById('dashboardAvatar').textContent = firstName.charAt(0).toUpperCase() || 'S';
    document.getElementById('dashboardDate').textContent = new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
    document.getElementById('privateAssessmentStatus').textContent = hasAssessment ? 'Completed' : 'Not completed';
    document.getElementById('privateAssessmentHint').textContent = hasAssessment ? 'Your latest assessment is ready.' : 'Begin with your first assessment.';
    document.getElementById('privatePlanStatus').textContent = hasAssessment ? 'Created' : 'Not created';
    document.getElementById('privatePlanHint').textContent = hasAssessment ? 'A plan is saved from your latest result.' : 'Complete an assessment first.';
    document.getElementById('privateGoalStatus').textContent = hasAssessment ? formatMoney(summary.savings_goal) : 'Not set';
    document.getElementById('privateGoalHint').textContent = hasAssessment ? (summary.goal_purpose || 'Savings goal') : 'Your goal will appear here.';
    document.getElementById('privateProgressStatus').textContent = hasAssessment ? 'In progress' : 'Not started';
    document.getElementById('privateProgressHint').textContent = hasAssessment ? 'Your plan is ready to track.' : 'Progress begins after your plan.';

    const activityEmpty = document.getElementById('privateActivityEmpty');
    const activityList = document.getElementById('privateActivityList');
    activityEmpty.classList.toggle('hidden', hasAssessment);
    activityList.classList.toggle('hidden', !hasAssessment);
    activityList.innerHTML = assessments.slice(0, 3).map((item) => `<div class="private-activity-item"><strong>${item.date}</strong><span>${item.assessment_status || 'Assessment completed'} · Goal ${formatMoney(item.savings_goal)}</span></div>`).join('');

    document.getElementById('privatePlanEmpty').classList.toggle('hidden', hasAssessment);
    document.getElementById('privatePlanContent').classList.toggle('hidden', !hasAssessment);
    document.getElementById('privatePlanPurpose').textContent = summary.goal_purpose || '-';
    document.getElementById('privatePlanAmount').textContent = formatMoney(summary.planned_monthly_savings);
    document.getElementById('privatePlanPeriod').textContent = summary.saving_period ? `${summary.saving_period} months` : '-';
    document.getElementById('privatePlanRequired').textContent = formatMoney(summary.required_monthly_savings);

    document.getElementById('privateGoalEmpty').classList.toggle('hidden', hasAssessment);
    document.getElementById('privateGoalContent').classList.toggle('hidden', !hasAssessment);
    document.getElementById('privateGoalPurpose').textContent = summary.goal_purpose || 'Personal goal';
    document.getElementById('privateGoalAmount').textContent = formatMoney(summary.savings_goal);
    document.getElementById('privateGoalPeriod').textContent = summary.saving_period ? `${summary.saving_period} month target` : '-';

    document.getElementById('privateProgressEmpty').classList.toggle('hidden', hasAssessment);
    document.getElementById('privateProgressContent').classList.toggle('hidden', !hasAssessment);
    const progress = summary.savings_goal ? Math.min(100, Math.round((Number(summary.current_savings || 0) / Number(summary.savings_goal)) * 100)) : 0;
    document.getElementById('privateProgressBar').style.width = `${progress}%`;
    document.getElementById('privateProgressLabel').textContent = `${progress}% of your current goal`;

    document.getElementById('privateProfileName').textContent = user.name || '-';
    document.getElementById('privateProfileEmail').textContent = user.email || '-';
    document.getElementById('privateProfileDate').textContent = user.registration_date || 'N/A';
    document.getElementById('privateEditName').value = user.name || '';
    document.getElementById('privateEditEmail').value = user.email || '';
    document.getElementById('privateHistoryList').innerHTML = hasAssessment
      ? assessments.map((item) => `<div class="private-history-item"><strong>${item.date}</strong><span>${item.assessment_status || 'Assessment completed'} · Goal ${formatMoney(item.savings_goal)} · ${formatMoney(item.planned_monthly_savings)}/month</span></div>`).join('')
      : '<div class="dashboard-empty">No previous activity yet.</div>';
  } catch (error) {
    document.getElementById('privateHistoryList').innerHTML = '<div class="dashboard-empty">Unable to load your history right now.</div>';
  }
}

async function savePrivateProfile() {
  const name = document.getElementById('privateEditName').value.trim();
  const email = document.getElementById('privateEditEmail').value.trim();
  const message = document.getElementById('privateProfileMessage');
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    setMessage(message, 'Enter a valid name and email.', 'error');
    return;
  }
  try {
    const response = await fetch('/api/account', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email }) });
    const data = await response.json();
    if (!response.ok || !data.success) {
      setMessage(message, data.message || 'Unable to update profile.', 'error');
      return;
    }
    state.currentUser = { ...state.currentUser, name, email };
    setUserState(state.currentUser);
    await loadPrivateDashboard();
    setMessage(message, 'Profile updated successfully.', 'success');
  } catch (error) {
    setMessage(message, 'Unable to update profile.', 'error');
  }
}

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
  accountActionsPanel.classList.add('hidden');
  accountActionsMenuBtn.classList.remove('active');
}

function showAssessmentStep(stepNumber) {
  state.currentStep = stepNumber;
  assessmentSteps.forEach((step) => {
    step.classList.toggle('active', Number(step.dataset.step) === Number(stepNumber));
  });

  const totalSteps = 4;
  stepIndicator.textContent = `Step ${stepNumber} of ${totalSteps}`;
  assessmentBackBtn.classList.toggle('hidden', stepNumber === 1);

  assessmentNextBtn.classList.remove('hidden');
  assessmentNextBtn.textContent = stepNumber === totalSteps ? 'Assess My Plan' : 'Continue';
}

function formatMoney(value) {
  const num = Number(value || 0);
  return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function setUserState(user) {
  state.currentUser = user;
  const isRegistered = Boolean(user && user.name);

  if (isRegistered) {
    registerNavButton.classList.add('hidden');
    loginNavButton.classList.add('hidden');
    logoutNavButton.classList.remove('hidden');
    accountPanel.classList.remove('hidden');
    accountName.textContent = user.name;
    document.getElementById('assessmentDashboardEmail').textContent = user.email || 'Profile ready';
  } else {
    registerNavButton.classList.remove('hidden');
    registerNavButton.textContent = 'Register';
    registerNavButton.dataset.target = 'register';
    loginNavButton.classList.remove('hidden');
    logoutNavButton.classList.add('hidden');
    accountPanel.classList.add('hidden');
    historyPanel.classList.add('hidden');
  }
}

function updateAssessmentAccess() {
  const registered = Boolean(state.currentUser && state.currentUser.name);
  const notice = document.getElementById('assessmentNotice');

  if (registered) {
    assessmentWizard.classList.remove('hidden');
    notice.classList.add('hidden');
    showAssessmentStep(1);
  } else {
    assessmentWizard.classList.add('hidden');
    notice.classList.remove('hidden');
  }
}

async function fetchCurrentUser() {
  try {
    const response = await fetch('/api/current-user');
    const data = await response.json();

    if (data.logged_in) {
      setUserState(data);
      await loadHistory();
    } else if (!state.currentUser) {
      setUserState(null);
    }
    updateAssessmentAccess();
  } catch (error) {
    if (!state.currentUser) {
      setUserState(null);
    }
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
      historyPanel.classList.add('hidden');
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
  const valueOrZero = (id) => {
    const value = document.getElementById(id).value.trim();
    return value === '' ? '0' : value;
  };

  return {
    studentName: state.currentUser ? state.currentUser.name : '',
    monthlyAllowance: document.getElementById('monthlyAllowance').value,
    allowanceFrequency: document.getElementById('allowanceFrequency').value,
    food: valueOrZero('food'),
    transportation: valueOrZero('transportation'),
    school: valueOrZero('school'),
    internet: valueOrZero('internet'),
    personal: valueOrZero('personal'),
    other: valueOrZero('other'),
    currentSavings: document.getElementById('currentSavings').value,
    goalPurpose: document.getElementById('goalPurpose').value,
    savingsGoal: document.getElementById('savingsGoal').value,
    savingPeriod: document.getElementById('savingPeriod').value,
    plannedMonthlySavings: document.getElementById('plannedMonthlySavings').value,
  };
}

function resetAssessmentForm() {
  document.querySelectorAll('#assessmentWizard input, #assessmentWizard select').forEach((field) => {
    field.value = '';
  });
  document.getElementById('allowanceFrequency').value = 'weekly';
  document.getElementById('goalPurpose').value = 'School Expenses';
  setMessage(assessmentMessage, 'Assessment form cleared.');
  showAssessmentStep(1);
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
    if (!values.savingsGoal && values.savingsGoal !== '0') {
      return 'Please enter your savings goal.';
    }
    if (!values.savingPeriod || Number(values.savingPeriod) <= 0) {
      return 'Please enter a target timeframe greater than 0 months.';
    }
    if (!values.currentSavings && values.currentSavings !== '0') {
      return 'Please enter your current savings, or 0 if you have none.';
    }
    if (Number(values.currentSavings) < 0 || Number(values.savingsGoal) < 0) {
      return 'Please enter valid non-negative amounts.';
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

  const summaryTarget = resultSummary;
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

  const badgeTarget = statusBadge;
  const recommendationTarget = recommendationBox;
  badgeTarget.className = `status-badge ${statusClass}`;
  badgeTarget.textContent = result.statusLabel;
  recommendationTarget.textContent = result.recommendation;

  document.getElementById('recalcPlan').value = result.plannedMonthlySavings;
  document.getElementById('recalcPeriod').value = result.savingPeriod;
}

function displayResult(result) {
  renderResultView(result);
  showDashboardView('result');
  setMessage(assessmentMessage, 'Assessment saved successfully.', 'success');
}

async function submitAssessment() {
  const errorMessage = validateAssessmentStep(state.currentStep);
  if (errorMessage) {
    setMessage(assessmentMessage, errorMessage, 'error');
    return;
  }

  if (state.currentStep < 4) {
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
    await loadAccountData();
    await loadPrivateDashboard();
    showDashboardView('overview');
  } catch (error) {
    setMessage(registerMessage, error instanceof Error ? error.message : 'Unable to create account. Please try again.', 'error');
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
    await loadPrivateDashboard();
    showDashboardView('overview');
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
    await loadPrivateDashboard();
    showDashboardView('assessment');
    showAssessmentStep(1);
    return;
  }

  if (target === 'account') {
    if (!state.currentUser || !state.currentUser.name) {
      showSection('login');
      setMessage(loginMessage, 'Please log in first to continue.', 'error');
      return;
    }
    await loadPrivateDashboard();
    showDashboardView('overview');
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

    const firstName = (user.name || 'there').trim().split(/\s+/)[0];
    document.getElementById('dashboardFirstName').textContent = firstName;
    document.getElementById('journeyAssessmentStatus').textContent = assessments.length ? 'Complete' : 'Not started';
    document.getElementById('journeyAssessmentHint').textContent = assessments.length ? 'Your latest assessment is ready.' : 'Begin with your first assessment.';
    document.getElementById('journeyGoalStatus').textContent = assessments.length ? formatMoney(summary.savings_goal) : 'Not set';
    document.getElementById('journeyGoalHint').textContent = assessments.length ? (summary.goal_purpose || 'Savings goal') : 'Your goal will appear here.';
    document.getElementById('journeyPlanStatus').textContent = assessments.length ? 'Created' : 'Not created';
    document.getElementById('journeyPlanHint').textContent = assessments.length ? 'Your current savings plan is saved.' : 'Complete an assessment to create one.';
    const activityEmpty = document.getElementById('dashboardActivityEmpty');
    const activityList = document.getElementById('dashboardActivityList');
    activityEmpty.classList.toggle('hidden', assessments.length > 0);
    activityList.classList.toggle('hidden', assessments.length === 0);
    activityList.innerHTML = assessments.slice(0, 3).map((item) => `
      <div class="dashboard-activity-item"><strong>${item.date}</strong><span>${item.assessment_status || 'Assessment completed'} · Goal ${formatMoney(item.savings_goal)}</span></div>
    `).join('');

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
    document.getElementById('assessmentDashboardEmail').textContent = user.email || 'Profile ready';
    document.getElementById('assessmentDashboardHistory').textContent = `${assessments.length} saved`;
    document.getElementById('profileEditForm').classList.add('hidden');

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
    document.getElementById('profileEditForm').classList.add('hidden');
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
  assessmentNextBtn.addEventListener('click', submitAssessment);
  assessmentResetBtn.addEventListener('click', resetAssessmentForm);
  assessmentBackBtn.addEventListener('click', () => {
    if (state.currentStep > 1) {
      showAssessmentStep(state.currentStep - 1);
    }
  });

  accountTabButtons.forEach((button) => {
    button.addEventListener('click', () => switchAccountTab(button.dataset.accountTab));
  });

  document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);
  document.getElementById('editProfileBtn').addEventListener('click', () => {
    document.getElementById('profileEditForm').classList.remove('hidden');
    editAccountName.focus();
  });
  document.getElementById('cancelProfileBtn').addEventListener('click', () => {
    document.getElementById('profileEditForm').classList.add('hidden');
    setMessage(accountProfileMessage, '');
  });
  document.getElementById('accountLogoutBtn').addEventListener('click', logoutUser);
  document.getElementById('clearAssessmentDataBtn').addEventListener('click', clearAssessmentData);
  document.getElementById('clearAccountBtn').addEventListener('click', clearAccount);
  accountActionsMenuBtn.addEventListener('click', () => {
    accountTabButtons.forEach((button) => button.classList.remove('active'));
    accountTabPanels.forEach((panel) => panel.classList.remove('active'));
    accountActionsPanel.classList.toggle('hidden');
    accountActionsMenuBtn.classList.toggle('active');
  });
  document.getElementById('openAccountDashboardBtn').addEventListener('click', async () => {
    showSection('account');
    switchAccountTab('profile');
    await loadAccountData();
  });
  document.getElementById('dashboardStartAssessmentBtn').addEventListener('click', () => {
    showDashboardView('assessment');
    showAssessmentStep(1);
  });
  document.getElementById('manageAccountBtn').addEventListener('click', () => {
    const management = document.getElementById('accountManagement');
    management.classList.toggle('hidden');
    document.getElementById('manageAccountBtn').textContent = management.classList.contains('hidden') ? 'Manage account details' : 'Hide account details';
  });
  navButtons.forEach((button) => {
    button.addEventListener('click', handleNavClick);
  });

  registerNavButton.addEventListener('click', () => {
    if (state.currentUser && state.currentUser.name) {
      loadPrivateDashboard();
      showDashboardView('overview');
    } else {
      showSection('register');
    }
  });
  loginNavButton.addEventListener('click', () => showSection('login'));
  logoutNavButton.addEventListener('click', logoutUser);

  dashboardNavItems.forEach((button) => {
    button.addEventListener('click', async () => {
      await loadPrivateDashboard();
      showDashboardView(button.dataset.dashboardView);
    });
  });
  document.querySelectorAll('.dashboard-text-btn').forEach((button) => {
    button.addEventListener('click', () => showDashboardView(button.dataset.dashboardView));
  });
  document.getElementById('privateDashboardStartBtn').addEventListener('click', () => {
    showDashboardView('assessment');
    showAssessmentStep(1);
  });
  document.getElementById('dashboardLogoutBtn').addEventListener('click', logoutUser);
  document.getElementById('privateSaveProfileBtn').addEventListener('click', savePrivateProfile);

  moveExistingAssessmentIntoDashboard();
  await fetchCurrentUser();
  if (state.currentUser) {
    await loadPrivateDashboard();
    showDashboardView('overview');
  } else {
    showSection('home');
  }
});
