// =========================================================
// AB MARSHALL FOREX CHALLENGE
// RESET PASSWORD
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

  setupResetPassword();

  setupResetPasswordToggles();

});


// =========================================================
// RESET PASSWORD FORM
// =========================================================

function setupResetPassword() {

  const form =
    document.getElementById(
      "resetPasswordForm"
    );

  if (!form) return;


  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const passwordInput =
        document.getElementById(
          "resetPassword"
        );

      const confirmPasswordInput =
        document.getElementById(
          "resetConfirmPassword"
        );

      const button =
        document.getElementById(
          "resetPasswordBtn"
        );


      if (
        !passwordInput ||
        !confirmPasswordInput ||
        !button
      ) {
        return;
      }


      const password =
        passwordInput.value;

      const confirmPassword =
        confirmPasswordInput.value;


      // --------------------------------
      // PASSWORD VALIDATION
      // --------------------------------

      const validation =
        validateResetPassword(
          password
        );


      if (!validation.valid) {

        showResetMessage(
          validation.message,
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

        showResetMessage(
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
        <span>UPDATING...</span>
        <i class="fi fi-rr-lock"></i>
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


        // --------------------------------
        // UPDATE PASSWORD
        // --------------------------------

        const {
          error
        } =
          await supabaseClient.auth
            .updateUser({

              password: password

            });


        if (error) {

          throw error;

        }


        // --------------------------------
        // SUCCESS
        // --------------------------------

        showResetMessage(
          "Password updated successfully. Redirecting to sign in...",
          "success"
        );


        button.innerHTML = `
          <span>PASSWORD UPDATED</span>
          <i class="fi fi-rr-check"></i>
        `;


        setTimeout(
          () => {

            window.location.href =
              "login.html";

          },
          1500
        );


      } catch (error) {

        console.error(
          "Reset password error:",
          error
        );


        showResetMessage(
          getResetPasswordErrorMessage(
            error
          ),
          "error"
        );


        button.disabled = false;


        button.innerHTML = `
          <span>UPDATE PASSWORD</span>
          <i class="fi fi-rr-lock"></i>
        `;

      }

    }
  );

}


// =========================================================
// PASSWORD VALIDATION
// =========================================================

function validateResetPassword(
  password
) {

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
// ERROR MESSAGE
// =========================================================

function getResetPasswordErrorMessage(
  error
) {

  const message =
    String(
      error?.message || ""
    ).toLowerCase();


  if (
    message.includes("same password")
  ) {

    return "Please choose a different password.";

  }


  if (
    message.includes("password")
  ) {

    return "Unable to update password. Please check your password.";

  }


  if (
    message.includes("session")
  ) {

    return "Your password reset link has expired. Please request a new reset link.";

  }


  return (
    error?.message ||
    "Unable to update password. Please try again."
  );

}


// =========================================================
// PASSWORD SHOW / HIDE
// =========================================================

function setupResetPasswordToggles() {

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


        if (
          !input ||
          !icon
        ) {
          return;
        }


        const isHidden =
          input.type ===
          "password";


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
// SHOW MESSAGE
// =========================================================

function showResetMessage(
  message,
  type
) {

  const element =
    document.getElementById(
      "resetPasswordMessage"
    );


  if (!element) return;


  element.textContent =
    message;


  element.className =
    `auth-message ${type}`;

}