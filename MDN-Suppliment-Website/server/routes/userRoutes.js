const router = require("express").Router();
const ctrl = require("../controller/userController");
const { isAuth } = require("../middleware/auth");
const User = require("../models/User");
const { isValidSignature } = require("../utils/productUpdates");
const { SITE_URL } = require("../utils/mailer");
const validate = require("../middleware/validate");
const { idParam, addressBody, addressUpdateBody } = require("../validators/schemas");

// Product-update emails ka unsubscribe — email se seedha click, bina login.
// GET: link khole to; POST: Gmail ka one-click "Unsubscribe" button.
const unsubscribe = async (req, res) => {
  const { u, t } = req.query;
  const page = (title, msg) =>
    res
      .status(title === "Link not valid" ? 400 : 200)
      .type("html")
      .send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;background:#f5f2ec;font-family:Arial,sans-serif">
  <div style="max-width:460px;margin:60px auto;padding:32px;background:#fff;border:1px solid #e6e1d6;border-radius:8px">
    <h1 style="margin:0 0 12px;font-size:22px;color:#1f2418">${title}</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#3d4236">${msg}</p>
    <a href="${SITE_URL}" style="color:#3f5524;font-weight:bold">Go to MDN</a>
  </div>
</body></html>`);

  if (typeof u !== "string" || !/^[a-f\d]{24}$/i.test(u) || !isValidSignature(u, t)) {
    return page("Link not valid", "This unsubscribe link isn't valid. Please use the link from the latest email.");
  }
  await User.updateOne({ _id: u }, { $set: { productEmails: false } });
  page("You're unsubscribed", "You won't get emails about new products any more. You'll still receive emails about your orders and account.");
};
router.get("/unsubscribe", unsubscribe);
router.post("/unsubscribe", unsubscribe);

router.use(isAuth);

const addressParam = validate({ params: idParam("addressId", "Address") });

router.get("/me/addresses", ctrl.getMyAddresses);
router.post("/me/addresses", validate({ body: addressBody }), ctrl.addAddress);
router.put("/me/addresses/:addressId", addressParam, validate({ body: addressUpdateBody }), ctrl.updateAddress);
router.delete("/me/addresses/:addressId", addressParam, ctrl.deleteAddress);

module.exports = router;
