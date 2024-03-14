const express = require("express");
const viewController = require("./../controller/viewController");
const authController = require("../controller/authController");
const paymentController = require("../controller/paymentController");
const inv = require("./../controller/inv");
const router = express.Router();

router.get(
  "/",
  paymentController.createpaymentCheckout,
  authController.isLoggedIn,
  viewController.getOverview
);

router.get("/tour/:slug", authController.isLoggedIn, viewController.getTour);
router.get("/login", authController.isLoggedIn, viewController.getLoginFrom);
router.get("/me", authController.protect, viewController.getAccount);
router.get("/signup", viewController.getsignUpFrom);
router.get("/forgotPassword", viewController.forgotPassword);
router.get("/my-review", authController.protect, viewController.getMyReview);
router.get("/my-tours", authController.protect, viewController.getMyTours);
router.get("/addreview", viewController.getaddreview);
router.patch("/resetPassword/:token", viewController.resetPassword);
router.patch("/success", viewController.paymentsuccess);

router.get(
  "/check/:tourId",
  paymentController.getcheckout,
  paymentController.datasave
);
router.get(
  "/redirect-url/:merchantTransactionId",
  inv.invoicePdf,
  paymentController.datasave
);

router.post(
  "/submit-user-data",
  authController.protect,
  viewController.updateUserData
);
module.exports = router;
