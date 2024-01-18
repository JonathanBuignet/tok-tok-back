const { Op } = require("sequelize");
const { User } = require("../models/index");
const { v4: uuidv4 } = require("uuid");
const { uploadImageToS3 } = require("../middlewares/s3Service");

const userController = {
  getOne: async (req, res) => {
    try {
      const { slug } = req.params;

      const profile = await User.findOne({
        where: {
          slug: slug,
        },
        include: [
          "liked",
          {
            association: "posts",
            // where: {"reply_to": {
            //   [Op.is]: null
            // }},
            //!\ Ne fonctionne pas quand la personne n'a pas de posts /!\
            //? est-ce qu'on ne ferait pas ce filtre en front ?
            include: [
              {
                association: "post_creator",
                attributes: {
                  exclude: [
                    "email",
                    "password",
                    "address",
                    "longitude",
                    "latitude",
                    "created_at",
                    "updated_at",
                  ],
                },
              },
              {
                association: "users_liked",
                attributes: {
                  exclude: [
                    "email",
                    "password",
                    "address",
                    "longitude",
                    "latitude",
                    "created_at",
                    "updated_at",
                  ],
                },
              },
              {
                association: "replies",
                order: [["replies", "created_at", "DESC"]],
                include: {
                  association: "post_creator",
                  //! Corriger l'exclude, il renvoie tous les champs
                  attributes: {
                    exclude: [
                      "email",
                      "password",
                      "address",
                      "longitude",
                      "latitude",
                      "created_at",
                      "updated_at",
                    ],
                  },
                },
              },
            ],
          },
          {
            association: "adverts",
            include: [
              "tag",
              "images",
              {
                association: "advert_creator",
                attributes: {
                  exclude: [
                    "email",
                    "password",
                    "adress",
                    //*Pour ajouter la distance
                    // "longitude",
                    // "latitude",
                    "created_at",
                    "updated_at",
                  ],
                },
              },
            ],
          },
        ],
        attributes: {
          exclude: ["address", "password", "email", "updated_at"],
        },
        // order: [
        //   ["posts", "created_at", "DESC"],
        //   // ["liked", "created_at", "DESC"],
        // ],
      });
      res.json(profile);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Erreur Serveur !" });
    }
  },

  update: async (req, res) => {
    try {
      const {
        firstname,
        lastname,
        description,
        address,
        city,
        longitude,
        latitude,
        email,
        password,
      } = req.body;
      const { user } = req;

      if (!user) {
        res.status(404).json("Page Introuvable !");
      }

      //! TODO: voir pour factoriser
      if (firstname) {
        user.firstname = firstname;
        user.slug = `${firstname.toLowerCase()}-${user.lastname.toLowerCase()}-${uuidv4()}`;
      }
      if (lastname) {
        user.lastname = lastname;
        user.slug = `${user.firstname.toLowerCase()}-${lastname.toLowerCase()}-${uuidv4()}`;
      }
      if (description) {
        user.description = description;
      }
      if (req.file) {
        const imageUrl = await uploadImageToS3(req.file);
        user.thumbnail = imageUrl;
        console.log(user.thumbnail);
      }
      if (address) {
        user.address = address;
      }
      if (city) {
        user.city = city;
      }
      if (longitude) {
        user.longitude = longitude;
      }
      if (latitude) {
        user.latitude = latitude;
      }
      if (email) {
        //! NOUVEAU
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

        user.email = email;
      }
      if (password) {
        user.password = password;
      }

      await user.save();
      res.json(user);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Erreur Serveur !" });
    }
  },

  changeBanner: async (req, res) => {
    try {
      const { user } = req;

      if (req.file) {
        const imageUrl = await uploadImageToS3(req.file);
        user.banner = imageUrl;
      }

      await user.save();
      res.status(201).json(user);
    } catch (error) {
      console.log(error);
    }
  },

  deleteUser: async (req, res) => {
    //! TODO : ajouter une sécurité (demander le mot de passe par exemple) avant de supprimer
    try {
      const { user } = req;
      if (user) {
        await user.destroy();
        res.json({
          message:
            "L'utilisateur a été supprimé de la base de données avec succès",
        });
      } else {
        res.status(404).json({ error: "Page introuvable" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Erreur Serveur !" });
    }
  },
};

module.exports = userController;
