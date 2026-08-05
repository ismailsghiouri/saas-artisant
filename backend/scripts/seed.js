/**
 * scripts/seed.js
 * -----------------------------------------------------------------------------
 * Graine la base de données MongoDB avec des artisans par défaut pour CHAQUE
 * ville du Maroc et CHAQUE catégorie de métier.
 *
 * Usage : npm run seed (depuis le dossier backend/)
 * -----------------------------------------------------------------------------
 */

require('dns').setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();
const mongoose = require('mongoose');
const Worker = require('../models/Worker');

const MOROCCAN_CITIES = [
  { name: 'Casablanca', coords: [-7.5898, 33.5731] },
  { name: 'Rabat', coords: [-6.8498, 34.0209] },
  { name: 'Salé', coords: [-6.8166, 34.0333] },
  { name: 'Marrakech', coords: [-7.9811, 31.6295] },
  { name: 'Fès', coords: [-5.0003, 34.0331] },
  { name: 'Tanger', coords: [-5.8340, 35.7595] },
  { name: 'Agadir', coords: [-9.5981, 30.4278] },
  { name: 'Meknès', coords: [-5.5407, 33.8935] },
  { name: 'Oujda', coords: [-1.9086, 34.6814] },
  { name: 'Kénitra', coords: [-6.5802, 34.2610] },
  { name: 'Tétouan', coords: [-5.3684, 35.5889] },
  { name: 'Nador', coords: [-2.9287, 35.1681] },
  { name: 'Mohammedia', coords: [-7.3828, 33.6866] },
  { name: 'El Jadida', coords: [-8.5083, 33.2316] },
  { name: 'Safi', coords: [-9.2372, 32.2994] },
  { name: 'Béni Mellal', coords: [-6.3498, 32.3373] },
  { name: 'Laâyoune', coords: [-13.2033, 27.1536] },
  { name: 'Dakhla', coords: [-15.9380, 23.6848] },
  { name: 'Errachidia', coords: [-4.4268, 31.9318] },
  { name: 'Taza', coords: [-4.0100, 34.2100] },
  { name: 'Essaouira', coords: [-9.7595, 31.5125] },
  { name: 'Khouribga', coords: [-6.9063, 32.8811] },
  { name: 'Settat', coords: [-7.6163, 33.0016] },
  { name: 'Al Hoceïma', coords: [-3.9317, 35.2517] },
  { name: 'Ksar El Kebir', coords: [-5.9039, 35.0017] },
  { name: 'Larache', coords: [-6.1558, 35.1932] },
  { name: 'Guelmim', coords: [-10.0574, 28.9870] },
  { name: 'Taroudant', coords: [-8.8770, 30.4703] },
  { name: 'Berkane', coords: [-2.3258, 34.9211] },
  { name: 'Ouarzazate', coords: [-6.8934, 30.9189] },
];

const CATEGORIES_CONFIG = {
  plombier: {
    label: 'Plombier',
    services: ['Réparation fuite', 'Débouchage canalisation', 'Installation sanitaire', 'Chauffe-eau'],
    priceMin: 80,
    priceMax: 160,
  },
  electricien: {
    label: 'Électricien',
    services: ['Installation électrique', 'Mise aux normes', 'Dépannage panne de courant', 'Tableau électrique'],
    priceMin: 70,
    priceMax: 150,
  },
  serrurier: {
    label: 'Serrurier',
    services: ['Ouverture de porte claquée', 'Changement de serrure', 'Blindage de porte', 'Reproduction clés'],
    priceMin: 90,
    priceMax: 180,
  },
  peintre: {
    label: 'Peintre',
    services: ['Peinture intérieure', 'Peinture façade', 'Enduit & Ponçage', 'Décoration Tadelakt'],
    priceMin: 60,
    priceMax: 120,
  },
  menuisier: {
    label: 'Menuisier',
    services: ['Meubles sur mesure', 'Portes & Fenêtres', 'Placards & Dressing', 'Pose parquet'],
    priceMin: 85,
    priceMax: 170,
  },
  climatisation: {
    label: 'Climatisation',
    services: ['Installation climatiseur', 'Entretien annuel', 'Recharge gaz R410', 'Dépannage clim'],
    priceMin: 100,
    priceMax: 200,
  },
  electromenager: {
    label: 'Électroménager',
    services: ['Réparation machine à laver', 'Dépannage réfrigérateur', 'Lave-vaisselle', 'Four & Cuisinière'],
    priceMin: 75,
    priceMax: 140,
  },
  macon: {
    label: 'Maçon',
    services: ['Travaux de maçonnerie', 'Démolition cloison', 'Carrelage & Faïence', 'Gros œuvre'],
    priceMin: 90,
    priceMax: 190,
  },
  autre: {
    label: 'Artisan Polyvalent',
    services: ['Bricolage général', 'Montage meuble', 'Petits travaux domestiques', 'Rénovation rapide'],
    priceMin: 50,
    priceMax: 110,
  },
};

