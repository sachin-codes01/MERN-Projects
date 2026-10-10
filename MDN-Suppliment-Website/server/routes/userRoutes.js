const router = require("express").Router();
const ctrl = require("../controller/userController");
const { isAuth } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { idParam, addressBody, addressUpdateBody } = require("../validators/schemas");

router.use(isAuth);

const addressParam = validate({ params: idParam("addressId", "Address") });

router.get("/me/addresses", ctrl.getMyAddresses);
router.post("/me/addresses", validate({ body: addressBody }), ctrl.addAddress);
router.put("/me/addresses/:addressId", addressParam, validate({ body: addressUpdateBody }), ctrl.updateAddress);
router.delete("/me/addresses/:addressId", addressParam, ctrl.deleteAddress);

module.exports = router;
