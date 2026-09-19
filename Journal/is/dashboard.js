// =========================================
// DASHBOARD START
// =========================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    const user =
      await requireAuth();

    if (!user) return;

    await loadDashboard(
      user.id
    );

  }
);


// =========================================
// LOAD DASHBOARD
// =========================================

async function loadDashboard(
  userId
) {

  try {

    const {
      data: trades,
      error
    } =
      await supabaseClient
        .from("trades")
        .select("*")
        .eq(
          "user_id",
          userId
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {
      throw error;
    }


    const allTrades =
      trades || [];


    // UPDATE STATS

    updateTradeStats(
      allTrades
    );


    // RECENT TRADES

    renderRecentTrades(
      allTrades.slice(
        0,
        5
      )
    );


    // CHALLENGE

    await loadDashboardChallenge(
      userId
    );


  } catch (error) {

    console.error(
      "Dashboard error:",
      error
    );

    showDashboardError();

  }

}


// =========================================
// TRADE STATS
// =========================================

function updateTradeStats(
  trades
) {

  const total =
    trades.length;


  const wins =
    trades.filter(
      trade =>
        trade.result === "WIN"
    ).length;


  const losses =
    trades.filter(
      trade =>
        trade.result === "LOSS"
    ).length;


  const breakeven =
    trades.filter(
      trade =>
        trade.result === "BREAKEVEN"
    ).length;


  const profitLoss =
    trades.reduce(
      (
        total,
        trade
      ) => {

        return (
          total +
          safeNumber(
            trade.profit_loss
          )
        );

      },
      0
    );


  // =====================================
  // WIN RATE
  // =====================================

  const decidedTrades =
    wins + losses;


  const winRate =
    decidedTrades > 0
      ? (
          wins /
          decidedTrades
        ) * 100
      : 0;


  // =====================================
  // UPDATE HTML
  // =====================================

  setText(
    "totalTrades",
    total
  );


  setText(
    "totalWins",
    wins
  );


  setText(
    "totalLosses",
    losses
  );


  setText(
    "totalBreakeven",
    breakeven
  );


  setText(
    "totalProfitLoss",
    formatMoney(
      profitLoss
    )
  );


  setText(
    "winRate",
    `${winRate.toFixed(1)}%`
  );


  // SECOND WIN RATE VALUE

  setText(
    "winRateMetric",
    `${winRate.toFixed(1)}%`
  );


  // =====================================
  // WIN RATE BAR
  // =====================================

  const winRateBar =
    document.getElementById(
      "winRateBar"
    );


  if (winRateBar) {

    winRateBar.style.width =
      "0%";


    setTimeout(
      () => {

        winRateBar.style.width =
          `${winRate}%`;

      },
      100
    );

  }

}


// =========================================
// RECENT TRADES
// =========================================

function renderRecentTrades(
  trades
) {

  const tbody =
    document.getElementById(
      "recentTradesBody"
    );


  if (!tbody) return;


  // =====================================
  // EMPTY
  // =====================================

  if (!trades.length) {

    tbody.innerHTML = `
      <tr>
        <td
          colspan="7"
          class="empty-row"
        >
          No trades yet.
        </td>
      </tr>
    `;

    return;

  }


  // =====================================
  // RENDER
  // =====================================

  tbody.innerHTML =
    trades
      .map(
        trade => {

          const profitLoss =
            safeNumber(
              trade.profit_loss
            );


          // =================================
          // P/L CLASS
          // =================================

          let profitClass =
            "";


          if (
            profitLoss > 0
          ) {

            profitClass =
              "profit";

          } else if (
            profitLoss < 0
          ) {

            profitClass =
              "loss";

          }


          // =================================
          // RESULT CLASS
          // =================================

          let resultClass =
            "";


          if (
            trade.result === "WIN"
          ) {

            resultClass =
              "result-win";

          } else if (
            trade.result === "LOSS"
          ) {

            resultClass =
              "result-loss";

          } else if (
            trade.result === "BREAKEVEN"
          ) {

            resultClass =
              "result-breakeven";

          }


          // =================================
          // DIRECTION CLASS
          // =================================

          let directionClass =
            "";


          if (
            trade.direction === "BUY"
          ) {

            directionClass =
              "direction-buy";

          } else if (
            trade.direction === "SELL"
          ) {

            directionClass =
              "direction-sell";

          }


          // =================================
          // RETURN ROW
          // =================================

          return `
            <tr>

              <!-- PAIR -->

              <td>
                <strong>
                  ${escapeHTML(
                    trade.pair ||
                    "—"
                  )}
                </strong>
              </td>


              <!-- DIRECTION -->

              <td>

                <span
                  class="${directionClass}"
                >
                  ${escapeHTML(
                    trade.direction ||
                    "—"
                  )}
                </span>

              </td>


              <!-- SL -->

              <td>
                ${formatMoney(
                  trade.sl
                )}
              </td>


              <!-- TP -->

              <td>
                ${formatMoney(
                  trade.tp
                )}
              </td>


              <!-- PROFIT / LOSS -->

              <td
                class="${profitClass}"
              >
                ${formatMoney(
                  profitLoss
                )}
              </td>


              <!-- RESULT -->

              <td>

                <span
                  class="${resultClass}"
                >
                  ${escapeHTML(
                    trade.result ||
                    "—"
                  )}
                </span>

              </td>


              <!-- DATE -->

              <td>
                ${formatDate(
                  trade.created_at
                )}
              </td>

            </tr>
          `;

        }
      )
      .join("");

}


// =========================================
// LOAD CHALLENGE
// =========================================

async function loadDashboardChallenge(
  userId
) {

  const empty =
    document.getElementById(
      "dashboardChallengeEmpty"
    );


  const challenge =
    document.getElementById(
      "dashboardChallenge"
    );


  if (
    !empty ||
    !challenge
  ) {

    return;

  }


  try {

    // =====================================
    // GET LATEST CHALLENGE
    // =====================================

    const {
      data,
      error
    } =
      await supabaseClient
        .from("challenges")
        .select("*")
        .eq(
          "user_id",
          userId
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        )
        .limit(1);


    if (error) {
      throw error;
    }


    // =====================================
    // NO CHALLENGE
    // =====================================

    if (
      !data ||
      data.length === 0
    ) {

      showChallengeEmpty();

      return;

    }


    const currentChallenge =
      data[0];


    // =====================================
    // GET TRADES
    // =====================================

    const {
      data: trades,
      error: tradesError
    } =
      await supabaseClient
        .from("trades")
        .select(
          "profit_loss"
        )
        .eq(
          "user_id",
          userId
        );


    if (tradesError) {
      throw tradesError;
    }


    // =====================================
    // TOTAL PROFIT / LOSS
    // =====================================

    const totalProfitLoss =
      (trades || [])
        .reduce(
          (
            total,
            trade
          ) => {

            return (
              total +
              safeNumber(
                trade.profit_loss
              )
            );

          },
          0
        );


    // =====================================
    // BALANCES
    // =====================================

    const starting =
      safeNumber(
        currentChallenge.starting_balance
      );


    const target =
      safeNumber(
        currentChallenge.target_balance
      );


    const current =
      starting +
      totalProfitLoss;


    // =====================================
    // PROFIT TARGET
    // =====================================

    const profitTarget =
      target -
      starting;


    let progress =
      0;


    if (
      profitTarget > 0
    ) {

      progress =
        (
          (
            current -
            starting
          ) /
          profitTarget
        ) * 100;

    }


    // =====================================
    // LIMIT PROGRESS
    // =====================================

    progress =
      Math.max(
        0,
        Math.min(
          100,
          progress
        )
      );


    // =====================================
    // CHALLENGE STATUS
    // =====================================

    const drawdown =
      safeNumber(
        currentChallenge.max_drawdown
      );


    let challengeStatus =
      "ACTIVE";


    if (
      target > 0 &&
      current >= target
    ) {

      challengeStatus =
        "PASSED";

    } else if (
      drawdown > 0 &&
      current <=
        starting -
        drawdown
    ) {

      challengeStatus =
        "FAILED";

    }


    // =====================================
    // SHOW CHALLENGE
    // =====================================

    empty.style.display =
      "none";


    challenge.style.display =
      "block";


    // =====================================
    // NAME
    // =====================================

    setText(
      "dashboardChallengeName",
      currentChallenge.name ||
      "Challenge"
    );


    // =====================================
    // STARTED DATE
    // =====================================

    setText(
      "dashboardChallengeStarted",
      `Started ${formatDate(
        currentChallenge.started_at ||
        currentChallenge.created_at
      )}`
    );


    // =====================================
    // CURRENT BALANCE
    // =====================================

    setText(
      "dashboardCurrentBalance",
      formatMoney(
        current
      )
    );


    // =====================================
    // TARGET BALANCE
    // =====================================

    setText(
      "dashboardTargetBalance",
      formatMoney(
        target
      )
    );


    // =====================================
    // PROGRESS %
    // =====================================

    setText(
      "dashboardProgressPercent",
      `${progress.toFixed(1)}%`
    );


    // =====================================
    // START BALANCE
    // =====================================

    setText(
      "dashboardProgressStart",
      formatMoney(
        starting
      )
    );


    // =====================================
    // TARGET
    // =====================================

    setText(
      "dashboardProgressTarget",
      formatMoney(
        target
      )
    );


    // =====================================
    // CURRENT P/L
    // =====================================

    setText(
      "dashboardCurrentProfit",
      formatMoney(
        totalProfitLoss
      )
    );


    // =====================================
    // STATUS UI
    // =====================================

    updateChallengeStatus(
      challengeStatus
    );


    // =====================================
    // PROGRESS BAR
    // =====================================

    const progressBar =
      document.getElementById(
        "dashboardChallengeProgressBar"
      );


    if (progressBar) {

      progressBar.style.width =
        "0%";


      setTimeout(
        () => {

          progressBar.style.width =
            `${progress}%`;

        },
        100
      );

    }


  } catch (error) {

    console.error(
      "Dashboard challenge error:",
      error
    );


    showChallengeEmpty();

  }

}


// =========================================
// CHALLENGE EMPTY STATE
// =========================================

function showChallengeEmpty() {

  const empty =
    document.getElementById(
      "dashboardChallengeEmpty"
    );


  const challenge =
    document.getElementById(
      "dashboardChallenge"
    );


  if (empty) {

    empty.style.display =
      "flex";

  }


  if (challenge) {

    challenge.style.display =
      "none";

  }

}


// =========================================
// UPDATE CHALLENGE STATUS
// =========================================

function updateChallengeStatus(
  challengeStatus
) {

  const status =
    document.getElementById(
      "dashboardChallengeStatus"
    );


  if (!status) return;


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


// =========================================
// SET TEXT
// =========================================

function setText(
  id,
  value
) {

  const element =
    document.getElementById(
      id
    );


  if (!element) return;


  element.textContent =
    value;

}


// =========================================
// SAFE NUMBER
// =========================================

function safeNumber(
  value
) {

  const number =
    Number(value);


  return Number.isFinite(
    number
  )
    ? number
    : 0;

}


// =========================================
// FORMAT MONEY
// =========================================

function formatMoney(
  value
) {

  const number =
    safeNumber(
      value
    );


  return `$${number.toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  )}`;

}


// =========================================
// FORMAT DATE
// =========================================

function formatDate(
  value
) {

  if (!value) {
    return "—";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "—";

  }


  return date.toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric"
    }
  );

}


// =========================================
// ESCAPE HTML
// =========================================

function escapeHTML(
  value
) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


// =========================================
// DASHBOARD ERROR
// =========================================

function showDashboardError() {

  const elements = [

    "totalTrades",

    "totalWins",

    "totalLosses",

    "totalBreakeven",

    "totalProfitLoss",

    "winRate",

    "winRateMetric"

  ];


  elements.forEach(
    id => {

      setText(
        id,
        "—"
      );

    }
  );


  const winRateBar =
    document.getElementById(
      "winRateBar"
    );


  if (winRateBar) {

    winRateBar.style.width =
      "0%";

  }


  showChallengeEmpty();

}