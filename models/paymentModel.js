// Import required modules
const mongoose = require("mongoose");

// Define the payment schema
const paymentSchema = new mongoose.Schema({
  cardNumber: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
});

// Create the Payment model
const Payment = mongoose.model("Payment", paymentSchema);

// Export the Payment model
module.exports = Payment;
