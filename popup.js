/**
 * popup.js
 *
 * Main controller for the Vantage popup UI.
 * Orchestrates the onboarding flow, role-based routing (student vs business),
 * data loading/saving via StorageManager (storage.js), task generation via
 * TaskEngine (taskEngine.js), Canvas sync via CanvasAPI (canvasApi.js),
 * and rendering of task lists, stats, filters, and modals.
 *
 * This file runs when popup.html is opened from the Chrome toolbar.
 */

(async function () {
  "use strict";

  /* ══════════════════════════════════════
     DOM References
     ══════════════════════════════════════ */
  const $appContent       = document.getElementById("app-content");
  const $taskList         = document.getElementById("task-list");
  const $emptyState       = document.getElementById("empty-state");
  const $loadingState     = document.getElementById("loading-state");
  const $canvasErrorState = document.getElementById("canvas-error-state");
  const $canvasErrorMsg   = document.getElementById("canvas-error-msg");
  const $statCompleted    = document.getElementById("stat-completed");
  const $statPending      = document.getElementById("stat-pending");
  const $statSpawned      = document.getElementById("stat-spawned");
  const $statSpawnedCard  = document.getElementById("stat-spawned-card");
  const $statStreak       = document.getElementById("stat-streak");
  const $progressSection  = document.getElementById("progress-section");
  const $progressLabel    = document.getElementById("progress-label");
  const $progressFill     = document.getElementById("progress-fill");
  const $categoryFilters  = document.getElementById("category-filters");
  const $sortSelect       = document.getElementById("sort-select");
  const $btnSettings      = document.getElementById("btn-settings");
  const $btnStats         = document.getElementById("btn-stats");
  const $btnAdd           = document.getElementById("btn-add");
  const $modalOverlay     = document.getElementById("modal-overlay");
  const $addTaskForm      = document.getElementById("add-task-form");
  const $inputTitle       = document.getElementById("input-title");
  const $inputCategory    = document.getElementById("input-category");
  const $inputPriority    = document.getElementById("input-priority");
  const $btnCancelModal   = document.getElementById("btn-cancel-modal");
  const $statsOverlay     = document.getElementById("stats-overlay");
  const $statsDetailGrid  = document.getElementById("stats-detail-grid");
  const $statsCatBreakdown = document.getElementById("stats-category-breakdown");
  const $btnCloseStats    = document.getElementById("btn-close-stats");
  const $settingsOverlay  = document.getElementById("settings-overlay");
  const $btnCloseSettings = document.getElementById("btn-close-settings");
  const $btnSwitchRole    = document.getElementById("btn-switch-role");
  const $spawnToast       = document.getElementById("spawn-toast");
  const $spawnToastText   = document.getElementById("spawn-toast-text");
  // Student-specific
  const $studentSyncBar   = document.getElementById("student-sync-bar");
  const $syncUserName     = document.getElementById("sync-user-name");
  const $syncTime         = document.getElementById("sync-time");
  const $btnSync          = document.getElementById("btn-sync");
  const $btnRetrySync     = document.getElementById("btn-retry-sync");
  const $headerTagline    = document.getElementById("header-tagline");

  /* ══════════════════════════════════════
     State
     ══════════════════════════════════════ */
  let profile = null;   // User profile (role, name, Canvas creds)
  let tasks = [];       // Active task list (business or Canvas tasks)
  let stats = {};       // Lifetime stats
  let prefs = {};       // User preferences (sort, filter)
  let courses = [];     // Canvas courses (student mode only)
  let userRole = null;  // "student" or "business" (shorthand)
  let uiSaveTimer = null; // Debounce timer for UI state persistence

  /* ══════════════════════════════════════
     Initialization
     ══════════════════════════════════════ */

  /**
   * Bootstraps the extension. Checks for an existing profile:
   * - If none exists, shows the onboarding wizard.
   * - If profile exists, routes to the correct dashboard (student or business).
   */
  async function init() {
    // Load profile from storage
    profile = await StorageManager.getProfile();

    if (!profile || !profile.onboardingComplete) {
      // No profile yet — show onboarding wizard
      // Initialize the OnboardingController with a callback for when it finishes
      OnboardingController.init(handleOnboardingComplete);
      OnboardingController.show();
      $appContent.classList.add("hidden");
      return;
    }

    // Profile exists — proceed to the right dashboard
    userRole = profile.role;
    $appContent.classList.remove("hidden");

    // Bind token help toggle for students (in case they open settings later)
    bindTokenHelpToggle();

    if (userRole === "student") {
      await initStudentMode();
    } else {
      await initBusinessMode();
    }

    // Bind shared event listeners (settings, modals, etc.)
    bindSharedEvents();
  }

  /**
   * Called by OnboardingController when the user finishes the wizard.
   * Receives the saved profile and routes to the appropriate dashboard.
   * @param {Object} savedProfile - Profile object from onboarding
   */
  async function handleOnboardingComplete(savedProfile) {
    profile = savedProfile;
    userRole = profile.role;
    $appContent.classList.remove("hidden");

    bindTokenHelpToggle();

    if (userRole === "student") {
      await initStudentMode();
    } else {
      await initBusinessMode();
    }

    bindSharedEvents();
  }

  /* ══════════════════════════════════════
     Student Mode Initialization
     ══════════════════════════════════════ */

  /**
   * Sets up the student dashboard:
   * - Customizes the header tagline
   * - Shows the sync bar, hides business-only UI
   * - Loads cached Canvas tasks (if any) and renders them
   * - Triggers a fresh Canvas sync if credentials are present
   */
  async function initStudentMode() {
    // Customize UI for student mode
    $headerTagline.textContent = "Your assignments, one place.";
    $studentSyncBar.classList.remove("hidden");
    $progressSection.classList.add("hidden");   // Hide business progress bar
    $statSpawnedCard.classList.add("hidden");    // Hide "spawned" stat (not relevant)

    // Set user name in sync bar
    $syncUserName.textContent = profile.name || "Student";

    // Load preferences
    prefs = await StorageManager.loadPreferences();
    $sortSelect.value = prefs.sortBy || "dueDate"; // Default sort by due date for students

    // Load cached Canvas tasks first for instant display
    tasks = await StorageManager.getCanvasTasks();
    courses = await StorageManager.getCourses();
    stats = await StorageManager.loadStats();

    // Show cached sync time
    const lastSync = await StorageManager.getSyncTime();
    if (lastSync) {
      $syncTime.textContent = `Last synced: ${formatSyncTime(lastSync)}`;
    }

    // Populate course-based filter pills
    populateStudentFilters();
    if (prefs.filterCategory) {
      setActiveFilter(prefs.filterCategory);
    }

    // Render cached tasks immediately
    if (tasks.length > 0) {
      renderTasks();
      renderStats();
    }

    // If Canvas credentials exist, sync fresh data
    if (profile.canvasUrl && profile.canvasToken) {
      await syncCanvas();
    } else if (tasks.length === 0) {
      // No credentials and no cached tasks — show empty state with message
      $emptyState.querySelector("p:first-child").textContent = "No Canvas connection set up.";
      $emptyState.querySelector(".emphasis").textContent = "Go to Settings to connect Canvas.";
      $emptyState.classList.remove("hidden");
      $taskList.classList.add("hidden");
    }

    // Bind student-specific events
    $btnSync.addEventListener("click", handleSyncClick);
    if ($btnRetrySync) {
      $btnRetrySync.addEventListener("click", handleSyncClick);
    }

    // Restore saved scroll position and open modal from previous session
    bindScrollPersistence();
    await restoreUiState();
  }

  /**
   * Syncs with Canvas LMS: fetches all courses and assignments,
   * converts them to tasks, caches the results, and re-renders.
   * Shows a loading spinner during the sync and handles errors gracefully.
   */
  async function syncCanvas() {
    // Show loading state
    $loadingState.classList.remove("hidden");
    $canvasErrorState.classList.add("hidden");
    $emptyState.classList.add("hidden");
    $btnSync.classList.add("syncing");

    try {
      // Call CanvasAPI.syncAllTasks() to fetch everything from Canvas
      const result = await CanvasAPI.syncAllTasks(profile.canvasUrl, profile.canvasToken);

      // Merge with locally-completed status:
      // If a task was marked done locally, keep it done even after re-sync
      const localDone = new Set(
        tasks.filter(t => t.completed).map(t => t.id)
      );
      result.tasks.forEach(t => {
        if (localDone.has(t.id)) {
          t.completed = true;
        }
      });

      // Update state
      tasks = result.tasks;
      courses = result.courses;

      // Cache everything via StorageManager
      await StorageManager.saveCanvasTasks(tasks);
      await StorageManager.saveCourses(courses);
      await StorageManager.saveSyncTime(result.syncedAt);

      // Update sync bar
      $syncTime.textContent = `Last synced: ${formatSyncTime(result.syncedAt)}`;

      // Refresh filter pills with new courses
      populateStudentFilters();

      // Render
      renderTasks();
      renderStats();

    } catch (err) {
      // Show error state with the error message
      $canvasErrorState.classList.remove("hidden");
      $canvasErrorMsg.textContent = err.message || "Unknown error occurred";

      // If we have cached tasks, still show them
      if (tasks.length > 0) {
        renderTasks();
        renderStats();
      }
    } finally {
      $loadingState.classList.add("hidden");
      $btnSync.classList.remove("syncing");
    }
  }

  /**
   * Handles the sync button click. Triggers a fresh Canvas sync.
   */
  async function handleSyncClick() {
    if (profile.canvasUrl && profile.canvasToken) {
      await syncCanvas();
    }
  }

  /**
   * Creates course-based filter pills for the student dashboard.
   * Each course becomes a filter pill, similar to business categories.
   */
  function populateStudentFilters() {
    // Clear existing pills except "All"
    const allPill = $categoryFilters.querySelector('[data-category="all"]');
    $categoryFilters.innerHTML = "";
    $categoryFilters.appendChild(allPill);

    // Re-bind "All" pill click
    allPill.addEventListener("click", () => {
      prefs.filterCategory = "all";
      setActiveFilter("all");
      StorageManager.savePreferences(prefs);
      renderTasks();
    });

    // Add a pill per course
    courses.forEach(course => {
      const pill = document.createElement("button");
      pill.className = "pill";
      pill.dataset.category = course.name;
      pill.textContent = course.code || course.name;
      pill.style.maxWidth = "120px";
      pill.style.overflow = "hidden";
      pill.style.textOverflow = "ellipsis";
      pill.addEventListener("click", () => {
        prefs.filterCategory = course.name;
        setActiveFilter(course.name);
        StorageManager.savePreferences(prefs);
        renderTasks();
      });
      $categoryFilters.appendChild(pill);
    });
  }

  /* ══════════════════════════════════════
     Business Mode Initialization
     ══════════════════════════════════════ */

  /**
   * Sets up the business dashboard (existing behavior):
   * - Customizes UI for business mode
   * - Generates initial tasks on first run or loads existing ones
   * - Renders tasks, stats, and category filters
   */
  async function initBusinessMode() {
    // Customize UI for business mode
    $headerTagline.textContent = "The work never ends.";
    $studentSyncBar.classList.add("hidden");   // Hide student sync bar
    $progressSection.classList.remove("hidden"); // Show business progress bar
    $statSpawnedCard.classList.remove("hidden"); // Show "spawned" stat

    const initialized = await StorageManager.isInitialized();

    if (!initialized) {
      // First-run: generate starter tasks via TaskEngine
      tasks = TaskEngine.generateInitialTasks();
      stats = {
        totalCompleted: 0,
        totalSpawned: 0,
        completedByCategory: {},
        completedToday: 0,
        lastActiveDate: new Date().toISOString().slice(0, 10),
        streak: 0,
        longestStreak: 0
      };
      prefs = { sortBy: "priority", filterCategory: "all" };

      await StorageManager.saveTasks(tasks);
      await StorageManager.saveStats(stats);
      await StorageManager.savePreferences(prefs);
      await StorageManager.markInitialized();
    } else {
      tasks = await StorageManager.loadTasks();
      stats = await StorageManager.loadStats();
      prefs = await StorageManager.loadPreferences();
    }

    // Populate business category UI
    populateBusinessCategoryFilters();
    populateCategorySelect();

    // Restore user preferences
    $sortSelect.value = prefs.sortBy || "priority";
    setActiveFilter(prefs.filterCategory || "all");

    // Render
    renderTasks();
    renderStats();

    // Restore saved scroll position and open modal from previous session
    bindScrollPersistence();
    await restoreUiState();
  }

  /* ══════════════════════════════════════
     Rendering — Task List (unified for both modes)
     ══════════════════════════════════════ */

  /**
   * Renders the visible task list based on current filter and sort.
   * Works for both Canvas (student) and business tasks.
   * Shows/hides empty state accordingly.
   */
  function renderTasks() {
    const filtered = getFilteredTasks();
    const sorted = getSortedTasks(filtered);

    $taskList.innerHTML = "";
    $canvasErrorState.classList.add("hidden");

    if (sorted.length === 0) {
      if (userRole === "student") {
        $emptyState.querySelector("p:first-child").textContent = "No assignments in this view.";
        $emptyState.querySelector(".emphasis").textContent = "You're all caught up!";
      } else {
        $emptyState.querySelector("p:first-child").textContent = "No tasks in this view. But don't worry...";
        $emptyState.querySelector(".emphasis").textContent = "More are coming.";
      }
      $emptyState.classList.remove("hidden");
      $taskList.classList.add("hidden");
    } else {
      $emptyState.classList.add("hidden");
      $taskList.classList.remove("hidden");

      sorted.forEach(task => {
        $taskList.appendChild(createTaskCard(task));
      });
    }
  }

  /**
   * Creates a DOM element for a single task card.
   * Handles both Canvas-sourced tasks and business engine tasks.
   * @param {Object} task - The task object
   * @returns {HTMLElement} The task card element
   */
  function createTaskCard(task) {
    const card = document.createElement("div");
    card.className = "task-card";
    card.dataset.taskId = task.id;

    // Determine category metadata based on task source
    let catColor, catIcon, catLabel;

    if (task.source === "canvas") {
      // Canvas task: use course color
      catColor = task.categoryColor || "#6366f1";
      catIcon = "";
      catLabel = task.category;
    } else {
      // Business task: use TaskEngine category metadata
      const catMeta = TaskEngine.CATEGORIES.find(c => c.id === task.category) || {};
      catColor = catMeta.color || "#6366f1";
      catIcon = catMeta.icon || "";
      catLabel = catMeta.label || task.category;
    }

    // Determine due date status
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const now = new Date();
    const isOverdue = dueDate && dueDate < now;
    const dueDateStr = dueDate ? formatDueDate(dueDate) : "No due date";

    // Due date CSS class for student color coding
    let dueDateClass = "";
    if (dueDate) {
      const diffDays = (dueDate - now) / 86400000;
      if (diffDays < 0) dueDateClass = "overdue";
      else if (diffDays <= 2) dueDateClass = "due-soon";
      else if (diffDays <= 7) dueDateClass = "due-week";
      else dueDateClass = "due-later";
    }

    // Build card inner HTML
    let metaHtml = `
      <span class="task-category" style="background: ${catColor}22; color: ${catColor};">
        ${catIcon} ${escapeHtml(catLabel)}
      </span>
      <span class="task-priority" data-priority="${task.priority}">${task.priority}</span>
      <span class="task-due ${dueDateClass}">${isOverdue ? '⚠ ' : ''}${dueDateStr}</span>
    `;

    // Add points for Canvas tasks
    if (task.source === "canvas" && task.points) {
      metaHtml += `<span class="task-points">${task.points} pts</span>`;
    }

    // Add link to Canvas for Canvas tasks
    if (task.source === "canvas" && task.htmlUrl) {
      metaHtml += `<a class="task-link" href="${escapeHtml(task.htmlUrl)}" target="_blank" title="Open in Canvas">Open ↗</a>`;
    }

    card.innerHTML = `
      <div class="task-checkbox" data-task-id="${task.id}" title="Complete task"></div>
      <div class="task-body">
        <div class="task-title">${escapeHtml(task.title)}</div>
        <div class="task-meta">
          ${metaHtml}
        </div>
      </div>
    `;

    // Attach completion handler to the checkbox
    const checkbox = card.querySelector(".task-checkbox");
    checkbox.addEventListener("click", () => handleCompleteTask(task.id, card, checkbox));

    // Prevent link clicks from triggering card events
    const link = card.querySelector(".task-link");
    if (link) {
      link.addEventListener("click", (e) => e.stopPropagation());
    }

    return card;
  }

  /* ══════════════════════════════════════
     Rendering — Stats
     ══════════════════════════════════════ */

  /**
   * Updates the top stats banner with current numbers.
   * Adapts display based on current role.
   */
  function renderStats() {
    const pendingCount = tasks.filter(t => !t.completed).length;

    $statCompleted.textContent = stats.totalCompleted || 0;
    $statPending.textContent = pendingCount;
    $statStreak.textContent = stats.streak || 0;

    if (userRole === "business") {
      $statSpawned.textContent = stats.totalSpawned || 0;

      // Progress bar: visually fills but never reaches 100%
      const todayPct = stats.completedToday > 0
        ? Math.min(90, Math.log2(stats.completedToday + 1) * 20)
        : 0;
      $progressFill.style.width = todayPct + "%";
      $progressLabel.textContent = `Completed today: ${stats.completedToday || 0}`;
    }
  }

  /* ══════════════════════════════════════
     Task Completion — The Core Loop
     ══════════════════════════════════════ */

  /**
   * Handles completing a task: plays animation, spawns new tasks (business mode),
   * marks done locally (student mode), and updates storage.
   * @param {string} taskId    - The ID of the completed task
   * @param {HTMLElement} card  - The task card DOM element
   * @param {HTMLElement} checkbox - The checkbox element
   */
  async function handleCompleteTask(taskId, card, checkbox) {
    // Prevent double-clicks
    if (checkbox.classList.contains("completing")) return;

    // Find the task
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const completedTask = tasks[taskIndex];

    // Visual feedback: check animation
    checkbox.classList.add("completing");

    // Wait a beat, then animate card out
    await delay(400);
    card.classList.add("completed-anim");

    if (userRole === "student") {
      // Student mode: mark as completed locally
      await delay(500);

      completedTask.completed = true;
      completedTask.completedAt = new Date().toISOString();

      // Update stats
      stats.totalCompleted = (stats.totalCompleted || 0) + 1;

      // Daily tracking
      const today = new Date().toISOString().slice(0, 10);
      if (stats.lastActiveDate === today) {
        stats.completedToday = (stats.completedToday || 0) + 1;
      } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (stats.lastActiveDate === yesterday.toISOString().slice(0, 10)) {
          stats.streak = (stats.streak || 0) + 1;
        } else {
          stats.streak = 1;
        }
        stats.completedToday = 1;
        stats.lastActiveDate = today;
      }
      if ((stats.streak || 0) > (stats.longestStreak || 0)) {
        stats.longestStreak = stats.streak;
      }

      await StorageManager.saveCanvasTasks(tasks);
      await StorageManager.saveStats(stats);

      // Re-render
      renderTasks();
      renderStats();

    } else {
      // Business mode: spawn follow-up tasks via TaskEngine
      const newTasks = TaskEngine.spawnFollowUps(completedTask);

      await delay(500);

      // Remove completed task from array
      completedTask.completed = true;
      completedTask.completedAt = new Date().toISOString();
      tasks.splice(taskIndex, 1);

      // Add new tasks to the beginning
      tasks.unshift(...newTasks);

      // Update stats via StorageManager.recordCompletion()
      stats = await StorageManager.recordCompletion(completedTask, newTasks.length);

      // Persist tasks
      await StorageManager.saveTasks(tasks);

      // Re-render
      renderTasks();
      renderStats();

      // Mark new tasks with spawn animation
      newTasks.forEach(nt => {
        const el = $taskList.querySelector(`[data-task-id="${nt.id}"]`);
        if (el) {
          el.classList.add("spawned");
          setTimeout(() => el.classList.remove("spawned"), 1500);
        }
      });

      // Show toast
      showSpawnToast(newTasks.length);
    }
  }

  /* ══════════════════════════════════════
     Filtering & Sorting
     ══════════════════════════════════════ */

  /**
   * Returns tasks filtered by the current category/course preference.
   * @returns {Array<Object>} Filtered task array
   */
  function getFilteredTasks() {
    const incomplete = tasks.filter(t => !t.completed);
    if (!prefs.filterCategory || prefs.filterCategory === "all") return incomplete;
    return incomplete.filter(t => t.category === prefs.filterCategory);
  }

  /**
   * Sorts tasks based on the current sort preference.
   * @param {Array<Object>} taskArr - Array of tasks to sort
   * @returns {Array<Object>} Sorted task array (new array)
   */
  function getSortedTasks(taskArr) {
    const sorted = [...taskArr];
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

    switch (prefs.sortBy) {
      case "priority":
        sorted.sort((a, b) => (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99));
        break;
      case "dueDate":
        sorted.sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));
        break;
      case "category":
        sorted.sort((a, b) => (a.category || "").localeCompare(b.category || ""));
        break;
    }
    return sorted;
  }

  /* ══════════════════════════════════════
     Filter Bar — Category Pills (Business)
     ══════════════════════════════════════ */

  /**
   * Creates category filter pill buttons from TaskEngine.CATEGORIES.
   * Used only in business mode.
   */
  function populateBusinessCategoryFilters() {
    // Clear existing pills except "All"
    const allPill = $categoryFilters.querySelector('[data-category="all"]');
    $categoryFilters.innerHTML = "";
    $categoryFilters.appendChild(allPill);

    // Bind "All" click
    allPill.addEventListener("click", () => {
      prefs.filterCategory = "all";
      setActiveFilter("all");
      StorageManager.savePreferences(prefs);
      renderTasks();
    });

    TaskEngine.CATEGORIES.forEach(cat => {
      const pill = document.createElement("button");
      pill.className = "pill";
      pill.dataset.category = cat.id;
      pill.textContent = `${cat.icon} ${cat.label}`;
      pill.addEventListener("click", () => {
        prefs.filterCategory = cat.id;
        setActiveFilter(cat.id);
        StorageManager.savePreferences(prefs);
        renderTasks();
      });
      $categoryFilters.appendChild(pill);
    });
  }

  /**
   * Highlights the active category filter pill.
   * @param {string} catId - Category id/name or "all"
   */
  function setActiveFilter(catId) {
    $categoryFilters.querySelectorAll(".pill").forEach(p => {
      p.classList.toggle("active", p.dataset.category === catId);
    });
  }

  /* ══════════════════════════════════════
     Shared Event Binding
     ══════════════════════════════════════ */

  /**
   * Binds event listeners shared between student and business modes:
   * sort select, settings modal, stats modal, add task modal.
   */
  function bindSharedEvents() {
    // Sort select
    $sortSelect.addEventListener("change", () => {
      prefs.sortBy = $sortSelect.value;
      StorageManager.savePreferences(prefs);
      renderTasks();
    });

    // Settings modal
    $btnSettings.addEventListener("click", () => { openSettings(); saveUiState(); });
    $btnCloseSettings.addEventListener("click", () => { $settingsOverlay.classList.add("hidden"); saveUiState(); });
    $settingsOverlay.addEventListener("click", (e) => {
      if (e.target === $settingsOverlay) { $settingsOverlay.classList.add("hidden"); saveUiState(); }
    });
    $btnSwitchRole.addEventListener("click", handleSwitchRole);

    // Stats modal
    $btnStats.addEventListener("click", () => {
      renderStatsModal();
      $statsOverlay.classList.remove("hidden");
      saveUiState();
    });
    $btnCloseStats.addEventListener("click", () => { $statsOverlay.classList.add("hidden"); saveUiState(); });
    $statsOverlay.addEventListener("click", (e) => {
      if (e.target === $statsOverlay) { $statsOverlay.classList.add("hidden"); saveUiState(); }
    });

    // Add task modal
    $btnAdd.addEventListener("click", () => {
      $modalOverlay.classList.remove("hidden");
      $inputTitle.focus();
      saveUiState();
    });
    $btnCancelModal.addEventListener("click", () => {
      $modalOverlay.classList.add("hidden");
      $addTaskForm.reset();
      saveUiState();
    });
    $modalOverlay.addEventListener("click", (e) => {
      if (e.target === $modalOverlay) {
        $modalOverlay.classList.add("hidden");
        $addTaskForm.reset();
        saveUiState();
      }
    });
    $addTaskForm.addEventListener("submit", handleAddTask);
  }

  /* ══════════════════════════════════════
     Add Task Modal Handler
     ══════════════════════════════════════ */

  /**
   * Populates the category <select> in the Add Task modal.
   * Only used in business mode (students add tasks manually too).
   */
  function populateCategorySelect() {
    $inputCategory.innerHTML = "";

    if (userRole === "student") {
      // For students, use courses as categories
      courses.forEach(course => {
        const opt = document.createElement("option");
        opt.value = course.name;
        opt.textContent = course.name;
        $inputCategory.appendChild(opt);
      });
      // Also add a "Personal" option
      const personal = document.createElement("option");
      personal.value = "Personal";
      personal.textContent = "Personal";
      $inputCategory.appendChild(personal);
    } else {
      // For business, use TaskEngine categories
      TaskEngine.CATEGORIES.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat.id;
        opt.textContent = `${cat.icon} ${cat.label}`;
        $inputCategory.appendChild(opt);
      });
    }
  }

  /**
   * Handles submitting a custom task via the Add Task form.
   * Works for both student and business modes.
   * @param {Event} e - The form submit event
   */
  async function handleAddTask(e) {
    e.preventDefault();

    const title = $inputTitle.value.trim();
    if (!title) return;

    const newTask = {
      id: TaskEngine.generateId(),
      title,
      category: $inputCategory.value,
      priority: $inputPriority.value,
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      completed: false,
      completedAt: null,
      parentId: null,
      templateKey: null,
      context: {},
      source: userRole === "student" ? "manual" : undefined
    };

    tasks.unshift(newTask);

    // Save to appropriate storage
    if (userRole === "student") {
      await StorageManager.saveCanvasTasks(tasks);
    } else {
      await StorageManager.saveTasks(tasks);
    }

    // Close modal and reset form
    $modalOverlay.classList.add("hidden");
    $addTaskForm.reset();
    saveUiState(); // Persist that modal is now closed

    // Re-render
    renderTasks();
    renderStats();

    // Highlight the new task
    const el = $taskList.querySelector(`[data-task-id="${newTask.id}"]`);
    if (el) {
      el.classList.add("spawned");
      setTimeout(() => el.classList.remove("spawned"), 1500);
    }
  }

  /* ══════════════════════════════════════
     Settings Modal
     ══════════════════════════════════════ */

  /**
   * Opens the settings modal and populates it with current profile data.
   */
  function openSettings() {
    const $settingsName = document.getElementById("settings-name");
    const $settingsRole = document.getElementById("settings-role");
    const $settingsCanvasUrl = document.getElementById("settings-canvas-url");
    const $settingsCanvasStatus = document.getElementById("settings-canvas-status");
    const $canvasSection = document.getElementById("settings-canvas-section");

    $settingsName.textContent = profile.name || "—";
    $settingsRole.textContent = userRole === "student" ? "Student" : "Business Owner";

    if (userRole === "student") {
      $canvasSection.classList.remove("hidden");
      $settingsCanvasUrl.textContent = profile.canvasUrl || "Not set";
      $settingsCanvasStatus.textContent = profile.canvasToken ? "Connected" : "Not connected";
      $settingsCanvasStatus.style.color = profile.canvasToken ? "var(--success)" : "var(--priority-critical)";
    } else {
      $canvasSection.classList.add("hidden");
    }

    $settingsOverlay.classList.remove("hidden");
  }

  /**
   * Handles the "Switch Role / Reset" button in settings.
   * Clears all data and re-triggers onboarding.
   */
  async function handleSwitchRole() {
    // Close settings modal
    $settingsOverlay.classList.add("hidden");

    // Reset everything and show onboarding
    await OnboardingController.resetProfile();
    $appContent.classList.add("hidden");
  }

  /* ══════════════════════════════════════
     Stats Detail Modal
     ══════════════════════════════════════ */

  /**
   * Renders the detailed stats modal content.
   * Adapts to show different stats for students vs business users.
   */
  function renderStatsModal() {
    const pendingCount = tasks.filter(t => !t.completed).length;

    let gridHtml = `
      <div class="stats-detail-item">
        <span class="stats-detail-value">${stats.totalCompleted || 0}</span>
        <span class="stats-detail-label">Total Completed</span>
      </div>
      <div class="stats-detail-item">
        <span class="stats-detail-value">${pendingCount}</span>
        <span class="stats-detail-label">Pending Now</span>
      </div>
      <div class="stats-detail-item">
        <span class="stats-detail-value">${stats.completedToday || 0}</span>
        <span class="stats-detail-label">Done Today</span>
      </div>
      <div class="stats-detail-item">
        <span class="stats-detail-value">${stats.streak || 0}</span>
        <span class="stats-detail-label">Current Streak</span>
      </div>
    `;

    if (userRole === "business") {
      gridHtml += `
        <div class="stats-detail-item">
          <span class="stats-detail-value">${stats.totalSpawned || 0}</span>
          <span class="stats-detail-label">Total Spawned</span>
        </div>
        <div class="stats-detail-item">
          <span class="stats-detail-value">${stats.longestStreak || 0}</span>
          <span class="stats-detail-label">Longest Streak</span>
        </div>
      `;
    }

    $statsDetailGrid.innerHTML = gridHtml;

    // Category / Course breakdown
    if (userRole === "student") {
      // Show breakdown by course
      const courseBreakdown = {};
      tasks.forEach(t => {
        if (t.completed) {
          courseBreakdown[t.category] = (courseBreakdown[t.category] || 0) + 1;
        }
      });

      const sortedCourses = Object.entries(courseBreakdown)
        .sort(([, a], [, b]) => b - a);

      $statsCatBreakdown.innerHTML = `
        <h3>By Course</h3>
        ${sortedCourses.length > 0 ? sortedCourses.map(([name, count]) => `
          <div class="category-stat-row">
            <span class="category-stat-name">${escapeHtml(name)}</span>
            <span class="category-stat-count">${count}</span>
          </div>
        `).join("") : '<p style="font-size:11px;color:var(--text-muted);">No completions yet</p>'}
      `;
    } else {
      // Business: show breakdown by category
      const catBreakdown = TaskEngine.CATEGORIES.map(cat => {
        const count = (stats.completedByCategory && stats.completedByCategory[cat.id]) || 0;
        return { ...cat, count };
      }).sort((a, b) => b.count - a.count);

      $statsCatBreakdown.innerHTML = `
        <h3>By Category</h3>
        ${catBreakdown.map(cat => `
          <div class="category-stat-row">
            <span class="category-stat-name">
              <span>${cat.icon}</span>
              <span>${cat.label}</span>
            </span>
            <span class="category-stat-count">${cat.count}</span>
          </div>
        `).join("")}
      `;
    }
  }

  /* ══════════════════════════════════════
     Spawn Toast (Business mode)
     ══════════════════════════════════════ */

  /**
   * Shows a brief toast notification when new tasks spawn.
   * @param {number} count - Number of tasks spawned
   */
  function showSpawnToast(count) {
    $spawnToastText.textContent = `+${count} new task${count > 1 ? "s" : ""} spawned!`;
    $spawnToast.classList.remove("hidden");

    setTimeout(() => {
      $spawnToast.classList.add("hidden");
    }, 2500);
  }

  /* ══════════════════════════════════════
     Token Help Toggle
     ══════════════════════════════════════ */

  /**
   * Binds the click handler for the "How do I get a token?" link
   * in the Canvas setup step of onboarding.
   */
  function bindTokenHelpToggle() {
    const helpLink = document.getElementById("canvas-token-help");
    const tooltip = document.getElementById("canvas-token-tooltip");
    const closeBtn = document.getElementById("token-guide-close");

    // Open guide when "How do I get a token?" link is clicked
    if (helpLink && tooltip) {
      helpLink.addEventListener("click", (e) => {
        e.preventDefault();
        tooltip.classList.toggle("hidden");
      });
    }

    // Close guide via the X button inside the guide
    if (closeBtn && tooltip) {
      closeBtn.addEventListener("click", () => {
        tooltip.classList.add("hidden");
      });
    }
  }

  /* ══════════════════════════════════════
     Utility Helpers
     ══════════════════════════════════════ */

  /**
   * Returns a promise that resolves after the specified milliseconds.
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise<void>}
   */
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Formats a Date object into a human-readable relative due date string.
   * @param {Date} date - The due date
   * @returns {string} Formatted string like "Today", "Tomorrow", "In 3 days", etc.
   */
  function formatDueDate(date) {
    const now = new Date();
    const diffMs = date - now;
    const diffDays = Math.ceil(diffMs / 86400000);

    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays <= 7) return `In ${diffDays} days`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  /**
   * Formats an ISO timestamp into a human-readable "last synced" string.
   * Shows "Just now", "X min ago", or a time string.
   * @param {string} isoStr - ISO date string
   * @returns {string} Formatted sync time
   */
  function formatSyncTime(isoStr) {
    const then = new Date(isoStr);
    const now = new Date();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    return then.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  /**
   * Escapes HTML special characters to prevent XSS in task titles.
   * @param {string} str - Raw string
   * @returns {string} Escaped string safe for innerHTML
   */
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /* ══════════════════════════════════════
     UI State Persistence
     Saves scroll position and open modal so the user
     resumes exactly where they were after clicking off.
     ══════════════════════════════════════ */

  /**
   * Captures the current popup UI state (scroll position, open modal)
   * and persists it to storage via a debounced write.
   * Called on scroll events, modal open/close, and other state changes.
   */
  function saveUiState() {
    clearTimeout(uiSaveTimer);
    uiSaveTimer = setTimeout(async () => {
      // Determine which modal (if any) is currently open
      let openModal = null;
      if (!$settingsOverlay.classList.contains("hidden")) openModal = "settings";
      else if (!$statsOverlay.classList.contains("hidden")) openModal = "stats";
      else if (!$modalOverlay.classList.contains("hidden")) openModal = "addTask";

      const existing = (await StorageManager.loadUiState()) || {};
      existing.scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
      existing.openModal = openModal;
      await StorageManager.saveUiState(existing);
    }, 200); // 200ms debounce — fast enough to catch pre-close state
  }

  /**
   * Restores the saved UI state (scroll position and open modal)
   * from the previous popup session. Called after task rendering
   * is complete so the DOM has content to scroll to.
   */
  async function restoreUiState() {
    const saved = await StorageManager.loadUiState();
    if (!saved) return;

    // Restore scroll position after a small delay so DOM is painted
    if (typeof saved.scrollTop === "number" && saved.scrollTop > 0) {
      requestAnimationFrame(() => {
        document.body.scrollTop = saved.scrollTop;
        document.documentElement.scrollTop = saved.scrollTop;
      });
    }

    // Restore open modal
    if (saved.openModal === "settings") {
      openSettings();
    } else if (saved.openModal === "stats") {
      renderStatsModal();
      $statsOverlay.classList.remove("hidden");
    } else if (saved.openModal === "addTask") {
      $modalOverlay.classList.remove("hidden");
      $inputTitle.focus();
    }
  }

  /**
   * Binds the scroll listener on the body so scroll position
   * is continuously saved as the user scrolls.
   */
  function bindScrollPersistence() {
    document.body.addEventListener("scroll", saveUiState, { passive: true });
    document.addEventListener("scroll", saveUiState, { passive: true });
  }

  /* ══════════════════════════════════════
     Boot
     ══════════════════════════════════════ */
  init();

})();
