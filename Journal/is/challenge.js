let currentChallenge = null;


// =========================================
// PAGE START
// =========================================

document.addEventListener("DOMContentLoaded", async () => {

  const user = await requireAuth();

  if (!user) return;

  setupNavigation();
  setupChallengeForm();
  setupDeleteButton();

  await loadChallenge(user.id);

});


// =========================================
// NAVIGATION
// =========================================

function setupNavigation() {

  const menuBtn =
    document.getElementById("menuBtn");

  const sidebar =
    document.getElementById("sidebar");

  if (!menuBtn || !sidebar) return;

  menuBtn.addEventListener("click", () => {

    sidebar.classList.toggle("open");

  });

}


// =========================================
// CHALLENGE FORM
// =========================================

function setupChallengeForm() {

  const form =
    document.getElementById("challengeForm");

  if (!form) return;

  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      await startChallenge();

    }
  );

}


// =========================================
// START CHALLENGE
// =========================================

async function startChallenge() {

  const user = await getCurrentUser();

  if (!user) return;


  const name =
    document
      .getElementById("challengeName")
      .value
      .trim();


  const startingBalance =
    Number(
      document
        .getElementById("startingBalance")
        .value
    );


  const targetBalance =
    Number(
      document
        .getElementById("targetBalance")
        .value
    );


  const maxDrawdown =
    Number(
      document
        .getElementById("maxDrawdown")
        .value
    );


  if (!name) {

    showChallengeMessage(
      "Enter challenge name.",
      "error"
    );

    return;
  }


  if (
    !Number.isFinite(startingBalance) ||
    startingBalance <= 0
  ) {

    showChallengeMessage(
      "Starting balance must be greater than 0.",
      "error"
    );

    return;
  }


  if (
    !Number.isFinite(targetBalance) ||
    targetBalance <= startingBalance
  ) {

    showChallengeMessage(
      "Target balance must be greater than starting balance.",
      "error"
    );

    return;
  }


  if (
    !Number.isFinite(maxDrawdown) ||
    maxDrawdown <= 0
  ) {

    showChallengeMessage(
      "Max drawdown must be greater than 0.",
      "error"
    );

    return;
  }


  const button =
    document.getElementById(
      "startChallengeBtn"
    );


  button.disabled = true;
  button.textContent = "STARTING...";


  try {

    // =====================================
    // CHECK ACTIVE CHALLENGE
    // =====================================

    const {
      data: activeChallenge,
      error: activeError
    } =
      await supabaseClient
        .from("challenges")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "ACTIVE")
        .limit(1);


    if (activeError) {
      throw activeError;
    }


    if (
      activeChallenge &&
      activeChallenge.length > 0
    ) {

      showChallengeMessage(
        "You already have an active challenge.",
        "error"
      );

      return;
    }


    // =====================================
    // CREATE CHALLENGE
    // =====================================

    const {
      error
    } =
      await supabaseClient
        .from("challenges")
        .insert({

          user_id:
            user.id,

          name:
            name,

          starting_balance:
            startingBalance,

          target_balance:
            targetBalance,

          current_balance:
            startingBalance,

          max_drawdown:
            maxDrawdown,

          status:
            "ACTIVE",

          started_at:
            new Date().toISOString()

        });


    if (error) {
      throw error;
    }


    showChallengeMessage(
      "Challenge started successfully.",
      "success"
    );


    document
      .getElementById("challengeForm")
      .reset();


    await loadChallenge(user.id);


  } catch (error) {

    console.error(error);

    showChallengeMessage(
      error.message ||
      "Unable to start challenge.",
      "error"
    );

  } finally {

    button.disabled = false;
    button.textContent = "START CHALLENGE";

  }

}


// =========================================
// LOAD CHALLENGE
// =========================================

