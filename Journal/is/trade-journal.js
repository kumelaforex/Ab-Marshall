const PAIRS = [
  "XAUUSD",
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "AUDUSD"
];

let selectedDirection = "";
let selectedResult = "";
let selectedScreenshot = null;
let allTrades = [];


// =========================================
// PAGE START
// =========================================

document.addEventListener("DOMContentLoaded", async () => {

  const user = await requireAuth();

  if (!user) return;

  setupNavigation();
  setupDirectionButtons();
  setupResultButtons();
  setupScreenshotPreview();
  setupForm();
  setupFilter();

  await loadTrades();

});


// =========================================
// MOBILE NAVIGATION
// =========================================

function setupNavigation() {

  const menuBtn = document.getElementById("menuBtn");
  const sidebar = document.getElementById("sidebar");

  if (!menuBtn || !sidebar) return;

  menuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

}


// =========================================
// DIRECTION
// =========================================

function setupDirectionButtons() {

  const buttons =
    document.querySelectorAll(".direction-btn");

  buttons.forEach(button => {

    button.addEventListener("click", () => {

      buttons.forEach(btn => {
        btn.classList.remove("selected");
      });

      button.classList.add("selected");

      selectedDirection =
        button.dataset.direction;

      document.getElementById("direction").value =
        selectedDirection;

    });

  });

}


// =========================================
// RESULT
// =========================================

function setupResultButtons() {

  const buttons =
    document.querySelectorAll(".result-btn");

  buttons.forEach(button => {

    button.addEventListener("click", () => {

      buttons.forEach(btn => {
        btn.classList.remove("selected");
      });

      button.classList.add("selected");

      selectedResult =
        button.dataset.result;

      document.getElementById("result").value =
        selectedResult;

    });

  });

}


// =========================================
// SCREENSHOT PREVIEW
// =========================================

function setupScreenshotPreview() {

  const input =
    document.getElementById("screenshot");

  const preview =
    document.getElementById("imagePreview");

  if (!input || !preview) return;

  input.addEventListener("change", event => {

    const file = event.target.files[0];

    if (!file) {

      selectedScreenshot = null;

      preview.style.display = "none";
      preview.innerHTML = "";

      return;
    }

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {

      showMessage(
        "Only PNG, JPG or WEBP images are allowed.",
        "error"
      );

      input.value = "";
      selectedScreenshot = null;

      return;
    }

    if (file.size > 5 * 1024 * 1024) {

      showMessage(
        "Screenshot must be smaller than 5MB.",
        "error"
      );

      input.value = "";
      selectedScreenshot = null;

      return;
    }

    selectedScreenshot = file;

    const reader = new FileReader();

    reader.onload = e => {

      preview.innerHTML = `
        <img
          src="${e.target.result}"
          alt="Trade screenshot">
      `;

      preview.style.display = "block";

    };

    reader.readAsDataURL(file);

  });

}


// =========================================
// FORM
// =========================================

function setupForm() {

  const form =
    document.getElementById("tradeForm");

  if (!form) return;

  form.addEventListener("submit", async event => {

    event.preventDefault();

    await saveTrade();

  });

}


// =========================================
// SAVE TRADE
// =========================================

async function saveTrade() {

  const user = await getCurrentUser();

  if (!user) return;

  const pair =
    document.getElementById("pair").value;

  const sl =
    Number(document.getElementById("sl").value);

  const tp =
    Number(document.getElementById("tp").value);

  const lotSize =
    Number(document.getElementById("lotSize").value);

  const profitLoss =
    Number(document.getElementById("profitLoss").value);

  const strategy =
    document.getElementById("strategy").value.trim();

  const notes =
    document.getElementById("notes").value.trim();


  if (!PAIRS.includes(pair)) {

    showMessage(
      "Select a valid currency pair.",
      "error"
    );

    return;
  }


  if (!selectedDirection) {

    showMessage(
      "Select BUY or SELL.",
      "error"
    );

    return;
  }


  if (!selectedResult) {

    showMessage(
      "Select WIN, LOSS or BREAKEVEN.",
      "error"
    );

    return;
  }


  if (!strategy) {

    showMessage(
      "Enter your strategy.",
      "error"
    );

    return;
  }


  if (lotSize <= 0) {

    showMessage(
      "Lot size must be greater than 0.",
      "error"
    );

    return;
  }


  if (!Number.isFinite(profitLoss)) {

    showMessage(
      "Enter a valid Profit/Loss value.",
      "error"
    );

    return;
  }


  const saveButton =
    document.getElementById("saveTradeBtn");


  saveButton.disabled = true;
  saveButton.textContent = "SAVING...";


  try {

    let screenshotUrl = null;


    // =====================================
    // UPLOAD SCREENSHOT
    // =====================================

    if (selectedScreenshot) {

      const extension =
        selectedScreenshot.name
          .split(".")
          .pop()
          .toLowerCase();


      const fileName =
        `${crypto.randomUUID()}.${extension}`;


      const filePath =
        `${user.id}/${fileName}`;


      const {
        error: uploadError
      } =
        await supabaseClient
          .storage
          .from("trade-screenshots")
          .upload(
            filePath,
            selectedScreenshot,
            {
              cacheControl: "3600",
              upsert: false
            }
          );


      if (uploadError) {
        throw uploadError;
      }


      screenshotUrl = filePath;

    }


    // =====================================
    // SAVE DATABASE RECORD
    // =====================================

    const {
      error
    } =
      await supabaseClient
        .from("trades")
        .insert({

          user_id: user.id,

          pair: pair,

          direction:
            selectedDirection,

          sl: sl,

          tp: tp,

          lot_size: lotSize,

          strategy: strategy,

          notes: notes || null,

          screenshot_url:
            screenshotUrl,

          result:
            selectedResult,

          profit_loss:
            profitLoss

        });


    if (error) {
      throw error;
    }


    // =====================================
    // UPDATE CHALLENGE
    // =====================================

    await recalculateChallenge(user.id);


    showMessage(
      "Trade saved successfully.",
      "success"
    );


    resetForm();

    await loadTrades();


  } catch (error) {

    console.error(error);

    showMessage(
      error.message ||
      "Unable to save trade.",
      "error"
    );

  } finally {

    saveButton.disabled = false;
    saveButton.textContent = "SAVE TRADE";

  }

}


