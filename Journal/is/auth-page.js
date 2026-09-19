// =========================================================
// AB MARSHALL FOREX CHALLENGE
// AUTH PAGE
// LOGIN + SIGNUP + PASSWORD RESET + PASSWORD TOGGLE
// =========================================================


// =========================================================
// PAGE START
// =========================================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    try {

      if (typeof getCurrentUser === "function") {

        const user =
          await getCurrentUser();

        if (user) {

          window.location.href =
            "dashboard.html";

          return;

        }

      }

    } catch (error) {

      console.error(
        "Auth check error:",
        error
      );

    }


    setupLogin();

    setupSignup();

    setupPasswordToggles();

  }
);


// =========================================================
// LOGIN
// =========================================================

function setupLogin() {

  const form =
    document.getElementById(
      "loginForm"
    );

  if (!form) return;


  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const emailInput =
        document.getElementById(
          "loginEmail"
        );

      const passwordInput =
        document.getElementById(
          "loginPassword"
        );

      const button =
        document.getElementById(
          "loginBtn"
        );


      if (
        !emailInput ||
        !passwordInput ||
        !button
      ) {
        return;
      }


      const email =
        emailInput.value.trim();

      const password =
        passwordInput.value;


      if (!email || !password) {

        showAuthMessage(
          "loginMessage",
          "Please enter your email and password.",
          "error"
        );

        return;

      }


      button.disabled = true;

      button.innerHTML = `
        <span>SIGNING IN...</span>
        <i class="fi fi-br-enter"></i>
      `;


      try {

        if (
          typeof supabaseClient ===
          "undefined"
        ) {

          throw new Error(
            "Supabase is not connected."
          );

        }


        const {
          error
        } =
          await supabaseClient.auth
            .signInWithPassword({

              email: email,

              password: password

            });


        if (error) {

          throw error;

        }


        showAuthMessage(
          "loginMessage",
          "Login successful.",
          "success"
        );


        setTimeout(
          () => {

            window.location.href =
              "dashboard.html";

          },
          500
        );


      } catch (error) {

        console.error(
          "Login error:",
          error
        );


        /*
         * Show a simple message instead of
         * exposing Supabase technical errors.
         */

        showAuthMessage(
          "loginMessage",
          "Incorrect email or password.",
          "error"
        );


        button.disabled = false;

        button.innerHTML = `
          <span>SIGN IN</span>
          <i class="fi fi-rr-sign-in-alt"></i>
        `;

      }

    }
  );

}


// =========================================================
// SIGN UP
// =========================================================

function setupSignup() {

  const form =
    document.getElementById(
      "signupForm"
    );

  if (!form) return;


  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const nameInput =
        document.getElementById(
          "signupName"
        );

      const emailInput =
        document.getElementById(
          "signupEmail"
        );

      const passwordInput =
        document.getElementById(
          "signupPassword"
        );

      const confirmPasswordInput =
        document.getElementById(
          "signupConfirmPassword"
        );

      const button =
        document.getElementById(
          "signupBtn"
        );


      if (
        !nameInput ||
        !emailInput ||
        !passwordInput ||
        !confirmPasswordInput ||
        !button
      ) {
        return;
      }


      const name =
        nameInput.value.trim();

      const email =
        emailInput.value.trim();

      const password =
        passwordInput.value;

      const confirmPassword =
        confirmPasswordInput.value;


      // --------------------------------
      // NAME
      // --------------------------------

      if (!name) {

        showAuthMessage(
          "signupMessage",
          "Please enter your full name.",
          "error"
        );

        nameInput.focus();

        return;

      }


      // --------------------------------
      // EMAIL
      // --------------------------------

      if (!email) {

        showAuthMessage(
          "signupMessage",
          "Please enter your email.",
          "error"
        );

        emailInput.focus();

        return;

      }


      // --------------------------------
      // PASSWORD VALIDATION
      // --------------------------------

      const passwordValidation =
        validatePassword(password);


      if (!passwordValidation.valid) {

        showAuthMessage(
          "signupMessage",
          passwordValidation.message,
          "error"
        );

        passwordInput.focus();

        return;

      }


      // --------------------------------
      // PASSWORD MATCH
      // --------------------------------

      if (
        password !==
        confirmPassword
      ) {

        showAuthMessage(
          "signupMessage",
          "Passwords do not match.",
          "error"
        );

        confirmPasswordInput.focus();

        return;

      }


      // --------------------------------
      // LOADING
      // --------------------------------

      button.disabled = true;

      button.innerHTML = `
        <span>CREATING...</span>
        <i class="fi fi-br-enter"></i>
      `;


      try {

        if (
          typeof supabaseClient ===
          "undefined"
        ) {

          throw new Error(
            "Supabase is not connected."
          );

        }


        const {
          data,
          error
        } =
          await supabaseClient.auth
            .signUp({

              email: email,

              password: password,

              options: {

                data: {

                  full_name: name

                }

              }

            });


        if (error) {

          throw error;

        }


        // --------------------------------
        // EMAIL CONFIRMATION REQUIRED
        // --------------------------------

        if (
          data.user &&
          !data.session
        ) {

          showConfirmEmailCard(email);

          return;

        }


        // --------------------------------
        // ACCOUNT CREATED
        // --------------------------------

        showAuthMessage(
          "signupMessage",
          "Account created successfully.",
          "success"
        );


        setTimeout(
          () => {

            window.location.href =
              "dashboard.html";

          },
          700
        );


      } catch (error) {

        console.error(
          "Signup error:",
          error
        );


        showAuthMessage(
          "signupMessage",
          getSignupErrorMessage(error),
          "error"
        );


        button.disabled = false;

        button.innerHTML = `
          <span>CREATE ACCOUNT</span>
          <i class="fi fi-rs-enter"></i>
        `;

      }

    }
  );

}


