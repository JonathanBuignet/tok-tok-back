const { User } = require("../models/index");

const userController = {
  getOne: async (req, res) => {
    try {
      const { id } = req.params;

      const profile = await User.findByPk(id, {
        include: ["liked", "posts", "adverts"],
        attributes: {
          exclude: ["address", "password", "email", "updated_at"],
        },
        order: [
          ["posts", "created_at", "DESC"],
          ["liked", "created_at", "DESC"],
        ],
      });
      res.json(profile);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Erreur Serveur !" });
    }
  },

  update: async (req, res) => {
    try {
      const { firstname, lastname, description, address, email, password } =
        req.body;
      const { user } = req;

      //! TODO: voir pour factoriser
      if (!user) {
        res.status(404).json("Page Introuvable !");
      }
      if (firstname) {
        user.firstname = firstname;
      }
      if (lastname) {
        user.lastname = lastname;
      }
      if (description) {
        user.description = description;
      }
      if (req.file) {
        user.thumbnail = `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`;
      }
      if (address) {
        user.address = address;
      }
      if (email) {
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

  deleteUser: async (req, res) => {
    //! TODO : ajouter une sécurité (demander le mot de passe par exemple) avant de supprimer
    try {
      const { user } = req;
      if (user) {
        await user.destroy();
        res.json({message: "L'utilisateur a été supprimé de la base de données avec succès"}); //? comme cela?
      } else {
        res.status(404).json({error: "Page introuvable"}); //! et la on met quoi?
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Erreur Serveur !" });
    }
  },
};

module.exports = userController;