const FIRST_NAMES = [
  'Youssef', 'Rachid', 'Karim', 'Hicham', 'Mohamed', 'Amine', 'Omar', 'Zakaria',
  'Mehdi', 'Tarik', 'Adil', 'Hamza', 'Bilal', 'Said', 'Hassan', 'Khalid',
  'Mustapha', 'Reda', 'Soufiane', 'Othmane', 'Amina', 'Nadia', 'Fatima', 'Houda'
];

const LAST_NAMES = [
  'El Amrani', 'Bennani', 'Tazi', 'Idrissi', 'Ouazzani', 'Chraibi', 'Berrada',
  'Benjelloun', 'Kabbaj', 'Slaoui', 'Alaoui', 'Filali', 'Cherkaoui', 'Lahlou',
  'Mansouri', 'Jabri', 'Kadiri', 'Naciri', 'Rahmouni', 'Zahraoui'
];

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

function getRandomItem(arr, index) {
  return arr[index % arr.length];
}

const seed = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI manquant dans le fichier backend/.env.');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log(`✅ Connecté à MongoDB (${mongoose.connection.name})`);

  let created = 0;
  let skipped = 0;
  let counter = 0;

  const categories = Object.keys(CATEGORIES_CONFIG);

  for (const cityObj of MOROCCAN_CITIES) {
    for (const category of categories) {
      counter++;
      const firstName = getRandomItem(FIRST_NAMES, counter);
      const lastName = getRandomItem(LAST_NAMES, counter * 3);
      const fullName = `${firstName} ${lastName}`;
      const citySlug = slugify(cityObj.name);
      const email = `maalam.${category}.${citySlug}@maalam-expert.ma`;

      const existing = await Worker.findOne({ email });
      if (existing) {
        skipped++;
        continue;
      }

      const config = CATEGORIES_CONFIG[category];
      const yearsExp = 3 + (counter % 13);
      const phoneDigit = String(10000000 + (counter * 3737) % 89999999).padStart(8, '0');

      const workerData = {
        name: fullName,
        email: email,
        password: 'Password123!',
        phone: `06${phoneDigit}`,
        category: category,
        services: config.services,
        city: cityObj.name,
        location: {
          type: 'Point',
          coordinates: cityObj.coords,
        },
        description: `Expert ${config.label} qualifié à ${cityObj.name} avec ${yearsExp} ans d'expérience. Intervention rapide et devis gratuit.`,
        yearsExperience: yearsExp,
        priceEstimateRange: { min: config.priceMin, max: config.priceMax },
        rating: +(4.2 + ((counter % 9) * 0.09)).toFixed(1),
        totalReviews: 8 + (counter % 45),
        completedJobsCount: 15 + (counter % 80),
        isAvailable: true,
        isPremium: counter % 5 === 0,
        verificationStatus: 'verified',
        status: 'active',
      };

      await Worker.create(workerData);
      created++;
    }
  }

  console.log(`🎉 Seed réussi : ${created} artisan(s) créé(s) (${MOROCCAN_CITIES.length} villes x ${categories.length} catégories), ${skipped} déjà existant(s).`);
  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((error) => {
  console.error('❌ Échec du seed :', error.message);
  process.exit(1);
});