// =========================================================
// PASSWORD VALIDATION
// =========================================================

function validatePassword(password) {

  if (password.length < 8) {

    return {

      valid: false,

      message:
        "Password must be at least 8 characters."

    };

  }


  if (!/[A-Z]/.test(password)) {

    return {

      valid: false,

      message:
        "Password must contain at least one uppercase letter."

    };

  }


  if (!/[a-z]/.test(password)) {

    return {

      valid: false,

      message:
        "Password must contain at least one lowercase letter."

    };

  }


  if (!/[0-9]/.test(password)) {

    return {

      valid: false,

      message:
        "Password must contain at least one number."

    };

  }


  if (!/[^A-Za-z0-9]/.test(password)) {

    return {

      valid: false,

      message:
        "Password must contain at least one special character such as $ & @ ! # %."

    };

  }


  return {

    valid: true,

    message: ""

  };

}


// =========================================================
// SIGNUP ERROR MESSAGE
// =========================================================

function getSignupErrorMessage(error) {

  const message =
    String(
      error?.message || ""
    ).toLowerCase();


  if (
    message.includes("already registered") ||
    message.includes("user already registered")
  ) {

    return "An account with this email already exists.";

  }


  if (
    message.includes("invalid email")
  ) {

    return "Please enter a valid email address.";

  }


  if (
    message.includes("password")
  ) {

    return "Unable to create account. Please check your password.";

  }


  return (
    error?.message ||
    "Unable to create account."
  );

}


// =========================================================
// CONFIRM EMAIL CARD
// =========================================================

function showConfirmEmailCard(email) {

  const card =
    document.querySelector(
      ".auth-card"
    );


  if (!card) return;


  card.innerHTML = `

    <div class="confirm-email-card">

      <div class="confirm-email-icon">

        <i class="fi fi-sr-envelope"></i>

      </div>


      <span class="eyebrow">
        AB MARSHALL
      </span>


      <h1>
        CONFIRM YOUR EMAIL
      </h1>


      <p class="confirm-email-success">
        Your account has been created successfully.
      </p>


      <p>
        We sent a confirmation link to your email address.
      </p>


      <p>
        Please check your Gmail inbox and click the confirmation link to activate your account.
      </p>


      <a
        href="https://mail.google.com/"
        target="_blank"
        rel="noopener noreferrer"
        class="auth-btn confirm-gmail-btn">

        <span>
          OPEN GMAIL
        </span>

        <i class="fi fi-rr-envelope"></i>

      </a>


      <div class="confirm-email-divider">
        <span></span>
        <small>
          ${escapeHTML(email)}
        </small>
        <span></span>
      </div>


      <div class="auth-footer">

        <span>
          Already confirmed?
        </span>

        <a href="login.html">
          Sign In
        </a>

      </div>


      <div class="powered-by">
        POWERED BY KUMELA
      </div>

    </div>

  `;

}


// =========================================================
// PASSWORD SHOW / HIDE
// =========================================================

function setupPasswordToggles() {

  const buttons =
    document.querySelectorAll(
      ".password-toggle"
    );


  buttons.forEach(button => {

    button.type = "button";


    button.addEventListener(
      "click",
      event => {

        event.preventDefault();

        event.stopPropagation();


        const wrapper =
          button.closest(
            ".password-wrapper"
          );


        if (!wrapper) return;


        const input =
          wrapper.querySelector(
            "input"
          );


        const icon =
          button.querySelector(
            "i"
          );


        if (!input || !icon) {
          return;
        }


        const isHidden =
          input.type === "password";


        input.type =
          isHidden
            ? "text"
            : "password";


        icon.className =
          isHidden
            ? "fi fi-rr-eye"
            : "fi fi-rr-eye-crossed";


        button.setAttribute(
          "aria-label",
          isHidden
            ? "Hide password"
            : "Show password"
        );


        button.setAttribute(
          "title",
          isHidden
            ? "Hide password"
            : "Show password"
        );


        button.classList.toggle(
          "showing",
          isHidden
        );

      }
    );

  });

}


// =========================================================
// AUTH MESSAGE
// =========================================================

function showAuthMessage(
  elementId,
  message,
  type
) {

  const element =
    document.getElementById(
      elementId
    );


  if (!element) return;


  element.textContent =
    message;


  element.className =
    `auth-message ${type}`;

}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHTML(value) {

  return String(value ?? "")
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