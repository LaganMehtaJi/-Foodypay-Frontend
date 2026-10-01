document.addEventListener('DOMContentLoaded', () => {
  const apiUrlInput = document.getElementById('apiUrl');
  const foodypayIdInput = document.getElementById('foodypayId');
  const dashboardUrlInput = document.getElementById('dashboardUrl');
  const settingsForm = document.getElementById('settingsForm');
  const statusDiv = document.getElementById('status');

  chrome.storage.sync.get(['apiUrl', 'foodypayId', 'dashboardUrl'], (items) => {
    apiUrlInput.value = items.apiUrl || 'http://localhost:5001/api';
    foodypayIdInput.value = items.foodypayId || 'FP-985569';
    dashboardUrlInput.value = items.dashboardUrl || 'http://localhost:3000/admin';
  });

  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    chrome.storage.sync.set({
      apiUrl: apiUrlInput.value.trim(),
      foodypayId: foodypayIdInput.value.trim(),
      dashboardUrl: dashboardUrlInput.value.trim(),
    }, () => {
      statusDiv.textContent = 'Settings saved successfully! Persistent alerts linked.';
      setTimeout(() => { statusDiv.textContent = ''; }, 3000);
    });
  });
});
