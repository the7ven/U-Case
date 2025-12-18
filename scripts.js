
const hamburger = document.querySelector(".hamburger");
const mobileMenu = document.querySelector(".mobile-menu");



// Menu hamburger
hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("active");
  mobileMenu.classList.toggle("active");
});

// Fermer le menu en cliquant sur un lien
mobileMenu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    hamburger.classList.remove("active");
    mobileMenu.classList.remove("active");
  });
});



 // IMPORTANT: Remplace ce numéro par ton propre numéro WhatsApp
        const WHATSAPP_NUMBER = '237651487883'; // Format: code pays + numéro
        
        function commanderWhatsApp(produit, prix) {
            // Message personnalisé pour WhatsApp
            const message = `Bonjour! Je suis intéressé(e) par le produit suivant:%0A%0A📦 *${produit}*%0A💰 Prix: ${prix}%0A%0AMerci de me contacter pour finaliser ma commande.`;
            
            // Ouvre WhatsApp avec le message pré-rempli
            window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
        }