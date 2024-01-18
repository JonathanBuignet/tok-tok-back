const { Router } = require("express");
const sanitize = require("./middlewares/sanitize");
const verifyAuthMiddleware = require("./middlewares/verifyAuthMiddleware");

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const {
  advertController,
  authController,
  categoriesController,
  favouriteController,
  likeController,
  messageController,
  postController,
  userController,
} = require("./controllers/index");

const router = Router();

router.post("*", sanitize);
router.patch("*", sanitize);

/* Login/Signup -----------------------------------------------------------------*/
router.post("/login", authController.login);
router.post("/signup", authController.signup);

/* Posts -----------------------------------------------------------------*/
router.get("/posts", verifyAuthMiddleware, postController.getAll);
router.get("/post/:id", verifyAuthMiddleware, postController.getOne);
router.post(
  "/posts",
  verifyAuthMiddleware,
  upload.single("thumbnail"),
  postController.createPost
);
router.patch(
  "/posts/:id",
  verifyAuthMiddleware,
  upload.single("thumbnail"),
  postController.update
);
router.delete("/posts/:id", verifyAuthMiddleware, postController.remove);

/* Users -----------------------------------------------------------------*/
router.get("/profile/:slug", verifyAuthMiddleware, userController.getOne); //? route pour MON profil ?
router.patch(
  "/my-profile/edit",
  verifyAuthMiddleware,
  upload.single("thumbnail"),
  userController.update
);
router.patch(
  "/my-profile/edit-banner",
  verifyAuthMiddleware,
  upload.single("banner"),
  userController.changeBanner
);
router.delete(
  "/my-profile/delete",
  verifyAuthMiddleware,
  userController.deleteUser
);

/* Adverts ---------------------------------------------------------------*/
router.get("/adverts", verifyAuthMiddleware, advertController.getAll);
router.get(
  "/profile/:id/adverts",
  verifyAuthMiddleware,
  advertController.getAllFromUser
);
router.get("/adverts/:slug", verifyAuthMiddleware, advertController.getOne);
router.post(
  '/adverts',
  verifyAuthMiddleware,
  upload.array('thumbnails'),
  advertController.create
);
router.patch(
  "/adverts/:id",
  verifyAuthMiddleware,
  upload.array("thumbnails"),
  advertController.update
);
router.delete("/adverts/:id", verifyAuthMiddleware, advertController.remove);

/* Messages
--------------------------------------------------------------*/
// router.get("/messages", verifyAuthMiddleware, messageController.getMessages);
// router.get(
//   "/messages/:id",
//   verifyAuthMiddleware,
//   messageController.displayAllConversation
// );
// router.post(
//   "/messages/:id",
//   verifyAuthMiddleware,
//   messageController.sendMessage
// );

router.get("/contacts", verifyAuthMiddleware, messageController.getContacts);
router.get(
  "/messages/:destId",
  verifyAuthMiddleware,
  messageController.getMessages
);
router.post("/messages", verifyAuthMiddleware, messageController.sendMessage);

/* Favourites --------------------------------------------------------------*/
router.get("/favourites", verifyAuthMiddleware, favouriteController.getAll);
router.post(
  "/favourites/:advertId",
  verifyAuthMiddleware,
  favouriteController.add
);
router.delete(
  "/favourites/:advertId",
  verifyAuthMiddleware,
  favouriteController.remove
);

/*Likes
-------------------------------------------------------------*/
router.post("/likes/:postId", verifyAuthMiddleware, likeController.add);
router.delete("/likes/:postId", verifyAuthMiddleware, likeController.remove);

/* Categories -----------------------------------------------*/
router.get("/categories", verifyAuthMiddleware, categoriesController.getAll);

module.exports = router;
