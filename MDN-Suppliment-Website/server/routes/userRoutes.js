const router = require("express").Router();
const ctrl = require("../controller/userController");
const { isAuth } = require("../middleware/auth");

router.use(isAuth);

router.get("/me/addresses", ctrl.getMyAddresses);
router.post("/me/addresses", ctrl.addAddress);
router.put("/me/addresses/:addressId", ctrl.updateAddress);
router.delete("/me/addresses/:addressId", ctrl.deleteAddress);

module.exports = router;