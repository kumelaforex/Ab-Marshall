// =========================================================
// AB MARSHALL FOREX CHALLENGE
// FORGOT PASSWORD
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  setupForgotPassword();
});


// =========================================================
// FORGOT PASSWORD FORM
// =========================================================

function setupForgotPassword() {
  
  const form =
    document.getElementById("forgotPasswordForm");
  
  if (!form) return;
  
  form.addEventListener("submit", async event => {
    
    event.preventDefault();
    
    const emailInput =
      document.getElementById("forgotEmail");
    
    const button =
      document.getElementById("forgotPasswordBtn");
    
    if (!emailInput || !button) return;
    
    const email =
      emailInput.value.trim();
    
    if (!email) {
      
      showForgotMessage(
        "Please enter your email address.",
        "error"
      );
      
      emailInput.focus();
      
      return;
    }
    
    button.disabled = true;
    
    button.innerHTML = `
      <span>SENDING...</span>
      <i class="fi fi-rr-paper-plane"></i>
    `;
    
    try {
      
      if (typeof supabaseClient === "undefined") {
        throw new Error("Supabase is not connected.");
      }
      
      /*
       * Supabase will send the password reset email.
       *
       * The user will be redirected to:
       * /pages/reset-password.html
       */
      const redirectUrl =
        `${window.location.origin}/pages/reset-password.html`;
      
      const { error } =
      await supabaseClient.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: redirectUrl
        }
      );
      
      if (error) {
        throw error;
      }
      
      showForgotMessage(
        "Password reset link has been sent. Please check your email.",
        "success"
      );
      
      button.innerHTML = `
        <span>EMAIL SENT</span>
        <i class="fi fi-rr-check"></i>
      `;
      
    } catch (error) {
      
      console.error(
        "Forgot password error:",
        error
      );
      
      showForgotMessage(
        getForgotPasswordErrorMessage(error),
        "error"
      );
      
      button.disabled = false;
      
      button.innerHTML = `
        <span>SEND RESET LINK</span>
        <i class="fi fi-rr-paper-plane"></i>
      `;
    }
    
  });
  
}


// =========================================================
// ERROR MESSAGE
// =========================================================

function getForgotPasswordErrorMessage(error) {
  
  const message =
    String(error?.message || "").toLowerCase();
  
  if (message.includes("invalid email")) {
    return "Please enter a valid email address.";
  }
  
  if (
    message.includes("rate limit") ||
    message.includes("too many")
  ) {
    return "Too many requests. Please try again later.";
  }
  
  if (message.includes("network")) {
    return "Network error. Please check your internet connection.";
  }
  
  return "Unable to send password reset link. Please try again.";
}


// =========================================================
// SHOW MESSAGE
// =========================================================

function showForgotMessage(message, type) {
  
  const element =
    document.getElementById(
      "forgotPasswordMessage"
    );
  
  if (!element) return;
  
  element.textContent = message;
  
  element.className =
    `auth-message ${type}`;
}