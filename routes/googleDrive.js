const router = require("express").Router();
const {
  googleAuth,
  googleDrive,
  revokeDriveToken,
} = require("../controllers/googleDrive");

router.get("/auth", googleAuth);
router.get("/G-drive", googleDrive);
router.get("/revokeDriveToken", revokeDriveToken);
module.exports = router;
