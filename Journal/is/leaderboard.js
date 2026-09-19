// =========================================
// AB MARSHALL FOREX CHALLENGE
// LEADERBOARD.JS
// =========================================


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


    setupLeaderboard();

    await loadLeaderboard();

  }
);


// =========================================
// SETUP LEADERBOARD
// =========================================

function setupLeaderboard() {

  const refreshButton =
    document.getElementById(
      "refreshLeaderboard"
    );


  if (!refreshButton) {
    return;
  }


  refreshButton.addEventListener(
    "click",
    async () => {

      refreshButton.disabled = true;


      const originalText =
        refreshButton.textContent;


      refreshButton.textContent =
        "LOADING...";


      try {

        await loadLeaderboard();

      } finally {

        refreshButton.disabled = false;

        refreshButton.textContent =
          originalText;

      }

    }
  );

}


// =========================================
// LOAD LEADERBOARD
// =========================================

async function loadLeaderboard() {

  const tbody =
    document.getElementById(
      "leaderboardBody"
    );


  if (!tbody) {
    return;
  }


  tbody.innerHTML = `
    <tr>

      <td
        colspan="6"
        class="empty-state"
      >
        Loading leaderboard...
      </td>

    </tr>
  `;


  // -----------------------------------------
  // LOAD PROFILES
  // -----------------------------------------

  const {
    data: profiles,
    error: profilesError
  } =
    await supabaseClient
      .from("profiles")
      .select(
        "id, username, full_name"
      );


  if (profilesError) {

    console.error(
      "Leaderboard profiles error:",
      profilesError
    );

    showError();

    return;
  }


  // -----------------------------------------
  // LOAD TRADES
  // -----------------------------------------

  const {
    data: trades,
    error: tradesError
  } =
    await supabaseClient
      .from("trades")
      .select(
        "user_id, result, profit_loss"
      );


  if (tradesError) {

    console.error(
      "Leaderboard trades error:",
      tradesError
    );

    showError();

    return;
  }


  // -----------------------------------------
  // BUILD TRADER DATA
  // -----------------------------------------

  const traders = {};


  (profiles || []).forEach(
    profile => {

      const username =
        String(
          profile.username ??
          ""
        ).trim();


      const fullName =
        String(
          profile.full_name ??
          ""
        ).trim();


      traders[profile.id] = {

        id:
          profile.id,

        username:
          username ||
          fullName ||
          "Trader",

        trades: 0,

        wins: 0,

        losses: 0,

        profitLoss: 0

      };

    }
  );


  // -----------------------------------------
  // ADD TRADE STATISTICS
  // -----------------------------------------

  (trades || []).forEach(
    trade => {

      const trader =
        traders[trade.user_id];


      if (!trader) {
        return;
      }


      trader.trades += 1;


      if (
        trade.result === "WIN"
      ) {

        trader.wins += 1;

      }


      if (
        trade.result === "LOSS"
      ) {

        trader.losses += 1;

      }


      trader.profitLoss +=
        Number(
          trade.profit_loss || 0
        );

    }
  );


  // -----------------------------------------
  // CREATE LEADERBOARD
  // -----------------------------------------

  const leaderboard =
    Object.values(
      traders
    )
      .filter(
        trader =>
          trader.trades > 0
      );


  // -----------------------------------------
  // CALCULATE WIN RATE
  // -----------------------------------------

  leaderboard.forEach(
    trader => {

      const completed =
        trader.wins +
        trader.losses;


      trader.winRate =
        completed > 0
          ? (
              trader.wins /
              completed
            ) * 100
          : 0;

    }
  );


  // -----------------------------------------
  // SORT BY TOTAL P/L
  // -----------------------------------------

  leaderboard.sort(
    (
      first,
      second
    ) => {

      return (
        second.profitLoss -
        first.profitLoss
      );

    }
  );


  renderLeaderboard(
    leaderboard
  );

}


// =========================================
// RENDER LEADERBOARD
// =========================================

function renderLeaderboard(
  traders
) {

  const tbody =
    document.getElementById(
      "leaderboardBody"
    );


  if (!tbody) {
    return;
  }


  if (
    !traders ||
    traders.length === 0
  ) {

    tbody.innerHTML = `
      <tr>

        <td
          colspan="6"
          class="empty-state"
        >
          No public trading data yet.
        </td>

      </tr>
    `;

    return;
  }


  tbody.innerHTML =
    traders
      .map(
        (
          trader,
          index
        ) => {

          const username =
            String(
              trader.username ||
              "Trader"
            );


          const initial =
            username
              .charAt(0)
              .toUpperCase();


          const profitLoss =
            Number(
              trader.profitLoss ||
              0
            );


          const sign =
            profitLoss >= 0
              ? "+"
              : "";


          return `
            <tr>

              <td>

                <span
                  class="rank-number"
                >
                  ${index + 1}
                </span>

              </td>


              <td>

                <div
                  class="leaderboard-user"
                >

                  <div
                    class="leaderboard-avatar"
                  >
                    ${escapeHTML(
                      initial
                    )}
                  </div>


                  <span
                    class="leaderboard-name"
                  >
                    ${escapeHTML(
                      username
                    )}
                  </span>

                </div>

              </td>


              <td>
                ${trader.trades}
              </td>


              <td>
                ${trader.wins}
              </td>


              <td>
                ${trader.winRate.toFixed(
                  1
                )}%
              </td>


              <td>
                ${sign}$${profitLoss.toFixed(
                  2
                )}
              </td>

            </tr>
          `;

        }
      )
      .join("");

}


// =========================================
// ERROR
// =========================================

function showError() {

  const tbody =
    document.getElementById(
      "leaderboardBody"
    );


  if (!tbody) {
    return;
  }


  tbody.innerHTML = `
    <tr>

      <td
        colspan="6"
        class="empty-state"
      >
        Unable to load leaderboard.
      </td>

    </tr>
  `;

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