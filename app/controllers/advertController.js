const { Advert, Advert_has_image } = require("../models/index");
const radius_calc = require("../../public/radius_calc");

const advertsController = {
  getAll: async (req, res) => {
    try {
      const radius = radius_calc(req.user.latitude, req.user.longitude);

      const adverts = await Advert.findAll({
        include: [
          "images",
          //* pour le bouton 'Ajouté aux favoris'
          { association: "favorited_by", attributes: ["id"] },
          {
            association: "advert_creator",
            // where: {
            //   longitude: {
            //     [Op.between]: [radius.longitude.min, radius.longitude.max],
            //   },
            //   latitude: {
            //     [Op.between]: [radius.latitude.min, radius.latitude.max],
            //   },
            // },
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
            association: "tag",
            attributes: ["id", "name"],
          },
        ],
        order: [["created_at", "DESC"]],
      });
      res.json(adverts);
    } catch (error) {
      res.status(500).json({ error: "Erreur Serveur !" });
    }
  },

  getAllFromUser: async (req, res) => {
    try {
      const { id } = req.params;

      const userAdverts = await Advert.findAll({
        where: {
          user_id: id,
        },
        include: [
          {
            association: "advert_creator",
            attributes: ["id", "firstname", "lastname", "thumbnail", "slug", "latitude", "longitude"],
          },
          { association: "images", attributes: ["thumbnail"] },
          {
            association: "tag",
            attributes: ["id", "name"],
          },
        ],
      });

      res.json(userAdverts);
    } catch (error) {
      res.status(500).json("Erreur serveur");
    }
  },

  getOne: async (req, res) => {
    try {
      const { slug } = req.params;
      const advert = await Advert.findOne(
        {
          where: { slug: slug },
        },
        {
          include: [
            "tag",
            "images",
            {
              association: "advert_creator",
              attributes: {
                exclude: [
                  "email",
                  "password",
                  "description",
                  "created_at",
                  "updated_at",
                ],
              },
            },
            {
              association: "tag",
              attributes: ["id", "name"],
            },
          ],
        }
      );

      if (!advert) {
        return res.status(404).json({ error: "Annonce introuvable" });
      }

      res.json(advert);
    } catch (error) {
      res.status(500).json({ error: "Erreur Serveur !" });
    }
  },

  create: async (req, res) => {
    try {
      const { title, content, price, tag_id } = req.body;
      const { user } = req;
      const images = req.files;

      const slug = `${title.split(" ").join("-")}-${Date.now()}`;

      const newAdvert = Advert.build({
        title,
        content,
        price,
        user_id: user.id,
        tag_id,
        slug: slug,
      });

      await newAdvert.save();

      images.forEach(async (e, index) => {
        const image = Advert_has_image.build({
          advert_id: newAdvert.id,
          thumbnail: `${req.protocol}://${req.get("host")}/media/${
            req.files[index].filename
          }`,
        });

        await image.save();
      });

      res.status(201).json(newAdvert);
    } catch (error) {
      return res.status(500).json({ error: "Erreur Serveur !" });
    }
  },

  update: async (req, res) => {
    try {
      const { title, content, price, tag_id } = req.body;
      const images = req.files;

      const advert = await Advert.findByPk(req.params.id, {
        include: {
          association: "images",
        },
      });

      if (!advert) {
        return res.status(404).json({ error: "Annonce introuvable" });
      }

      const { user } = req;
      if (user.id !== advert.user_id) {
        return res
          .status(401)
          .json({ error: "Vous n'êtes pas autorisé à faire ceci" });
      }
      title ? (advert.title = title) : false;
      content ? (advert.content = content) : false;
      price ? (advert.price = price) : false;
      tag_id ? (advert.tag_id = tag_id) : false;

      advert.save();

      if (images.length) {
        images.forEach(async (e, index) => {
          const image = Advert_has_image.build({
            advert_id: advert.id,
            thumbnail: `${req.protocol}://${req.get("host")}/images/${
              req.files[index].filename
            }`,
          });
          await image.save();
        });
      } 

      res.json(advert);
    } catch (error) {
      return res.status(500).json({ error: "Erreur Serveur !" });
    }
  },

  remove: async (req, res) => {
    try {
      const { id } = req.params;

      const advert = await Advert.findByPk(id);

      if (!advert) {
        return res.status(404).json({ error: "Page introuvable" });
      }

      const { user } = req;
      if (user.id !== advert.user_id) {
        return res
          .status(401)
          .json({ error: "Vous n'êtes pas autorisé à faire ceci !" });
      }

      advert.destroy();
      res.json({ message: "Annonce supprimée !" });
    } catch (error) {
      return res.status(500).json({ error: "Erreur Serveur !" });
    }
  },
};

module.exports = advertsController;