// =========================================
// LOAD TRADES
// =========================================

async function loadTrades() {

  const user = await getCurrentUser();

  if (!user) return;


  const {
    data,
    error
  } =
    await supabaseClient
      .from("trades")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false
      });


  if (error) {

    console.error(error);

    return;

  }


  allTrades = data || [];

  await renderTrades(allTrades);

  updateSummary(allTrades);

}


// =========================================
// RENDER HISTORY
// =========================================

async function renderTrades(trades) {

  const tbody =
    document.getElementById("tradeHistory");


  if (!tbody) return;


  if (!trades.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="empty-state">
          No trades recorded yet.
        </td>
      </tr>
    `;

    return;

  }


  const rows = await Promise.all(

    trades.map(async trade => {

      const date =
        new Date(
          trade.created_at
        ).toLocaleDateString();


      const resultClass =
        trade.result === "WIN"
          ? "result-win"
          : trade.result === "LOSS"
          ? "result-loss"
          : "result-breakeven";


      // =====================================
      // SIGNED SCREENSHOT URL
      // =====================================

      let screenshotHTML = "-";


      if (trade.screenshot_url) {

        const {
          data: signedData,
          error: signedError
        } =
          await supabaseClient
            .storage
            .from("trade-screenshots")
            .createSignedUrl(
              trade.screenshot_url,
              300
            );


        if (
          !signedError &&
          signedData &&
          signedData.signedUrl
        ) {

          screenshotHTML = `
            <a
              href="${escapeHTML(
                signedData.signedUrl
              )}"
              target="_blank"
              rel="noopener noreferrer"
              class="screenshot-link">
              VIEW
            </a>
          `;

        }

      }


      return `
        <tr>

          <td>
            <strong>
              ${escapeHTML(trade.pair)}
            </strong>
          </td>

          <td>
            ${escapeHTML(trade.direction)}
          </td>

          <td>
            $${Number(trade.sl || 0).toFixed(2)}
          </td>

          <td>
            $${Number(trade.tp || 0).toFixed(2)}
          </td>

          <td>
            ${Number(trade.lot_size || 0).toFixed(2)}
          </td>

          <td>
            $${Number(
              trade.profit_loss || 0
            ).toFixed(2)}
          </td>

          <td>
            <span class="${resultClass}">
              ${escapeHTML(trade.result)}
            </span>
          </td>

          <td>
            ${screenshotHTML}
          </td>

          <td>
            ${date}
          </td>

          <td>

            <button
              class="delete-trade"
              data-id="${escapeHTML(trade.id)}">
              Delete
            </button>

          </td>

        </tr>
      `;

    })

  );


  tbody.innerHTML =
    rows.join("");


  document
    .querySelectorAll(".delete-trade")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => deleteTrade(button.dataset.id)
      );

    });

}


// =========================================
// DELETE TRADE
// =========================================

async function deleteTrade(tradeId) {

  const user = await getCurrentUser();

  if (!user) return;


  const trade =
    allTrades.find(
      item => item.id === tradeId
    );


  if (!trade) return;


  const confirmed =
    confirm("Delete this trade?");


  if (!confirmed) return;


  try {

    // =====================================
    // DELETE SCREENSHOT
    // =====================================

    if (trade.screenshot_url) {

      const {
        error: storageError
      } =
        await supabaseClient
          .storage
          .from("trade-screenshots")
          .remove([
            trade.screenshot_url
          ]);


      if (storageError) {
        console.error(storageError);
      }

    }


    // =====================================
    // DELETE DATABASE RECORD
    // =====================================

    const {
      error
    } =
      await supabaseClient
        .from("trades")
        .delete()
        .eq("id", tradeId)
        .eq("user_id", user.id);


    if (error) {
      throw error;
    }


    // =====================================
    // RECALCULATE CHALLENGE
    // =====================================

    await recalculateChallenge(user.id);


    showMessage(
      "Trade deleted successfully.",
      "success"
    );


    await loadTrades();


  } catch (error) {

    console.error(error);

    showMessage(
      "Unable to delete trade.",
      "error"
    );

  }

}


// =========================================
// FILTER
// =========================================

function setupFilter() {

  const filter =
    document.getElementById("filterPair");


  if (!filter) return;


  filter.addEventListener("change", async () => {

    const value = filter.value;


    if (value === "ALL") {

      await renderTrades(allTrades);

      return;

    }


    const filtered =
      allTrades.filter(
        trade => trade.pair === value
      );


    await renderTrades(filtered);

  });

}


// =========================================
// SUMMARY
// =========================================

function updateSummary(trades) {

  const total =
    trades.length;


  const wins =
    trades.filter(
      trade => trade.result === "WIN"
    ).length;


  const losses =
    trades.filter(
      trade => trade.result === "LOSS"
    ).length;


  const breakeven =
    trades.filter(
      trade => trade.result === "BREAKEVEN"
    ).length;


  const totalElement =
    document.getElementById("journalTotal");

  const winsElement =
    document.getElementById("journalWins");

  const lossesElement =
    document.getElementById("journalLosses");

  const breakevenElement =
    document.getElementById("journalBreakeven");


  if (totalElement) {
    totalElement.textContent = total;
  }

  if (winsElement) {
    winsElement.textContent = wins;
  }

  if (lossesElement) {
    lossesElement.textContent = losses;
  }

  if (breakevenElement) {
    breakevenElement.textContent = breakeven;
  }

}


// =========================================
// RECALCULATE CHALLENGE
// =========================================

async function recalculateChallenge(userId) {

  try {

    // =====================================
    // GET LATEST CHALLENGE
    // =====================================

    const {
      data: challenges,
      error: challengeError
    } =
      await supabaseClient
        .from("challenges")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", {
          ascending: false
        })
        .limit(1);


    if (challengeError) {
      throw challengeError;
    }


    if (
      !challenges ||
      challenges.length === 0
    ) {
      return;
    }


    const challenge =
      challenges[0];


    // =====================================
    // GET ALL TRADES
    // =====================================

    const {
      data: trades,
      error: tradeError
    } =
      await supabaseClient
        .from("trades")
        .select("profit_loss")
        .eq("user_id", userId);


    if (tradeError) {
      throw tradeError;
    }


    // =====================================
    // CALCULATE TOTAL P/L
    // =====================================

    const totalProfitLoss =
      (trades || []).reduce(
        (total, trade) => {

          return total +
            Number(
              trade.profit_loss || 0
            );

        },
        0
      );


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
    // DETERMINE STATUS
    // =====================================

    let newStatus = "ACTIVE";


    if (
      targetBalance > 0 &&
      newBalance >= targetBalance
    ) {

      newStatus = "PASSED";

    }


    if (
      maxDrawdown > 0 &&
      newBalance <=
        startingBalance - maxDrawdown
    ) {

      newStatus = "FAILED";

    }


    // =====================================
    // UPDATE DATA
    // =====================================

    const updateData = {

      current_balance:
        newBalance,

      status:
        newStatus

    };


    if (
      newStatus === "PASSED" ||
      newStatus === "FAILED"
    ) {

      if (!challenge.completed_at) {

        updateData.completed_at =
          new Date().toISOString();

      } else {

        updateData.completed_at =
          challenge.completed_at;

      }

    } else {

      updateData.completed_at = null;

    }


    // =====================================
    // SAVE CHALLENGE
    // =====================================

    const {
      error: updateError
    } =
      await supabaseClient
        .from("challenges")
        .update(updateData)
        .eq("id", challenge.id)
        .eq("user_id", userId);


    if (updateError) {
      throw updateError;
    }


  } catch (error) {

    console.error(
      "Challenge recalculation error:",
      error
    );

  }

}


// =========================================
// RESET
// =========================================

function resetForm() {

  const form =
    document.getElementById("tradeForm");

  if (form) {
    form.reset();
  }


  selectedDirection = "";
  selectedResult = "";
  selectedScreenshot = null;


  document
    .querySelectorAll(".direction-btn")
    .forEach(btn =>
      btn.classList.remove("selected")
    );


  document
    .querySelectorAll(".result-btn")
    .forEach(btn =>
      btn.classList.remove("selected")
    );


  const direction =
    document.getElementById("direction");

  if (direction) {
    direction.value = "";
  }


  const result =
    document.getElementById("result");

  if (result) {
    result.value = "";
  }


  const preview =
    document.getElementById("imagePreview");


  if (preview) {

    preview.innerHTML = "";
    preview.style.display = "none";

  }

}


// =========================================
// MESSAGE
// =========================================

function showMessage(message, type) {

  const box =
    document.getElementById("formMessage");


  if (!box) return;


  box.textContent = message;

  box.className =
    `form-message ${type}`;


  setTimeout(() => {

    box.className = "form-message";

  }, 4000);

}


// =========================================
// SECURITY
// =========================================

function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}