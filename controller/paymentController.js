const axios = require("axios");
// const uniqid = require("uniqid");
const sha256 = require("sha256");
const Tour = require("../models/tourModel");
const catchAsync = require("./../utils/catchAsync");
const Payment = require("./../models/paymentModel");

const PHONE_PE_HOST_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox";
const MERCHANT_ID = "PGTESTPAYUAT";
const SALT_INDEX = 1;
const SALT_KEY = "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";

function generateTransactionId() {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 1000000);
  const merchantprefix = "T";
  const transactionID = `${merchantprefix}${timestamp}${randomNum}`;
  return transactionID;
}
function UserId() {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 1000000);
  const merchantprefix = "T";
  const transactionID = `${merchantprefix}${timestamp}${randomNum}`;
  return transactionID;
}
const merchantTransactionID = generateTransactionId();

exports.getcheckout = async (req, res) => {
  try {
    //   console.log(uniqid);
    const payEndpoint = "/pg/v1/pay";
    const userId = UserId();
    const tour = await Tour.findById(req.params.tourId);
    const payload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId: merchantTransactionID,
      merchantUserId: userId,
      amount: tour.price * 100, //in paise
      redirectUrl: `http://localhost:3000/redirect-url/${merchantTransactionID}`,

      redirectMode: "REDIRECT",
      mobileNumber: "9687368058",
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };
    // console.log("pay", payload);
    // HA256(base64 encoded payload + “/pg/v1/pay” +salt key) + ### + salt index
    const bufferObj = Buffer.from(JSON.stringify(payload), "utf-8");
    const base63Encodedpayload = bufferObj.toString("base64");
    const xVerify =
      sha256(base63Encodedpayload + payEndpoint + SALT_KEY) +
      "###" +
      SALT_INDEX;

    const options = {
      method: "post",
      url: `${PHONE_PE_HOST_URL}${payEndpoint}`,
      // url: "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
      },
      data: {
        request: base63Encodedpayload,
      },
    };
    axios.request(options).then(function (response) {
      console.log(response.data);
      const url = response.data.data.instrumentResponse.redirectInfo.url;
      res.redirect(url);
      //   res.send(response.data);
      console.log(url);
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
      success: false,
    });
  }
};
exports.getsuccess = async (req, res) => {
  const merchantTransactionId = merchantTransactionID;
  // const merchantId = res.req.body.merchantId;
  console.log("merchantTransactionId", merchantTransactionId);
  if (merchantTransactionId) {
    //   SHA256(“/pg/v1/status/{merchantId}/{merchantTransactionId}” + saltKey) + “###” + saltIndex
    const xVerify =
      sha256(
        `/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}` + SALT_KEY
      ) +
      "###" +
      SALT_INDEX;
    const options = {
      method: "get",
      url: `${PHONE_PE_HOST_URL}/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}`,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-MERCHANT-ID": merchantTransactionId,
        "X-VERIFY": xVerify,
      },
    };
    axios
      .request(options)
      .then(function (response) {
        console.log(response.data);

        if (response.data.code === "PAYMENT_SUCCESS") {
          const url = `http://localhost:3000/success`;
          return res.redirect(url);
        } else {
          const url = `http://localhost:3000/failure`;
          return res.redirect(url);
        }
        ``;
      })
      .catch(function (error) {
        console.error(error);
      });
  } else {
    res.send({ error: "error" });
  }
};

exports.createpaymentCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query;

  if (!tour && !user && !price) return next();
  await Booking.create({ tour, user, price });

  res.redirect(req.originalUrl.split("?")[0]);
});

// Create a new payment document
exports.datasave = catchAsync(async (req, res, next) => {
  const { cardNumber, name, price } = req.body;

  // Create a new payment document
  const newPayment = await Payment.create({
    cardNumber,
    name,
    price,
  });

  // Save the payment document to the database
  newPayment
    .save()
    .then(() => {
      console.log("Payment details saved to MongoDB");
      res.status(200).send("Payment details saved successfully");
    })
    .catch((error) => {
      console.error("Error saving payment details to MongoDB:", error);
      res.status(500).send("Error saving payment details");
    });
});
