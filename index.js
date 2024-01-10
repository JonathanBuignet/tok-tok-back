require("dotenv").config();

const path = require("path");
const cors = require("cors");
const express = require("express");
const middleware404 = require("./app/middlewares/middleware404");
const router = require("./app/router");
const socket = require("./socket/index");

const app = express();

/**
 * Autorise les requêtes provenant de n'importe quelle origine (localhost, herokuapp, etc.)
 * @see https://www.npmjs.com/package/cors#simple-usage-enable-all-cors-requests
 */
app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static("public"));

app.use(router);

// Définir le chemin vers le dossier "media" (similaire à 'document_root' dans Django)
const mediaPath = path.join(__dirname, "/media");
console.log(mediaPath, __dirname);

// Middleware pour servir les fichiers statiques depuis le dossier "media"
app.use("/media", express.static(mediaPath));

app.use(middleware404);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
