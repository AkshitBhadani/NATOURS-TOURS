const Tour = require("../models/tourModel");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Booking = require("../models/paymentModel");
const Review = require("../models/reviewModel");
const PDFDocument = require("pdfkit");
const fs = require("fs");

exports.getOverview = catchAsync(async (req, res) => {
  // 1) Get tour data from collection
  const tours = await Tour.find();
  // 2) Build template
  // 3) Rendar that template using tour data from 1
  res.status(200).render("overview", {
    title: "All Tours",
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) Get the data,  for the requested tour(including review and guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: "reviews",
    fields: "reviews rating user",
  });

  if (!tour) {
    return next(new AppError("There is no tour with that name.", 404));
  }

  // 2) Build template
  // 3) Rendar template using tour data from 1
  res.status(200).render("tour", {
    title: `${tour.name} Tour`,
    tour,
  });
});

exports.getLoginFrom = (req, res) => {
  res.status(200).render("login", {
    title: "log into your account",
  });
};
exports.getpaymentFrom = (req, res) => {
  res.status(200).render("payment", {
    title: "get payment",
  });
};
exports.getaddreview = (req, res) => {
  res.status(200).render("addreview", {
    title: "New Review",
  });
};
exports.getsignUpFrom = (req, res) => {
  res.status(200).render("signup", {
    title: "Create your New account",
  });
};
exports.paymentsuccess = (req, res) => {
  res.status(200).render("Sussess", {
    title: "Success",
  });
};
exports.forgotPassword = (req, res) => {
  res.status(200).render("forgotPassword", {
    title: "Forgot Password",
  });
};
exports.getAccount = (req, res) => {
  res.status(200).render("account", {
    title: "Your account",
  });
};
exports.resetPassword = (req, res) => {
  res.status(200).render("resetPassword", {
    title: "Reset Password",
  });
};
exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1) Find all booking
  const bookings = await Booking.find({ user: req.user.id });
  // 2) Find tours with the returned IDs
  const tourIDs = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render("overview", {
    title: "My Tours",
    tours,
  });
});
exports.getMyReview = catchAsync(async (req, res, next) => {
  // // 1) Find all booking
  // const Reviews = await Review.find({ user: req.user.id });
  // // 2) Find tours with the returned IDs
  // const tourIDs = Reviews.map((el) => el.tour);
  // const tours = await Tour.find({ _id: { $in: tourIDs } });
  const reviews = await Review.find({
    user: req.user.id,
    tour: req.params.tourId,
  });

  res.status(200).render("overview", {
    title: "My Review",
    reviews,
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updateUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(200).render("account", {
    title: "Your account",
    user: updateUser,
  });
});

// exports.success = catchAsync(async (req, res) => {
//   try {
//     const { amount, method, customer_id } = req.body;

//     // Example payment data received from the client
//     const newPayment = {
//       amount,
//       method,
//       customer_id,
//       timestamp: new Date(),
//       // Add other fields as needed
//     };

//     // Save payment data to the database
//     // const insertedId = await savePayment(newPayment);

//     res.status(201).json({ message: "Payment saved successfully" });
//   } catch (error) {
//     console.error("Error processing payment:", error);
//     res.status(500).json({
//       message: "Internal server error",
//       error: error,
//     });
//   }
// });
// Assuming you have a route or endpoint to handle payment success webhook from PhonePe
exports.success = (req, res) => {
  const { cardNumber, name, price } = req.body;

  // Generate PDF receipt
  const pdfDoc = new PDFDocument();
  const fileName = "receipt.pdf"; // Name of the PDF file

  // Pipe the PDF document to a writable stream
  const writeStream = fs.createWriteStream(fileName);
  pdfDoc.pipe(writeStream);

  // Write payment details to PDF
  pdfDoc.fontSize(12).text("Payment Receipt", { align: "center" }).moveDown();
  pdfDoc.text(`Card Number: ${cardNumber}`).moveDown();
  pdfDoc.text(`Name: ${name}`).moveDown();
  pdfDoc.text(`Price: ${price}`).moveDown();

  // Finalize the PDF
  pdfDoc.end();

  // Provide download link to user
  res.download(fileName, "receipt.pdf");
};
