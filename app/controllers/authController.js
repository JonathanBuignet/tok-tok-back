const bcrypt = require("bcrypt");
const validator = require("email-validator");
const { v4: uuidv4 } = require("uuid");

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

      const user = await User.findOne({
        where: { email: email.toLowerCase() }
      });      

      if (!user) {
        return res
          .status(400)
          .json({ error: "Mauvais couple email/password" });
      }
      
      const isMatching = await bcrypt.compare(password, user.password);
      if (!isMatching) {
        return res.status(400).json({ error: "Mauvais couple email/password" });
      }

      const token = jwt.sign({ userId: user.id }, process.env.SECRETTOKEN, {
        expiresIn: process.env.EXPIREDATETOKEN,
      });

      const userObj = {
        ...user.dataValues,
      };
      delete userObj.password

      res.json({ auth: true, token: token, user: userObj });
    } catch (error) {
      console.log(error);
      res.status(500).json({error: "Erreur Serveur !"})
    }
  },
};

module.exports = authController;
