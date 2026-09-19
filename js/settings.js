document.addEventListener("DOMContentLoaded", async () => {
  
  const user = await requireAuth();
  
  if (!user) return;
  
  loadAccount(user);
  
  setupLanguage();
  
  setupLogout();
  
  await loadCurrentLanguage(user.id);
  
});


function loadAccount(user) {
  
  const email =
    document.getElementById("accountEmail");
  
  const id =
    document.getElementById("accountId");
  
  if (email) {
    email.textContent = user.email || "-";
  }
  
  if (id) {
    id.textContent = user.id;
  }
  
}


function setupLanguage() {
  
  document
    .querySelectorAll(".language-option")
    .forEach(button => {
      
      button.addEventListener("click", async () => {
        
        const language =
          button.dataset.language;
        
        await changeLanguage(language);
        
      });
      
    });
  
}


async function loadCurrentLanguage(userId) {
  
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("language")
    .eq("id", userId)
    .single();
  
  
  if (error) {
    console.error(error);
    return;
  }
  
  
  const language =
    data?.language || "en";
  
  markSelectedLanguage(language);
  
}


async function changeLanguage(language) {
  
  const user =
    await getCurrentUser();
  
  if (!user) return;
  
  
  const allowedLanguages = [
    "en",
    "om",
    "am"
  ];
  
  
  if (!allowedLanguages.includes(language)) {
    return;
  }
  
  
  const { error } = await supabaseClient
    .from("profiles")
    .update({
      language: language,
      updated_at: new Date().toISOString()
    })
    .eq("id", user.id);
  
  
  if (error) {
    
    console.error(error);
    
    showSettingsMessage(
      "Unable to save language."
    );
    
    return;
  }
  
  
  markSelectedLanguage(language);
  
  
  showSettingsMessage(
    "Language preference saved."
  );
  
}


function markSelectedLanguage(language) {
  
  document
    .querySelectorAll(".language-option")
    .forEach(button => {
      
      button.classList.toggle(
        "selected",
        button.dataset.language === language
      );
      
    });
  
}


function setupLogout() {
  
  const buttons = [
    document.getElementById("logoutBtn"),
    document.getElementById("settingsLogoutBtn")
  ];
  
  
  buttons.forEach(button => {
    
    if (!button) return;
    
    button.addEventListener("click", async () => {
      
      await logout();
      
    });
    
  });
  
}


function showSettingsMessage(message) {
  
  const element =
    document.getElementById("settingsMessage");
  
  if (!element) return;
  
  element.textContent = message;
  
  setTimeout(() => {
    
    element.textContent = "";
    
  }, 3000);
  
}