async function loadChallenge(userId) {

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("challenges")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", {
          ascending: false
        })
        .limit(1);


    if (error) {
      throw error;
    }


    // =====================================
    // NO CHALLENGE
    // =====================================

    if (!data || data.length === 0) {

      currentChallenge = null;

      showStartCard();

      return;
    }


    currentChallenge =
      data[0];


    // =====================================
    // SYNC BALANCE WITH TRADES
    // =====================================

    await syncChallengeBalance(
      userId,
      currentChallenge
    );


    // =====================================
    // GET UPDATED CHALLENGE
    // =====================================

    const {
      data: updatedChallenge,
      error: updatedError
    } =
      await supabaseClient
        .from("challenges")
        .select("*")
        .eq("id", currentChallenge.id)
        .eq("user_id", userId)
        .single();


    if (updatedError) {
      throw updatedError;
    }


    currentChallenge =
      updatedChallenge;


    renderChallenge(
      currentChallenge
    );


  } catch (error) {

    console.error(error);

    showChallengeMessage(
      "Unable to load challenge.",
      "error"
    );

  }

}


// =========================================
// SYNC CHALLENGE BALANCE
// =========================================

async function syncChallengeBalance(
  userId,
  challenge
) {

  if (!challenge) return;


  try {

    // =====================================
    // GET ALL USER TRADES
    // =====================================

    const {
      data: trades,
      error: tradesError
    } =
      await supabaseClient
        .from("trades")
        .select("profit_loss")
        .eq("user_id", userId);


    if (tradesError) {
      throw tradesError;
    }


    // =====================================
    // CALCULATE TOTAL PROFIT / LOSS
    // =====================================

    let totalProfitLoss = 0;


    if (trades && trades.length > 0) {

      totalProfitLoss =
        trades.reduce(
          (total, trade) => {

            return (
              total +
              Number(
                trade.profit_loss || 0
              )
            );

          },
          0
        );

    }


    // =====================================
    // CALCULATE NEW BALANCE
    // =====================================

    const startingBalance =
      Number(
        challenge.starting_balance || 0
      );


    const targetBalance =
      Number(
        challenge.target_balance || 0
      );


    const maxDrawdown =
      Number(
        challenge.max_drawdown || 0
      );


    const newBalance =
      startingBalance +
      totalProfitLoss;


    // =====================================
    // CALCULATE STATUS
    // =====================================

    let newStatus = "ACTIVE";


    if (
      newBalance >= targetBalance
    ) {

      newStatus = "PASSED";

    } else if (
      newBalance <=
      startingBalance - maxDrawdown
    ) {

      newStatus = "FAILED";

    }


    // =====================================
    // COMPLETED DATE
    // =====================================

    let completedAt =
      challenge.completed_at || null;


    if (
      newStatus === "PASSED" ||
      newStatus === "FAILED"
    ) {

      if (!completedAt) {

        completedAt =
          new Date().toISOString();

      }

    } else {

      completedAt = null;

    }


    // =====================================
    // UPDATE CHALLENGE
    // =====================================

    const {
      error: updateError
    } =
      await supabaseClient
        .from("challenges")
        .update({

          current_balance:
            newBalance,

          status:
            newStatus,

          completed_at:
            completedAt

        })
        .eq(
          "id",
          challenge.id
        )
        .eq(
          "user_id",
          userId
        );


    if (updateError) {
      throw updateError;
    }


  } catch (error) {

    console.error(
      "Challenge sync error:",
      error
    );

  }

}


// =========================================
// RENDER CHALLENGE
// =========================================

