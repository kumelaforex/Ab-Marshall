// =========================================
// AB MARSHALL FOREX CHALLENGE
// APP.JS
// GLOBAL NAVIGATION
// =========================================


// =========================================
// APP START
// =========================================

document.addEventListener("DOMContentLoaded", () => {
  
  setupMobileNavigation();
  setupActiveNavigation();
  
});


// =========================================
// MOBILE NAVIGATION
// =========================================

function setupMobileNavigation() {
  
  const menuBtn =
    document.getElementById("menuBtn");
  
  const sidebar =
    document.getElementById("sidebar");
  
  
  // -----------------------------------------
  // ELEMENTS CHECK
  // -----------------------------------------
  
  if (!menuBtn || !sidebar) {
    return;
  }
  
  
  // -----------------------------------------
  // MENU BUTTON
  // -----------------------------------------
  
  menuBtn.addEventListener("click", event => {
    
    event.preventDefault();
    event.stopPropagation();
    
    const isOpen =
      sidebar.classList.toggle("open");
    
    
    // Accessibility
    menuBtn.setAttribute(
      "aria-expanded",
      isOpen ? "true" : "false"
    );
    
    menuBtn.setAttribute(
      "aria-label",
      isOpen ?
      "Close menu" :
      "Open menu"
    );
    
  });
  
  
  // -----------------------------------------
  // NAVIGATION LINKS
  // -----------------------------------------
  
  const navLinks =
    sidebar.querySelectorAll(".nav-link");
  
  
  navLinks.forEach(link => {
    
    link.addEventListener("click", () => {
      
      closeMobileNavigation(
        sidebar,
        menuBtn
      );
      
    });
    
  });
  
  
  // -----------------------------------------
  // CLICK OUTSIDE SIDEBAR
  // -----------------------------------------
  
  document.addEventListener("click", event => {
    
    if (
      !sidebar.classList.contains("open")
    ) {
      return;
    }
    
    
    const clickedInsideSidebar =
      sidebar.contains(event.target);
    
    const clickedMenuButton =
      menuBtn.contains(event.target);
    
    
    if (
      !clickedInsideSidebar &&
      !clickedMenuButton
    ) {
      
      closeMobileNavigation(
        sidebar,
        menuBtn
      );
      
    }
    
  });
  
  
  // -----------------------------------------
  // ESCAPE KEY
  // -----------------------------------------
  
  document.addEventListener("keydown", event => {
    
    if (event.key !== "Escape") {
      return;
    }
    
    
    if (
      sidebar.classList.contains("open")
    ) {
      
      closeMobileNavigation(
        sidebar,
        menuBtn
      );
      
    }
    
  });
  
  
  // -----------------------------------------
  // WINDOW RESIZE
  // -----------------------------------------
  
  window.addEventListener(
    "resize",
    () => {
      
      if (window.innerWidth > 700) {
        
        closeMobileNavigation(
          sidebar,
          menuBtn
        );
        
      }
      
    }
  );
  
}


// =========================================
// CLOSE MOBILE NAVIGATION
// =========================================

function closeMobileNavigation(
  sidebar,
  menuBtn
) {
  
  if (!sidebar || !menuBtn) {
    return;
  }
  
  
  sidebar.classList.remove("open");
  
  
  menuBtn.setAttribute(
    "aria-expanded",
    "false"
  );
  
  menuBtn.setAttribute(
    "aria-label",
    "Open menu"
  );
  
}


// =========================================
// ACTIVE NAVIGATION
// =========================================

function setupActiveNavigation() {
  
  const navLinks =
    document.querySelectorAll(
      ".nav-link"
    );
  
  
  if (!navLinks.length) {
    return;
  }
  
  
  // -----------------------------------------
  // CURRENT PAGE
  // -----------------------------------------
  
  let currentPage =
    window.location.pathname
    .split("/")
    .pop()
    .toLowerCase();
  
  
  // -----------------------------------------
  // DEFAULT PAGE
  // -----------------------------------------
  
  if (!currentPage) {
    currentPage = "dashboard.html";
  }
  
  
  // -----------------------------------------
  // UPDATE ACTIVE LINK
  // -----------------------------------------
  
  navLinks.forEach(link => {
    
    const href =
      link
      .getAttribute("href")
      ?.split("/")
      .pop()
      .toLowerCase();
    
    
    link.classList.remove(
      "active"
    );
    
    
    if (
      href &&
      href === currentPage
    ) {
      
      link.classList.add(
        "active"
      );
      
    }
    
  });
  
}