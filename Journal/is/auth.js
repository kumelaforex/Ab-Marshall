async function getCurrentUser() {
  
  const {
    data,
    error
  } = await supabaseClient.auth.getUser();
  
  if (error) {
    
    console.error(error);
    
    return null;
    
  }
  
  return data.user;
  
}


async function requireAuth() {
  
  const user =
    await getCurrentUser();
  
  if (!user) {
    
    const currentPath =
      window.location.pathname;
    
    if (
      currentPath.includes("/pages/")
    ) {
      
      window.location.href =
        "login.html";
      
    } else {
      
      window.location.href =
        "pages/login.html";
      
    }
    
    return null;
    
  }
  
  return user;
  
}


async function logout() {
  
  const {
    error
  } =
  await supabaseClient.auth.signOut();
  
  
  if (error) {
    
    console.error(error);
    
    return;
    
  }
  
  
  window.location.href =
    "login.html";
  
}