function renderChallenge(challenge) {

  const startCard =
    document.getElementById(
      "challengeStartCard"
    );

  const dashboard =
    document.getElementById(
      "challengeDashboard"
    );


  if (startCard) {
    startCard.style.display = "none";
  }


  if (dashboard) {
    dashboard.style.display = "flex";
  }


  const starting =
    Number(
      challenge.starting_balance || 0
    );


  const current =
    Number(
      challenge.current_balance ||
      starting
    );


  const target =
    Number(
      challenge.target_balance || 0
    );


  const drawdown =
    Number(
      challenge.max_drawdown || 0
    );


  const profitTarget =
    target - starting;


  const currentProfit =
    current - starting;


  let progress = 0;


  if (profitTarget > 0) {

    progress =
      (
        currentProfit /
        profitTarget
      ) * 100;

  }


  progress =
    Math.max(
      0,
      Math.min(
        100,
        progress
      )
    );


  // =====================================
  // TEXT
  // =====================================

  setText(
    "challengeTitle",
    challenge.name || "Challenge"
  );


  setText(
    "challengeStarted",
    `Started ${formatDate(
      challenge.started_at ||
      challenge.created_at
    )}`
  );


  setText(
    "currentBalance",
    formatMoney(current)
  );


  setText(
    "targetBalanceDisplay",
    formatMoney(target)
  );


  setText(
    "progressPercent",
    `${progress.toFixed(1)}%`
  );


  setText(
    "progressStart",
    formatMoney(starting)
  );


  setText(
    "progressTarget",
    formatMoney(target)
  );


  setText(
    "startingBalanceDisplay",
    formatMoney(starting)
  );


  setText(
    "profitTargetDisplay",
    formatMoney(profitTarget)
  );


  setText(
    "maxDrawdownDisplay",
    formatMoney(drawdown)
  );


  setText(
    "currentProfitDisplay",
    formatMoney(currentProfit)
  );


  // =====================================
  // PROGRESS BAR
  // =====================================

  const progressBar =
    document.getElementById(
      "challengeProgressBar"
    );


  if (progressBar) {

    progressBar.style.width = "0%";


    setTimeout(() => {

      progressBar.style.width =
        `${progress}%`;

    }, 100);

  }


  // =====================================
  // STATUS
  // =====================================

  const status =
    document.getElementById(
      "challengeStatus"
    );


  if (status) {

    const challengeStatus =
      String(
        challenge.status ||
        "ACTIVE"
      ).toUpperCase();


    status.textContent =
      challengeStatus;


    status.className =
      "challenge-status";


    if (
      challengeStatus === "PASSED"
    ) {

      status.classList.add(
        "passed"
      );

    } else if (
      challengeStatus === "FAILED"
    ) {

      status.classList.add(
        "failed"
      );

    } else {

      status.classList.add(
        "active"
      );

    }

  }

}


// =========================================
// DELETE CHALLENGE
// =========================================

function setupDeleteButton() {

  const button =
    document.getElementById(
      "deleteChallengeBtn"
    );


  if (!button) return;


  button.addEventListener(
    "click",
    async () => {

      await deleteChallenge();

    }
  );

}


async function deleteChallenge() {

  const user =
    await getCurrentUser();

  if (!user) return;


  if (!currentChallenge) return;


  const confirmed =
    confirm(
      "Delete this challenge?"
    );


  if (!confirmed) return;


  try {

    const {
      error
    } =
      await supabaseClient
        .from("challenges")
        .delete()
        .eq(
          "id",
          currentChallenge.id
        )
        .eq(
          "user_id",
          user.id
        );


    if (error) {
      throw error;
    }


    currentChallenge = null;


    showStartCard();


    showChallengeMessage(
      "Challenge deleted successfully.",
      "success"
    );


  } catch (error) {

    console.error(error);

    showChallengeMessage(
      "Unable to delete challenge.",
      "error"
    );

  }

}


// =========================================
// SHOW START CARD
// =========================================

function showStartCard() {

  const startCard =
    document.getElementById(
      "challengeStartCard"
    );

  const dashboard =
    document.getElementById(
      "challengeDashboard"
    );


  if (startCard) {
    startCard.style.display = "block";
  }


  if (dashboard) {
    dashboard.style.display = "none";
  }

}


// =========================================
// MESSAGE
// =========================================

function showChallengeMessage(
  message,
  type
) {

  const box =
    document.getElementById(
      "challengeMessage"
    );


  if (!box) return;


  box.textContent =
    message;


  box.className =
    `challenge-message ${type}`;


  setTimeout(() => {

    box.className =
      "challenge-message";

  }, 4000);

}


// =========================================
// HELPERS
// =========================================

function setText(id, value) {

  const element =
    document.getElementById(id);

  if (!element) return;

  element.textContent =
    value;

}


function formatMoney(value) {

  return `$${Number(value || 0)
    .toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    )}`;

}


function formatDate(value) {

  if (!value) {
    return "—";
  }


  return new Date(value)
    .toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric"
      }
    );

}