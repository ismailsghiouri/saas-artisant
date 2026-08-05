const fs = require('fs');

const file = 'frontend/src/i18n.js';
let content = fs.readFileSync(file, 'utf8');

// We will do a simple string replacement to inject new keys.
// Find the end of 'fr', 'en', 'ar' translation objects and insert new keys.

const frNew = `
      search: {
        title: "Trouver un artisan",
        subtitle: "Filtrez par métier, ville ou note pour trouver le professionnel qu'il vous faut.",
        placeholder: "🔍 Rechercher un artisan par nom ou ville...",
        allProfessions: "Tous les métiers",
        cityPlaceholder: "Ville",
        allRatings: "Toutes les notes",
        rating4: "4★ et plus",
        rating3: "3★ et plus",
        loading: "Chargement des artisans...",
        noResults: "Aucun artisan ne correspond à votre recherche pour le moment.",
        premium: "🌟 Artisans Premium",
        others: "Autres artisans",
        prev: "Précédent",
        next: "Suivant",
        page: "Page"
      },
      clientDash: {
        title: "Tableau de bord client",
        subtitle: "Bonjour {{name}}, retrouvez vos demandes et vos artisans favoris.",
        activeReservations: "Réservations actives",
        favoriteArtisans: "Artisans favoris",
        reviewsPosted: "Avis postés",
        myReservations: "Mes réservations",
        noReservations: "Aucune réservation pour le moment.",
        artisanToConfirm: "Artisan à confirmer",
        cancel: "Annuler",
        message: "Messager",
        leaveReview: "Laisser un avis",
        myFavorites: "Mes favoris",
        noFavorites: "Vous n'avez pas encore d'artisan favori. Ajoutez-en un depuis sa fiche profil.",
        book: "Réserver",
        remove: "Retirer",
        myProfile: "Mon profil",
        fullName: "Nom complet",
        phone: "Téléphone",
        city: "Ville",
        address: "Adresse sauvegardée",
        save: "Enregistrer",
        saving: "Enregistrement...",
        reviewsSection: "Avis que j'ai postés",
        noReviews: "Vous n'avez pas encore publié d'avis.",
        edit: "Modifier",
        delete: "Supprimer",
        messagesSection: "Messages",
        messagesText: "La messagerie intégrée avec vos artisans arrive bientôt. En attendant, contactez-les par téléphone depuis vos réservations."
      },`;

const enNew = `
      search: {
        title: "Find a pro",
        subtitle: "Filter by trade, city or rating to find the professional you need.",
        placeholder: "🔍 Search a pro by name or city...",
        allProfessions: "All trades",
        cityPlaceholder: "City",
        allRatings: "All ratings",
        rating4: "4★ and up",
        rating3: "3★ and up",
        loading: "Loading pros...",
        noResults: "No pros match your search at the moment.",
        premium: "🌟 Premium Pros",
        others: "Other pros",
        prev: "Previous",
        next: "Next",
        page: "Page"
      },
      clientDash: {
        title: "Client Dashboard",
        subtitle: "Hello {{name}}, find your requests and favorite pros.",
        activeReservations: "Active reservations",
        favoriteArtisans: "Favorite pros",
        reviewsPosted: "Reviews posted",
        myReservations: "My reservations",
        noReservations: "No reservations yet.",
        artisanToConfirm: "Pro to confirm",
        cancel: "Cancel",
        message: "Message",
        leaveReview: "Leave a review",
        myFavorites: "My favorites",
        noFavorites: "You have no favorite pros yet. Add one from their profile.",
        book: "Book",
        remove: "Remove",
        myProfile: "My profile",
        fullName: "Full name",
        phone: "Phone",
        city: "City",
        address: "Saved address",
        save: "Save",
        saving: "Saving...",
        reviewsSection: "My reviews",
        noReviews: "You haven't posted any reviews yet.",
        edit: "Edit",
        delete: "Delete",
        messagesSection: "Messages",
        messagesText: "In-app messaging is coming soon. In the meantime, contact them by phone from your reservations."
      },`;

const arNew = `
      search: {
        title: "ابحث عن حرفي",
        subtitle: "قم بالتصفية حسب المهنة أو المدينة أو التقييم للعثور على المحترف الذي تحتاجه.",
        placeholder: "🔍 ابحث عن حرفي بالاسم أو المدينة...",
        allProfessions: "جميع المهن",
        cityPlaceholder: "المدينة",
        allRatings: "جميع التقييمات",
        rating4: "4★ فما فوق",
        rating3: "3★ فما فوق",
        loading: "جاري تحميل الحرفيين...",
        noResults: "لا يوجد حرفي يطابق بحثك في الوقت الحالي.",
        premium: "🌟 حرفيون متميزون",
        others: "حرفيون آخرون",
        prev: "السابق",
        next: "التالي",
        page: "صفحة"
      },
      clientDash: {
        title: "لوحة تحكم الزبون",
        subtitle: "مرحباً {{name}}، اعثر على طلباتك وحرفييك المفضلين.",
        activeReservations: "الحجوزات النشطة",
        favoriteArtisans: "الحرفيون المفضلون",
        reviewsPosted: "التقييمات المنشورة",
        myReservations: "حجوزاتي",
        noReservations: "لا توجد حجوزات في الوقت الحالي.",
        artisanToConfirm: "حرفي قيد التأكيد",
        cancel: "إلغاء",
        message: "مراسلة",
        leaveReview: "اترك تقييماً",
        myFavorites: "مفضلاتي",
        noFavorites: "ليس لديك حرفيون مفضلون بعد. أضف واحداً من ملفه الشخصي.",
        book: "حجز",
        remove: "إزالة",
        myProfile: "ملفي الشخصي",
        fullName: "الاسم الكامل",
        phone: "الهاتف",
        city: "المدينة",
        address: "العنوان المحفوظ",
        save: "حفظ",
        saving: "جاري الحفظ...",
        reviewsSection: "التقييمات التي نشرتها",
        noReviews: "لم تنشر أي تقييمات بعد.",
        edit: "تعديل",
        delete: "حذف",
        messagesSection: "الرسائل",
        messagesText: "نظام المراسلة قادم قريباً. في غضون ذلك، تواصل معهم هاتفياً من خلال حجوزاتك."
      },`;

content = content.replace(/(devenirArtisan:\s*\{[\s\S]*?\n\s*\})/, '$1,\n' + frNew);
content = content.replace(/(devenirArtisan:\s*\{[\s\S]*?\n\s*\})(?=.*ar:)/, '$1,\n' + enNew);
// The regex above for 'en' might match 'fr' again if not careful.
// Let's do it safely by matching the end of 'devenirArtisan' block inside 'fr', 'en', 'ar'
// Actually, easier to use replace with a counter:
let count = 0;
content = content.replace(/(devenirArtisan:\s*\{[\s\S]*?\n\s*\})/g, (match) => {
  count++;
  if (count === 1) return match + ',' + frNew;
  if (count === 2) return match + ',' + enNew;
  if (count === 3) return match + ',' + arNew;
  return match;
});

fs.writeFileSync(file, content);
console.log('i18n updated successfully!');
