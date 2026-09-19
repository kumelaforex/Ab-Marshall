// =========================================
// AB MARSHALL FOREX CHALLENGE
// ANALYTICS.JS
// =========================================


const PAIRS = [
  "XAUUSD",
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "AUDUSD"
];


// =========================================
// APP START
// =========================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    const user =
      await requireAuth();


    if (!user) {
      return;
    }


    await loadAnalytics(
      user.id
    );

  }
);


// =========================================
// LOAD ANALYTICS
// =========================================

async function loadAnalytics(
  userId
) {

  const {
    data,
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

    console.error(
      "Analytics loading error:",
      error
    );

    showAnalyticsError();

    return;
  }


  const trades =
    Array.isArray(data)
      ? data
      : [];


  updateOverview(
    trades
  );


  updateResultBreakdown(
    trades
  );


  updateDirection(
    trades
  );


  updatePairPerformance(
    trades
  );


  updateStrategyPerformance(
    trades
  );

}


// =========================================
// OVERVIEW
// =========================================

function updateOverview(
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


  const completed =
    wins + losses;


  const winRate =
    completed > 0
      ? (
          wins /
          completed
        ) * 100
      : 0;


  const profitLoss =
    trades.reduce(
      (
        sum,
        trade
      ) => {

        return (
          sum +
          Number(
            trade.profit_loss || 0
          )
        );

      },
      0
    );


  setText(
    "analyticsTrades",
    total
  );


  setText(
    "analyticsWinRate",
    `${winRate.toFixed(1)}%`
  );


  setText(
    "analyticsProfitLoss",
    formatProfitLoss(
      profitLoss
    )
  );


  setText(
    "analyticsBreakeven",
    breakeven
  );

}


// =========================================
// RESULT BREAKDOWN
// =========================================

function updateResultBreakdown(
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


  setText(
    "winsCount",
    wins
  );


  setText(
    "lossesCount",
    losses
  );


  setText(
    "breakevenCount",
    breakeven
  );


  setBar(
    "winsBar",
    total > 0
      ? (
          wins /
          total
        ) * 100
      : 0
  );


  setBar(
    "lossesBar",
    total > 0
      ? (
          losses /
          total
        ) * 100
      : 0
  );


  setBar(
    "breakevenBar",
    total > 0
      ? (
          breakeven /
          total
        ) * 100
      : 0
  );

}


// =========================================
// DIRECTION
// =========================================

function updateDirection(
  trades
) {

  const buys =
    trades.filter(
      trade =>
        trade.direction === "BUY"
    ).length;


  const sells =
    trades.filter(
      trade =>
        trade.direction === "SELL"
    ).length;


  setText(
    "buyCount",
    buys
  );


  setText(
    "sellCount",
    sells
  );

}


// =========================================
// PAIR PERFORMANCE
// =========================================

function updatePairPerformance(
  trades
) {

  const tbody =
    document.getElementById(
      "pairPerformanceBody"
    );


  if (!tbody) {
    return;
  }


  tbody.innerHTML =
    PAIRS
      .map(
        pair => {

          const pairTrades =
            trades.filter(
              trade =>
                trade.pair === pair
            );


          const wins =
            pairTrades.filter(
              trade =>
                trade.result === "WIN"
            ).length;


          const losses =
            pairTrades.filter(
              trade =>
                trade.result === "LOSS"
            ).length;


          const completed =
            wins + losses;


          const winRate =
            completed > 0
              ? (
                  wins /
                  completed
                ) * 100
              : 0;


          const profitLoss =
            pairTrades.reduce(
              (
                sum,
                trade
              ) => {

                return (
                  sum +
                  Number(
                    trade.profit_loss ||
                    0
                  )
                );

              },
              0
            );


          return `
            <tr>

              <td>
                <strong>
                  ${escapeHTML(pair)}
                </strong>
              </td>

              <td>
                ${pairTrades.length}
              </td>

              <td>
                ${wins}
              </td>

              <td>
                ${losses}
              </td>

              <td>
                ${winRate.toFixed(1)}%
              </td>

              <td>
                ${formatProfitLoss(
                  profitLoss
                )}
              </td>

            </tr>
          `;

        }
      )
      .join("");

}


// =========================================
// STRATEGY PERFORMANCE
// =========================================

function updateStrategyPerformance(
  trades
) {

  const tbody =
    document.getElementById(
      "strategyPerformanceBody"
    );


  if (!tbody) {
    return;
  }


  const strategies = {};


  trades.forEach(
    trade => {

      const strategy =
        String(
          trade.strategy ?? ""
        ).trim() ||
        "No Strategy";


      if (
        !strategies[strategy]
      ) {

        strategies[strategy] = {

          trades: 0,

          wins: 0,

          losses: 0,

          profitLoss: 0

        };

      }


      strategies[strategy]
        .trades += 1;


      if (
        trade.result === "WIN"
      ) {

        strategies[strategy]
          .wins += 1;

      }


      if (
        trade.result === "LOSS"
      ) {

        strategies[strategy]
          .losses += 1;

      }


      strategies[strategy]
        .profitLoss +=
          Number(
            trade.profit_loss || 0
          );

    }
  );


  const entries =
    Object.entries(
      strategies
    );


  if (
    entries.length === 0
  ) {

    tbody.innerHTML = `
      <tr>

        <td
          colspan="6"
          class="empty-state"
        >
          No strategy data yet.
        </td>

      </tr>
    `;

    return;
  }


  tbody.innerHTML =
    entries
      .map(
        (
          [
            strategy,
            stats
          ]
        ) => {

          const completed =
            stats.wins +
            stats.losses;


          const winRate =
            completed > 0
              ? (
                  stats.wins /
                  completed
                ) * 100
              : 0;


          return `
            <tr>

              <td>
                <strong>
                  ${escapeHTML(
                    strategy
                  )}
                </strong>
              </td>

              <td>
                ${stats.trades}
              </td>

              <td>
                ${stats.wins}
              </td>

              <td>
                ${stats.losses}
              </td>

              <td>
                ${winRate.toFixed(1)}%
              </td>

              <td>
                ${formatProfitLoss(
                  stats.profitLoss
                )}
              </td>

            </tr>
          `;

        }
      )
      .join("");

}


// =========================================
// PROGRESS BAR
// =========================================

function setBar(
  id,
  percentage
) {

  const element =
    document.getElementById(
      id
    );


  if (!element) {
    return;
  }


  const safePercentage =
    Math.max(
      0,
      Math.min(
        Number(
          percentage
        ) || 0,
        100
      )
    );


  element.style.width =
    `${safePercentage}%`;

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


  if (!element) {
    return;
  }


  element.textContent =
    value;

}


// =========================================
// FORMAT PROFIT / LOSS
// =========================================

function formatProfitLoss(
  value
) {

  const number =
    Number(value || 0);


  const sign =
    number >= 0
      ? "+"
      : "";


  return (
    `${sign}$${number.toFixed(2)}`
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
// ANALYTICS ERROR
// =========================================

function showAnalyticsError() {

  const pairBody =
    document.getElementById(
      "pairPerformanceBody"
    );


  const strategyBody =
    document.getElementById(
      "strategyPerformanceBody"
    );


  if (pairBody) {

    pairBody.innerHTML = `
      <tr>

        <td
          colspan="6"
          class="empty-state"
        >
          Unable to load analytics.
        </td>

      </tr>
    `;

  }


  if (strategyBody) {

    strategyBody.innerHTML = `
      <tr>

        <td
          colspan="6"
          class="empty-state"
        >
          Unable to load analytics.
        </td>

      </tr>
    `;

  }

}