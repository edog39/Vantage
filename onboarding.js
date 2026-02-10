/**
 * onboarding.js
 *
 * Multi-step onboarding wizard controller for Vantage.
 * Manages the role-selection flow that appears when the extension
 * is opened for the first time (or after a profile reset).
 *
 * Steps:
 *   1. Role Selection — "I'm a Student" or "I'm a Business Owner"
 *   2. Name Entry — User enters their display name
 *   3. Canvas Setup (students only) — Canvas URL + API token with validation
 *
 * Saves the resulting profile to chrome.storage.local via StorageManager.
 * Uses CanvasAPI.testConnection() to validate Canvas credentials.
 *
 * Exports: OnboardingController object with init/show/hide methods.
 */

const OnboardingController = (() => {

  /* ══════════════════════════════════════
     State
     ══════════════════════════════════════ */
  let currentStep = 1;   // Tracks which wizard step is active (1, 2, or 3)
  let selectedRole = null; // "student" or "business"
  let onCompleteCallback = null; // Called after onboarding finishes
  let saveTimer = null;  // Debounce timer for persisting state

  /* ══════════════════════════════════════
     DOM References (resolved lazily)
     ══════════════════════════════════════ */

  /**
   * Returns a cached or freshly-queried DOM element.
   * @param {string} id - The element's id attribute
   * @returns {HTMLElement|null}
   */
  function $(id) {
    return document.getElementById(id);
  }

  /* ══════════════════════════════════════
     Public Methods
     ══════════════════════════════════════ */

  /**
   * Initializes the onboarding controller by binding event listeners
   * and restoring any saved in-progress state from a previous popup session.
   * Should be called once after the DOM is ready.
   * @param {Function} onComplete - Callback invoked when onboarding finishes
   *   with signature (profile: Object) => void
   */
  function init(onComplete) {
    onCompleteCallback = onComplete;
    bindEvents();
    bindAutoSaveListeners();
  }

  /**
   * Shows the onboarding overlay. Restores saved in-progress state
   * if available (so the user picks up where they left off), otherwise
   * resets to step 1.
   */
  async function show() {
    const savedUi = await StorageManager.loadUiState();
    const saved = savedUi ? savedUi.onboarding : null;

    if (saved && saved.step) {
      // Restore previously saved onboarding progress
      selectedRole = saved.role || null;
      currentStep = saved.step;

      // Restore form field values before showing the step
      if (saved.name) {
        const nameInput = $("onboarding-name");
        if (nameInput) nameInput.value = saved.name;
      }
      if (saved.canvasUrl) {
        const urlInput = $("canvas-url");
        if (urlInput) urlInput.value = saved.canvasUrl;
      }
      if (saved.canvasToken) {
        const tokenInput = $("canvas-token");
        if (tokenInput) tokenInput.value = saved.canvasToken;
      }

      // Highlight the previously selected role card
      if (selectedRole) {
        highlightRoleCard(selectedRole === "student" ? "role-student" : "role-business");
      }

      showStep(currentStep);
    } else {
      // Fresh start
      currentStep = 1;
      selectedRole = null;
      showStep(1);
    }

    $("onboarding-overlay").classList.remove("hidden");
  }

  /**
   * Hides the onboarding overlay.
   */
  function hide() {
    $("onboarding-overlay").classList.add("hidden");
  }

  /* ══════════════════════════════════════
     Step Navigation
     ══════════════════════════════════════ */

  /**
   * Displays the specified onboarding step and hides all others.
   * Also updates the step indicator dots.
   * @param {number} step - Step number (1, 2, or 3)
   */
  function showStep(step) {
    currentStep = step;

    // Hide all step panels
    const steps = document.querySelectorAll(".onboarding-step");
    steps.forEach(s => s.classList.add("hidden"));

    // Show the target step
    const target = $(`onboarding-step-${step}`);
    if (target) target.classList.remove("hidden");

    // Update step indicator dots
    updateStepIndicator(step);

    // Update back button visibility
    const backBtn = $("onboarding-back");
    if (backBtn) {
      backBtn.classList.toggle("hidden", step === 1);
    }

    // Persist current position so clicking off doesn't lose progress
    persistState();
  }

  /**
   * Updates the visual step indicator dots to reflect the current step.
   * @param {number} activeStep - The currently active step number
   */
  function updateStepIndicator(activeStep) {
    const dots = document.querySelectorAll(".step-dot");
    const totalSteps = selectedRole === "student" ? 3 : 2;

    dots.forEach((dot, idx) => {
      const stepNum = idx + 1;
      dot.classList.toggle("active", stepNum === activeStep);
      dot.classList.toggle("completed", stepNum < activeStep);
      // Hide step 3 dot for business owners
      if (stepNum === 3) {
        dot.classList.toggle("hidden", totalSteps < 3);
      }
    });
  }

  /* ══════════════════════════════════════
     Event Binding
     ══════════════════════════════════════ */

  /**
   * Binds click and form event listeners for all onboarding UI elements.
   * Delegates to step-specific handlers.
   */
  function bindEvents() {
    // Step 1: Role selection cards
    const studentCard = $("role-student");
    const businessCard = $("role-business");

    if (studentCard) {
      studentCard.addEventListener("click", () => {
        selectedRole = "student";
        highlightRoleCard("role-student");
        persistState(); // Save role choice immediately
        // Auto-advance after a brief delay for visual feedback
        setTimeout(() => showStep(2), 250);
      });
    }

    if (businessCard) {
      businessCard.addEventListener("click", () => {
        selectedRole = "business";
        highlightRoleCard("role-business");
        persistState(); // Save role choice immediately
        setTimeout(() => showStep(2), 250);
      });
    }

    // Step 2: Name entry — continue button
    const nameForm = $("onboarding-name-form");
    if (nameForm) {
      nameForm.addEventListener("submit", (e) => {
        e.preventDefault();
        handleNameSubmit();
      });
    }

    // Step 3: Canvas setup — test connection button
    const testBtn = $("canvas-test-btn");
    if (testBtn) {
      testBtn.addEventListener("click", handleCanvasTest);
    }

    // Step 3: Canvas setup — save and finish
    const canvasForm = $("onboarding-canvas-form");
    if (canvasForm) {
      canvasForm.addEventListener("submit", (e) => {
        e.preventDefault();
        handleCanvasSave();
      });
    }

    // Back button (all steps)
    const backBtn = $("onboarding-back");
    if (backBtn) {
      backBtn.addEventListener("click", handleBack);
    }

    // Skip Canvas setup link
    const skipLink = $("canvas-skip");
    if (skipLink) {
      skipLink.addEventListener("click", (e) => {
        e.preventDefault();
        finishOnboarding(null, null);
      });
    }

    // Token help guide — open/close
    const helpLink = $("canvas-token-help");
    const guideEl = $("canvas-token-tooltip");
    const guideCloseBtn = $("token-guide-close");

    if (helpLink && guideEl) {
      helpLink.addEventListener("click", (e) => {
        e.preventDefault();
        guideEl.classList.toggle("hidden");
      });
    }
    if (guideCloseBtn && guideEl) {
      guideCloseBtn.addEventListener("click", () => {
        guideEl.classList.add("hidden");
      });
    }
  }

  /* ══════════════════════════════════════
     Step Handlers
     ══════════════════════════════════════ */

  /**
   * Visually highlights the selected role card and dims the other.
   * @param {string} selectedId - DOM id of the selected card
   */
  function highlightRoleCard(selectedId) {
    const cards = document.querySelectorAll(".role-card");
    cards.forEach(card => {
      card.classList.toggle("selected", card.id === selectedId);
    });
  }

  /**
   * Handles the name form submission in step 2.
   * Validates the name and either advances to step 3 (student)
   * or finishes onboarding (business).
   */
  function handleNameSubmit() {
    const nameInput = $("onboarding-name");
    const name = nameInput ? nameInput.value.trim() : "";

    if (!name) {
      showFieldError("onboarding-name", "Please enter your name");
      return;
    }

    clearFieldError("onboarding-name");

    if (selectedRole === "student") {
      showStep(3);
    } else {
      // Business owner — skip Canvas step, finish immediately
      finishOnboarding(null, null);
    }
  }

  /**
   * Handles the "Test Connection" button click in step 3.
   * Validates Canvas URL and token by calling CanvasAPI.testConnection().
   * Shows success or error feedback inline.
   */
  async function handleCanvasTest() {
    const urlInput = $("canvas-url");
    const tokenInput = $("canvas-token");
    const statusEl = $("canvas-test-status");
    const testBtn = $("canvas-test-btn");

    const canvasUrl = urlInput ? urlInput.value.trim() : "";
    const token = tokenInput ? tokenInput.value.trim() : "";

    // Validate inputs
    if (!canvasUrl) {
      showFieldError("canvas-url", "Please enter your Canvas URL");
      return;
    }
    if (!token) {
      showFieldError("canvas-token", "Please enter your API token");
      return;
    }

    clearFieldError("canvas-url");
    clearFieldError("canvas-token");

    // Show loading state
    testBtn.disabled = true;
    testBtn.textContent = "Testing...";
    statusEl.textContent = "";
    statusEl.className = "canvas-test-status";

    // Call CanvasAPI.testConnection() to validate credentials
    const result = await CanvasAPI.testConnection(canvasUrl, token);

    testBtn.disabled = false;
    testBtn.textContent = "Test Connection";

    if (result.success) {
      statusEl.textContent = `Connected as ${result.user.name}`;
      statusEl.className = "canvas-test-status success";

      // Enable the finish button
      const finishBtn = $("canvas-finish-btn");
      if (finishBtn) finishBtn.disabled = false;
    } else {
      statusEl.textContent = result.error || "Connection failed. Check your URL and token.";
      statusEl.className = "canvas-test-status error";
    }
  }

  /**
   * Handles the final save in step 3 (Canvas form submission).
   * Saves Canvas credentials and finishes onboarding.
   */
  function handleCanvasSave() {
    const urlInput = $("canvas-url");
    const tokenInput = $("canvas-token");

    const canvasUrl = urlInput ? urlInput.value.trim() : "";
    const token = tokenInput ? tokenInput.value.trim() : "";

    // Only the API token is required to continue from this step.
    // The Canvas URL is optional and may be left blank.
    if (!token) {
      showFieldError("canvas-token", "Please enter your API token");
      return;
    }

    clearFieldError("canvas-token");

    finishOnboarding(canvasUrl || null, token);
  }

  /**
   * Handles the back button. Navigates to the previous step.
   */
  function handleBack() {
    if (currentStep > 1) {
      showStep(currentStep - 1);
    }
  }

  /* ══════════════════════════════════════
     Finish & Save
     ══════════════════════════════════════ */

  /**
   * Completes the onboarding flow by saving the profile to storage
   * and invoking the completion callback so popup.js can route
   * to the appropriate dashboard.
   * @param {string|null} canvasUrl  - Canvas base URL (null for business owners)
   * @param {string|null} canvasToken - Canvas API token (null for business owners)
   */
  async function finishOnboarding(canvasUrl, canvasToken) {
    const nameInput = $("onboarding-name");
    const name = nameInput ? nameInput.value.trim() : "User";

    const profile = {
      name: name || "User",
      role: selectedRole,
      canvasUrl: canvasUrl || null,
      canvasToken: canvasToken || null,
      onboardingComplete: true,
      createdAt: new Date().toISOString()
    };

    // Persist profile via StorageManager.saveProfile()
    await StorageManager.saveProfile(profile);

    // Clear saved onboarding progress — wizard is done
    await clearPersistedState();

    // Hide the overlay
    hide();

    // Notify popup.js that onboarding is complete
    if (typeof onCompleteCallback === "function") {
      onCompleteCallback(profile);
    }
  }

  /* ══════════════════════════════════════
     Profile Reset (for role switching)
     ══════════════════════════════════════ */

  /**
   * Resets the user profile and clears all role-specific data.
   * Re-shows the onboarding flow so the user can pick a new role.
   * Uses StorageManager.clearProfile() and StorageManager.clearAll()
   * to wipe stored data before re-triggering onboarding.
   */
  async function resetProfile() {
    await StorageManager.clearProfile();
    // Also reset initialization flag so the business engine
    // regenerates tasks if the user switches to business mode
    await StorageManager.clearAll();
    // Clear any stale UI state so the wizard starts fresh
    await StorageManager.clearUiState();
    show();
  }

  /* ══════════════════════════════════════
     State Persistence — Save on Every Change
     Ensures clicking off the extension doesn't lose progress.
     ══════════════════════════════════════ */

  /**
   * Binds input listeners on all onboarding form fields so that
   * every keystroke triggers a debounced state save to storage.
   * This way the popup can close at any time without data loss.
   */
  function bindAutoSaveListeners() {
    const fields = ["onboarding-name", "canvas-url", "canvas-token"];
    fields.forEach(id => {
      const el = $(id);
      if (el) {
        el.addEventListener("input", () => persistState());
      }
    });
  }

  /**
   * Captures the current onboarding wizard state and saves it
   * to chrome.storage.local via StorageManager. Uses a debounce
   * so rapid typing doesn't flood storage writes.
   * Called on every step change, role selection, and form input.
   */
  function persistState() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      const nameInput = $("onboarding-name");
      const urlInput = $("canvas-url");
      const tokenInput = $("canvas-token");

      const snapshot = {
        step: currentStep,
        role: selectedRole,
        name: nameInput ? nameInput.value : "",
        canvasUrl: urlInput ? urlInput.value : "",
        canvasToken: tokenInput ? tokenInput.value : ""
      };

      // Load existing UI state so we don't overwrite popup.js state
      const existing = (await StorageManager.loadUiState()) || {};
      existing.onboarding = snapshot;
      await StorageManager.saveUiState(existing);
    }, 300); // 300ms debounce
  }

  /**
   * Clears saved onboarding state from storage.
   * Called when onboarding finishes or a profile is reset.
   */
  async function clearPersistedState() {
    const existing = (await StorageManager.loadUiState()) || {};
    delete existing.onboarding;
    await StorageManager.saveUiState(existing);
  }

  /* ══════════════════════════════════════
     Inline Validation Helpers
     ══════════════════════════════════════ */

  /**
   * Shows an inline error message beneath a form field.
   * @param {string} fieldId - The input element's id
   * @param {string} message - Error message to display
   */
  function showFieldError(fieldId, message) {
    const field = $(fieldId);
    if (!field) return;

    // Add error class to input
    field.classList.add("input-error");

    // Create or update error message element
    let errEl = field.parentNode.querySelector(".field-error-msg");
    if (!errEl) {
      errEl = document.createElement("span");
      errEl.className = "field-error-msg";
      field.parentNode.appendChild(errEl);
    }
    errEl.textContent = message;
  }

  /**
   * Clears the inline error for a form field.
   * @param {string} fieldId - The input element's id
   */
  function clearFieldError(fieldId) {
    const field = $(fieldId);
    if (!field) return;

    field.classList.remove("input-error");
    const errEl = field.parentNode.querySelector(".field-error-msg");
    if (errEl) errEl.remove();
  }

  /* ══════════════════════════════════════
     Public API
     ══════════════════════════════════════ */

  return {
    init,
    show,
    hide,
    resetProfile
  };

})();
