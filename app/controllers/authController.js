const bcrypt = require("bcrypt");
const validator = require("email-validator");
const { v4: uuidv4 } = require("uuid");
//const zxcvbn = require("zxcvbn");

const jwt = require("jsonwebtoken");

const { User } = require("../models/index");

const authController = {
  signup: async (req, res) => {
    try {
      const {
        firstname,
        lastname,
        address,
        city,
        longitude,
        latitude,
        email,
        password,
        confirmation,
      } = req.body;

      //! NOUVEAU
      if (
        !firstname.trim() ||
        !lastname.trim() ||
        !address.trim() ||
        !city.trim() ||
        !longitude.trim() ||
        !latitude.trim() ||
        !email.trim() ||
        !password.trim() ||
        !confirmation.trim()
      ) {
        res
          .status(400)
          .json({ error: "Tous les champs doivent être renseignés" });
        return;
      }

      if (password !== confirmation) {
        res
          .status(400)
          .json({ error: "Les deux mots de passe ne correspondent pas" });
        return;
      }

      if (!validator.validate(email)) {
        res.status(400).json({ error: "Le format de l'email est invalide" });
        return;
      }

      const existingEmail = await User.findOne({
        where: {
          email: email,
        },
      });

      if (existingEmail) {
        res
          .status(400)
          .json({ error: "Cet email est déjà associé à un compte" });
        return;
      }

      //* on le retire tant qu'on ne sait pas à quoi correspond le score (pas cool pour l'ux si pas d'indications), voire on fait notre propre fonction
      // const passwordStrength = zxcvbn(password);
      // if (passwordStrength.score < 1) {
      //   res
      //     .status(400)
      //     .json({ errorMessage: "Le mot de passe est trop faible." });
      //   return;
      // }

      const saltRounds = parseInt(process.env.SALT_ROUNDS);
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const user = await User.create({
        firstname,
        lastname,
        description: "",
        address,
        city,
        longitude,
        latitude,
        email: email.toLowerCase(),
        password: hashedPassword,
        slug: `${firstname.toLowerCase()}-${lastname.toLowerCase()}-${uuidv4()}`,
        thumbnail: `${req.protocol}://${req.get(
          "host"
        )}/images/default-profile-picture.png`,
        banner: `${req.protocol}://${req.get(
          "host"
        )}/images/default-banner-picture.png`,
      });

      const token = jwt.sign({ userId: user.id }, process.env.SECRETTOKEN, {
        expiresIn: process.env.EXPIREDATETOKEN,
      });


      const userObj = {
        ...user.dataValues,
      };
      delete userObj.password;
      // delete userObj.longitude;
      // delete userObj.latitude;

      res.status(201).json({
        message: "Compte crée",
        auth: true,
        token: token,
        user: userObj,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({error: "Erreur Serveur !"})
    }
    
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // On cherche un utilisateur qui correspond à l'email
      const user = await User.findOne({
        where: { email: email.toLowerCase() }
      });      

      if (!user) {
        return res
          .status(400)
          .json({ error: "Mauvais couple email/password" });
      }
      
      // On compare le mot de passe enregistré et celui entré
      const isMatching = await bcrypt.compare(password, user.password);
      if (!isMatching) {
        return res.status(400).json({ error: "Mauvais couple email/password" });
      }

      // A chaque connexion, le user reçoit un token que l'on mettra en en-tête 
      // des requêtes HTTP sur les routes où il faut être loggué/authentifié
      const token = jwt.sign({ userId: user.id }, process.env.SECRETTOKEN, {
        expiresIn: process.env.EXPIREDATETOKEN,
      });

      // On créer un objet pour stocker les information de l'utilisateur 
      // à transmettre au front
      const userObj = {
        ...user.dataValues,
      };
      // Et on en supprimer les données sensibles/inutiles
      delete userObj.password
      // delete userObj.longitude
      // delete userObj.latitude;

      res.json({ auth: true, token: token, user: userObj });
    } catch (error) {
      console.log(error);
      res.status(500).json({error: "Erreur Serveur !"})
    }
  },
};

module.exports = authController;
