const express = require("express");
const paymentController = require("./../controller/paymentController");

const router = express.Router();

router.post(
  "/check/:tourId",
  paymentController.getcheckout,
  paymentController.datasave
);
router.post(
  "/redirect-url/:merchantTransactionId",
  paymentController.getcheckout,
  paymentController.getsuccess
);
module.exports = router;
