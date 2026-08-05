# 🛠️ Maalam Expert

**Plateforme de mise en relation entre clients et artisans au Maroc** — trouvez un plombier, électricien, serrurier ou peintre disponible près de chez vous, réservez une intervention, et payez en toute confiance.

[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.x%20(Mongoose)-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tests](https://img.shields.io/badge/tests-95%20passing-brightgreen?logo=jest&logoColor=white)](backend/__tests__)
[![Coverage](https://img.shields.io/badge/coverage-%E2%89%A580%25-brightgreen)](backend/jest.config.js)
[![License](https://img.shields.io/badge/license-Propri%C3%A9taire-lightgrey)](#-license)

> ⚠️ Les badges "Tests" et "Coverage" reflètent l'état de la suite au moment de la rédaction (`npm test` dans `backend/`) — ce ne sont **pas** des badges CI en direct, ce projet n'a pas encore de pipeline configuré (voir [Contributors](#-contributors)).

---

## Sommaire

- [📸 Screenshots](#-screenshots)
- [🚀 Quick start](#-quick-start)
- [📁 Project structure](#-project-structure)
- [🔧 Configuration](#-configuration)
- [📚 API Documentation](#-api-documentation)
- [🎨 Frontend components](#-frontend-components)
- [🐛 Troubleshooting](#-troubleshooting)
- [📝 License](#-license)
- [👥 Contributors](#-contributors)

---

## 📸 Screenshots

> Aucune capture d'écran n'est encore versionnée dans ce dépôt — ce README a été généré sans navigateur disponible pour en produire. Le tableau ci-dessous liste les emplacements à remplir : lancez l'app (voir [Quick start](#-quick-start)), déposez vos images dans `docs/screenshots/` avec les noms de fichiers indiqués, puis remplacez chaque ligne par `![Description](docs/screenshots/nom.png)`.

| Page | Fichier attendu | Contenu à capturer |
|---|---|---|
| Accueil | `docs/screenshots/home.png` | Hero, barre de recherche, artisans les mieux notés |
| Recherche | `docs/screenshots/search.png` | Liste filtrée par métier/ville avec résultats du seed |
| Fiche artisan | `docs/screenshots/artisan-detail.png` | Profil, avis, formulaire de réservation |
| Tableau de bord | `docs/screenshots/dashboard.png` | `WorkerDashboard` ou `ClientDashboard` après connexion |
| Blog | `docs/screenshots/blog.png` | Liste des articles + un article ouvert (sommaire, pub) |

```bash
# Backend (terminal 1)
cd backend && npm run dev

# Frontend (terminal 2)
cd frontend && npm run dev
```

---

## 🚀 Quick start

### Prérequis

| Outil | Version | Vérifier |
|---|---|---|
| [Node.js](https://nodejs.org/) | ≥ 18.x LTS | `node --version` |
| npm | ≥ 9.x (fourni avec Node) | `npm --version` |
| [MongoDB](https://www.mongodb.com/try/download/community) | 6.x/7.x, local **ou** [Atlas](https://www.mongodb.com/cloud/atlas/register) | — |
| [Git](https://git-scm.com/) | 2.x | `git --version` |
| [Docker](https://docs.docker.com/get-docker/) *(optionnel)* | 24.x+ | `docker --version` |

### Installation

```bash
git clone https://github.com/ismailsghiouri/saas-artisant.git maalam-expert
cd maalam-expert
```

#### 1. Backend (API Express + MongoDB)

```bash
cd backend
npm install
cp config/env.example .env       # puis renseignez vos valeurs (voir Configuration)
npm run seed                     # insère 6 artisans de démonstration
npm run dev                      # démarre sur http://localhost:5000
```

Vérifiez que l'API répond :

```bash
curl http://localhost:5000/api/health
```

#### 2. Frontend (React + Vite)

Dans un second terminal :

```bash
cd frontend
npm install
cp .env.example .env              # VITE_API_URL doit pointer vers le backend
npm run dev                       # démarre sur http://localhost:3000
```

Ouvrez [http://localhost:3000](http://localhost:3000) — les artisans du seed doivent apparaître dans la recherche.

### Alternative : tout lancer avec Docker

```bash
cp backend/config/env.example backend/.env
cp .env.example .env
docker compose up --build
```

Démarre `mongo` + `backend` (port 5000) + `frontend` (port 3000) en une seule commande. Voir [docker-compose.yml](docker-compose.yml).

### Lancer les tests

```bash
cd backend
npm test        # 95 tests, coverage ≥ 80% (seuil imposé dans jest.config.js)
```

---

## 📁 Project structure

```
maalam-expert/
├─ backend/                      # API Express + MongoDB (port 5000)
│  ├─ config/
│  │  ├─ database.js             # Connexion Mongoose (+ écouteurs d'événements)
│  │  └─ env.example             # Variables d'environnement backend (modèle)
│  ├─ controllers/                # Logique métier par domaine
│  │  ├─ workerController.js
│  │  ├─ clientController.js
│  │  ├─ reservationController.js
│  │  ├─ reviewController.js
│  │  └─ blogController.js
│  ├─ middleware/
│  │  ├─ auth.js                 # JWT : auth(), requireRole(), protectAdmin, generateToken
│  │  └─ validation.js           # Schémas Joi (validate, validateQuery)
│  ├─ models/                     # Schémas Mongoose
│  │  ├─ User.js                 # Schéma parent (discriminatorKey "role")
│  │  ├─ Worker.js  ├─ Client.js  # Discriminators (role="worker" / "client")
│  │  ├─ Reservation.js ├─ Review.js ├─ BlogPost.js ├─ Ad.js
│  ├─ routes/                     # Routeurs /api/* (auth, worker, client, reservation, review, blog)
│  ├─ scripts/seed.js             # Jeu de données artisans d'exemple
│  ├─ utils/
│  │  ├─ errorHandler.js         # AppError, asyncHandler, globalErrorHandler
│  │  ├─ email.js                # Envoi d'emails transactionnels (axios)
│  │  └─ sms.js                  # Notifications SMS artisans (axios)
│  ├─ __tests__/                  # Suite Jest + Supertest + mongodb-memory-server
│  ├─ Dockerfile
│  ├─ jest.config.js
│  └─ server.js                   # Point d'entrée
│
├─ frontend/                      # App React (Vite + Tailwind), port 3000
│  ├─ src/
│  │  ├─ components/              # Composants réutilisables (voir section dédiée)
│  │  ├─ pages/                   # Pages routées (React Router), dont WorkerDashboard/ClientDashboard
│  │  ├─ hooks/                   # useArtisans, useAuth (Provider + hook), useReservations
│  │  ├─ utils/                   # api.js (client HTTP), helpers.js
│  │  └─ styles/                  # CSS global + Tailwind
│  ├─ public/                     # logo.png, logo-mark.png, favicons
│  └─ Dockerfile
│
├─ blog_articles/                 # Brouillons d'articles SEO (source du blog)
├─ docs/brand/                    # Fichier source du logo (non servi par l'app)
├─ scripts/                       # Scripts utilitaires racine (réservé)
├─ docker-compose.yml             # backend + frontend + mongo
├─ .env.example                   # Variables lues par docker-compose
├─ FixNow_CdC.docx                # Cahier des charges (nom de fichier hérité, non renommé)
├─ FixNow_Architecture_Technique.docx
├─ FixNow_Guide_Setup.docx        # Guide de setup détaillé (captures, troubleshooting)
└─ Blog_SEO_Strategy.xlsx         # Stratégie de contenu blog/SEO
```

> Les trois documents `FixNow_*.docx` ont gardé leur nom de fichier et leur contenu d'origine (rédigés avant le renommage en "Maalam Expert") — seul le code et l'interface ont été rebrandés dans cette passe.

---

## 🔧 Configuration

### Backend — `backend/.env` (copié depuis `backend/config/env.example`)

| Variable | Description | Exemple |
|---|---|---|
| `NODE_ENV` | Environnement d'exécution | `development` / `production` / `test` |
| `PORT` | Port d'écoute de l'API | `5000` |
| `CLIENT_URL` | Origine(s) autorisée(s) par CORS (séparées par des virgules) | `http://localhost:3000` |
| `MONGODB_URI` | URI de connexion MongoDB | `mongodb://127.0.0.1:27017/maalam-expert` |
| `JWT_SECRET` | Clé de signature des tokens JWT | *(valeur aléatoire longue)* |
| `JWT_EXPIRES_IN` | Durée de validité des tokens | `7d` |
| `BCRYPT_SALT_ROUNDS` | Coût du hachage des mots de passe | `12` |
| `ADMIN_API_KEY` | Clé partagée protégeant les routes admin du blog (`x-admin-key`) | *(valeur secrète)* |
| `RATE_LIMIT_MAX_REQUESTS` / `RATE_LIMIT_WINDOW_MS` | Rate limiting global sur `/api` | `300` / `900000` |
| `AUTH_RATE_LIMIT_MAX_REQUESTS` / `AUTH_RATE_LIMIT_WINDOW_MS` | Rate limiting strict sur `/api/auth/login` et `/api/auth/signup/*` | `20` / `900000` |
| `EMAIL_API_URL` / `EMAIL_API_KEY` / `EMAIL_FROM_ADDRESS` | Passerelle email transactionnel (ex. Resend) | — |
| `SMS_API_URL` / `SMS_API_KEY` / `SMS_SENDER_ID` | Passerelle SMS (notifications artisans) | — |

> Générer un `JWT_SECRET` fort : `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

Si votre `MONGODB_URI` est une URI `mongodb+srv://` (MongoDB Atlas), `config/database.js` force en interne un résolveur DNS public (8.8.8.8 / 1.1.1.1) en repli : sur certains réseaux (VPN, adaptateurs virtuels), le résolveur DNS système répond correctement à `nslookup` mais pas aux requêtes SRV du résolveur interne de Node, ce qui provoque une erreur `querySrv ECONNREFUSED` sans ce contournement.

### Frontend — `frontend/.env` (copié depuis `frontend/.env.example`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | URL de base de l'API (ex. `http://localhost:5000/api`) |
| `VITE_ADSENSE_CLIENT_ID` | Identifiant client Google AdSense (`ca-pub-...`) — laissé vide, un placeholder neutre s'affiche à la place des publicités |

> ⚠️ Vite inline les variables `VITE_*` **au moment du build**, pas au runtime. Toute modification nécessite de relancer `npm run dev` (ou un nouveau `npm run build` en production).

### Docker Compose — `.env` racine (copié depuis `.env.example`)

| Variable | Description |
|---|---|
| `CLIENT_URL` | Doit correspondre au port publié du service `frontend` |
| `VITE_API_URL` / `VITE_ADSENSE_CLIENT_ID` | Passées en *build args* au service `frontend` |

---

## 📚 API Documentation

Base URL : `http://localhost:5000/api` — 🔒 = authentification JWT requise (`Authorization: Bearer <token>`) · 🔐 = clé admin requise (`x-admin-key`).

### Authentification — `/api/auth`

| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| POST | `/signup/worker` | Public | Inscription artisan (non vérifié par défaut) |
| POST | `/signup/client` | Public | Inscription client |
| POST | `/login` | Public | Connexion (email/mot de passe), retourne un JWT `{ id, email, role }` |
| GET | `/me` | 🔒 | Profil complet de l'utilisateur connecté (worker ou client) |
| POST | `/logout` | 🔒 | Confirme la déconnexion (JWT sans état, rien à invalider côté serveur) |

### Artisans — `/api/workers`

| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| GET | `/me` | 🔒 worker | Profil complet de l'artisan connecté |
| PUT | `/me` | 🔒 worker | Mise à jour du profil |
| PUT | `/:id` | 🔒 worker (soi-même) | Mise à jour RESTful explicite par id (403 si `:id` ≠ token) |
| PATCH | `/me/availability` | 🔒 worker | Bascule disponible / indisponible |
| POST | `/me/verification` | 🔒 worker | Soumission des documents de vérification |
| GET | `/reservations` | 🔒 worker | Réservations assignées à l'artisan |
| PUT | `/upgrade-premium` | 🔒 worker | Active le statut premium sur son propre profil |
| GET | `/analytics` | 🔒 worker | Indicateurs d'activité (réservations, revenu, note...) |
| GET | `/top-rated` | Public | Classement des artisans les mieux notés |
| GET | `/` | Public | Recherche paginée (`category`, `city`, `lat`/`lng`/`radiusKm`, `minRating`, `page`, `limit`) |
| GET | `/:id` | Public | Détail public d'un artisan |
| GET | `/:id/reviews` | Public | Avis publiés pour cet artisan |

### Clients — `/api/clients`

| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| GET | `/me` | 🔒 client | Profil du client connecté (favoris et avis postés inclus) |
| PUT | `/me` | 🔒 client | Mise à jour du profil |
| GET | `/reservations` | 🔒 client | Historique des réservations du client |
| GET | `/favorites` | 🔒 client | Liste des artisans favoris |
| PATCH | `/me/favorites/:workerId` | 🔒 client | Ajoute/retire un artisan des favoris (toggle) |

### Réservations — `/api/reservations`

| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| POST | `/` | 🔒 client | Crée une demande d'intervention |
| GET | `/available` | 🔒 worker (vérifié) | Demandes `pending` proches, correspondant au métier |
| GET | `/:id` | 🔒 propriétaire ou assigné | Détail d'une réservation |
| PATCH | `/:id/accept` | 🔒 worker (vérifié) | Accepte une demande `pending` → `assigned` |
| PATCH | `/:id/start` | 🔒 worker assigné | Démarre l'intervention → `in_progress` |
| PATCH | `/:id/complete` | 🔒 worker assigné | Clôture l'intervention → `completed` |
| PATCH | `/:id/cancel` | 🔒 client ou worker | Annule (règles différentes selon le rôle) |
| PUT | `/:id/confirm` | 🔒 worker | Alias REST de `accept` |
| PUT | `/:id/complete` | 🔒 worker | Alias REST de `complete` |
| DELETE | `/:id` | 🔒 client ou worker | Alias REST de `cancel` |

### Avis — `/api/reviews`

| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| POST | `/` | 🔒 client | Note une intervention `completed` |
| GET | `/` | Public | Liste via `?worker_id=...` |
| GET | `/worker/:workerId` | Public | Avis publiés pour un artisan |
| PUT | `/:id` | 🔒 client (auteur) | Modifie son propre avis |
| DELETE | `/:id` | 🔒 client (auteur) | Supprime son propre avis |

### Blog — `/api/blog`

| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| GET | `/` | Public | Liste paginée (`category`, `city`, `q`) |
| GET | `/search` | Public | Alias de `/` |
| GET | `/categories` | Public | Catégories distinctes utilisées |
| GET | `/:slug` | Public | Détail d'un article (incrémente `viewsCount`, tracking AdSense) |
| POST | `/` | 🔐 admin | Crée un article |
| PUT | `/:id` | 🔐 admin | Modifie un article |
| DELETE | `/:id` | 🔐 admin | Supprime un article |

### Divers

| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| GET | `/api/health` | Public | Vérification de santé (statut DB, uptime) |

---

## 🎨 Frontend components

### Pages (`src/pages/`)

| Page | Route | Description |
|---|---|---|
| `HomePage` | `/` | Accueil : recherche rapide + artisans les mieux notés |
| `SearchPage` | `/recherche` | Recherche/filtrage complet (`ArtisanList`) |
| `ArtisanProfilePage` | `/artisans/:id` | Fiche artisan détaillée + formulaire de réservation |
| `WorkerDashboard` / `ClientDashboard` | `/dashboard` 🔒 | Tableau de bord dédié au rôle connecté (stats, réservations, profil, favoris/avis) |
| `MyReservationsPage` | `/mes-reservations` 🔒 | Historique et actions (annuler, noter) sur ses réservations |
| `BlogPage` | `/blog` | Liste des articles, filtrable par catégorie |
| `BlogPostPage` | `/blog/:slug` | Article complet (sommaire, publicités, articles liés) |
| `AdminDashboard` | `/admin` | Back-office de gestion du blog (clé admin) |

### Composants (`src/components/`)

| Composant | Rôle |
|---|---|
| `Navbar` | Navigation principale, bascule thème clair/sombre, ouverture de `LoginModal` |
| `Footer` | Pied de page (liens, mentions) |
| `LoginModal` | Sélecteur de rôle (artisan/client) + inscription/connexion |
| `SearchBar` | Barre de recherche (métier, ville) réutilisée en hero et en page recherche |
| `ArtisanList` | Liste filtrable d'artisans + emplacement publicitaire |
| `ArtisanCard` | Carte artisan (note, métier, ville) dans les listes |
| `ArtisanDetail` | Fiche complète d'un artisan (avis inclus) + `ReservationForm` |
| `ReservationForm` | Formulaire de création de demande d'intervention |
| `ReviewForm` | Formulaire de notation d'une intervention terminée |
| `BlogArticleCard` | Carte article dans les listes du blog |
| `BlogArticle` | Rendu complet d'un article (sommaire auto-généré, temps de lecture, pub) |
| `AdSlot` | Emplacement Google AdSense, avec repli neutre si non configuré |

### Hooks (`src/hooks/`)

| Module | Rôle |
|---|---|
| `useAuth` | `AuthProvider` + `useAuth()` : session utilisateur (token, user, `isWorker`/`isClient`, login/register/logout) |
| `useArtisans(filters)` | Chargement de la liste d'artisans, recharge auto sur changement de filtres |
| `useReservations()` | Réservations de l'utilisateur connecté, adapté à son rôle (client/worker) |

---

## 🐛 Troubleshooting

| Symptôme | Cause probable | Solution |
|---|---|---|
| `MongoServerSelectionError` / `ECONNREFUSED 127.0.0.1:27017` | MongoDB local non démarré, ou `MONGODB_URI` incorrect | Démarrer `mongod`, ou vérifier l'URI Atlas et l'autorisation IP |
| `querySrv ECONNREFUSED` au démarrage du backend | Résolveur DNS système inatteignable par Node malgré une connectivité réseau normale (fréquent sous VPN/Windows) | Déjà contourné automatiquement dans `config/database.js` pour les URI `mongodb+srv://` ; sinon vérifier la configuration DNS de la machine |
| Erreur CORS dans la console navigateur | `CLIENT_URL` backend ≠ origine réelle du frontend | Vérifier `backend/.env` (`CLIENT_URL=http://localhost:3000`), redémarrer le backend |
| `EADDRINUSE: address already in use :::5000` | Un autre process utilise déjà le port | Changer `PORT` dans `backend/.env`, ou arrêter le process existant |
| `401 Token invalide` / session expirée | `JWT_SECRET` changé après émission du token, ou token expiré | Se reconnecter ; ne pas changer `JWT_SECRET` une fois des tokens émis |
| `429 Too Many Requests` sur `/api/auth/login` ou `/signup/*` | Rate limiting anti-brute-force déclenché | Attendre la fenêtre (`AUTH_RATE_LIMIT_WINDOW_MS`), ou l'ajuster en dev |
| Aucun résultat dans la recherche d'artisans | Base de données vide | `cd backend && npm run seed` |
| `npm install` échoue sur Windows (erreurs `node-gyp`) | Outils de build natifs manquants | Installer les Build Tools Visual Studio, ou utiliser Node.js LTS récent |
| Emplacement publicitaire vide en production | `VITE_ADSENSE_CLIENT_ID` non renseigné avant le build | Renseigner la variable puis relancer `npm run build` (Vite l'inline au build) |
| `npm test` lent ou échoue au premier lancement | `mongodb-memory-server` télécharge le binaire MongoDB (réseau requis) | Relancer une fois le téléchargement terminé ; vérifier l'accès réseau/proxy |
| Container Docker en boucle de redémarrage | Variables manquantes dans `backend/.env` (non copié) | `cp backend/config/env.example backend/.env` avant `docker compose up` |

Pour une procédure de setup pas à pas plus détaillée (avec emplacements de captures d'écran), voir **[FixNow_Guide_Setup.docx](FixNow_Guide_Setup.docx)** *(nom de fichier hérité, contenu non mis à jour depuis le renommage en Maalam Expert)*.

---

## 📝 License

Ce projet est actuellement **propriétaire** (`"license": "UNLICENSED"`, `"private": true` dans `backend/package.json` et `frontend/package.json`) — tous droits réservés, aucun fichier `LICENSE` n'est encore publié dans ce dépôt.

Si vous souhaitez open-sourcer Maalam Expert, ajoutez un fichier `LICENSE` à la racine (ex. MIT, Apache-2.0) et mettez à jour le champ `license` des deux `package.json` en conséquence.

---

## 👥 Contributors

| Contributeur | Rôle |
|---|---|
| [Ismail Sghiouri](https://github.com/ismailsghiouri) | Auteur & mainteneur principal |

Ce projet n'a pas encore de guide de contribution formel (`CONTRIBUTING.md`) ni de pipeline CI. Pour proposer un changement :

1. Ouvrez une issue décrivant le problème ou la fonctionnalité.
2. Créez une branche depuis `master`.
3. Assurez-vous que `npm test` passe (`backend/`) avant d'ouvrir une pull request.

---

<p align="center">Fait avec ❤️ pour connecter les artisans marocains à leurs clients.</p>
