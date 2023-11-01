const { Post } = require("../models/index");
const radius_calc = require("../../public/radius_calc");
const { Op } = require("sequelize");

const postController = {
  getAll: async (req, res) => {
    try {
      const radius = radius_calc(req.user.latitude, req.user.longitude);

      const posts = await Post.findAll({
        order: [["created_at", "DESC"]],
        where: {
          reply_to: null,
        },
        include: [
          {
            association: "post_creator",
            where: {
              [Op.and]: [
                {
                  longitude: {
                    [Op.between]: [radius.longitude.min, radius.longitude.max],
                  },
                },
                {
                  latitude: {
                    [Op.between]: [radius.latitude.min, radius.latitude.max],
                  },
                },
              ],
            },
            attributes: {
              exclude: [
                "email",
                "password",
                "description",
                "adress",
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
                "adress",
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
            include: "post_creator",
          },
        ],
      });
      res.json(posts);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Erreur Serveur !" });
    }
  },

  //* on ne l'utilisera pas finalement
  getOne: async (req, res) => {
    try {
      const { id } = req.params;
      const post = await Post.findByPk(id, {
        include: [
          {
            association: "post_creator",
            attributes: {
              exclude: [
                "email",
                "password",
                "description",
                "localization",
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
                "description",
                "localization",
                "created_at",
                "updated_at",
              ],
            },
          },
          {
            association: "replies",
            order: [["replies", "created_at", "DESC"]],
            include: "post_creator",
          },
        ],
      });
      res.json(post); // Utiliser "post" au lieu de "posts" car nous obtenons un seul post
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Erreur Serveur !" });
    }
  },

  //! Voir si on ajoute après une gestion des erreurs voir doc: https://github.com/expressjs/multer/blob/master/doc/README-fr.md
  //   const multer = require('multer')
  // const upload = multer().single('avatar')

  // app.post('/profile', function (req, res) {
  //   upload(req, res, function (err) {
  //     if (err instanceof multer.MulterError) {
  //       // Une erreur Multer s'est produite lors du téléchargement.
  //     } else if (err) {
  //       // Une erreur inconnue s'est produite lors du téléchargement.
  //     }

  //     // Tout s'est bien passé.
  //   })
  // })

  createPost: async (req, res) => {
    try {
      const { content, reply_to } = req.body;
      console.log(req.file);

      const newPost = Post.build({
        content,
        reply_to,
        user_id: req.user.id,
      });

      if (req.file) {
        newPost.thumbnail = `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`;
      }

      await newPost.save();

      res.status(201).json(newPost);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erreur Serveur !" });
    }
  },

  update: async (req, res) => {
    try {
      const { content } = req.body;

      const post = await Post.findByPk(req.params.id);
      if (!post) {
        return res.status(404).json({ error: "Page Introuvable !" });
      }

      const { user } = req;
      if (user.id !== post.user_id) {
        return res
          .status(401)
          .json({ error: "Vous n'êtes pas autorisés à faire ceci !" });
      }

      if (!content) {
        return res.status(400).json({ error: "Le contenu est obligatoire" });
      }

      post.content = content;

      if (req.file) {
        post.thumbnail = `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`;
      }

      await post.save();

      return res.json(post);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erreur Serveur !" });
    }
  },

  //! En front -> popup de confirmation
  remove: async (req, res) => {
    try {
      const post = await Post.findByPk(req.params.id);
      if (!post) {
        return res.status(404).json({ error: "Page introuvable !" });
      }

      const { user } = req;
      if (user.id !== post.user_id) {
        return res
          .status(401)
          .json({ error: "Vous n'êtes pas autorisés à faire ceci !" });
      }

      await post.destroy();

      return res.json({ message: "Post supprimé !" });
    } catch (error) {
      res.status(500).json({ error: "Erreur Serveur !" });
    }
  },
};

module.exports = postController;
