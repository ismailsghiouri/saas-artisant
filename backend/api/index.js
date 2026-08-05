/**
 * api/index.js
 * -----------------------------------------------------------------------------
 * Point d'entrée serverless pour Vercel : une fonction Express classique est
 * elle-même un handler (req, res) valide, donc exporter l'app directement
 * suffit — Vercel (voir vercel.json à la racine du backend) route toutes les
 * requêtes vers cette fonction en conservant l'URL d'origine, qu'Express
 * route ensuite en interne exactement comme en local/Docker.
 * -----------------------------------------------------------------------------
 */

module.exports = require('../server');
