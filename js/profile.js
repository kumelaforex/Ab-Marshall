document.addEventListener("DOMContentLoaded", async () => {
  
  const user = await requireAuth();
  
  if (!user) return;
  
  setupProfilePage();
  
  await loadProfile(user);
  
});


function setupProfilePage() {
  
  const form =
    document.getElementById("profileForm");
  
  if (!form) return;
  
  form.addEventListener(
    "submit",
    saveProfile
  );
  
}


async function loadProfile(user) {
  
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  
  
  if (error) {
    
    console.error(error);
    
    showMessage(
      "Unable to load profile.",
      "error"
    );
    
    return;
  }
  
  
  const fullName =
    data.full_name ||
    user.user_metadata?.full_name ||
    "";
  
  
  document.getElementById("fullName").value =
    fullName;
  
  document.getElementById("username").value =
    data.username || "";
  
  document.getElementById("language").value =
    data.language || "en";
  
  
  document.getElementById("profileName").textContent =
    fullName || "User";
  
  document.getElementById("profileEmail").textContent =
    user.email || "";
  
  
  const firstLetter =
    (fullName || user.email || "A")
    .charAt(0)
    .toUpperCase();
  
  
  document.getElementById("profileAvatar")
    .textContent = firstLetter;
  
}


async function saveProfile(event) {
  
  event.preventDefault();
  
  
  const user =
    await getCurrentUser();
  
  if (!user) return;
  
  
  const fullName =
    document.getElementById("fullName")
    .value
    .trim();
  
  
  const username =
    document.getElementById("username")
    .value
    .trim();
  
  
  const language =
    document.getElementById("language")
    .value;
  
  
  if (!fullName) {
    
    showMessage(
      "Full name is required.",
      "error"
    );
    
    return;
  }
  
  
  const { error } = await supabaseClient
    .from("profiles")
    .update({
      full_name: fullName,
      username: username || null,
      language: language,
      updated_at: new Date().toISOString()
    })
    .eq("id", user.id);
  
  
  if (error) {
    
    console.error(error);
    
    showMessage(
      error.message,
      "error"
    );
    
    return;
  }
  
  
  document.getElementById(
    "profileName"
  ).textContent = fullName;
  
  
  document.getElementById(
      "profileAvatar"
    ).textContent =
    fullName.charAt(0).toUpperCase();
  
  
  showMessage(
    "Profile updated successfully.",
    "success"
  );
  
}


function showMessage(message, type) {
  
  const element =
    document.getElementById(
      "profileMessage"
    );
  
  if (!element) return;
  
  element.textContent = message;
  
  element.className =
    `form-message ${type}`;
  
  
  setTimeout(() => {
    
    element.textContent = "";
    element.className = "form-message";
    
  }, 4000);
  
}