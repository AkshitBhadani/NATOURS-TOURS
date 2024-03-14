const express = require("express");
const easyinvoice = require("easyinvoice");
const fs = require("fs");
const path = require("path");
const Tour = require("./../models/tourModel");

// APP
const app = express();
// IMAGE PATH
let imgPath = path.resolve("controller", "invoice.png");
// Function to encode file data to base64 encoded string
function base64_encode(img) {
  // read binary data
  let png = fs.readFileSync(img);
  // convert binary data to base64 encoded string
  return new Buffer.from(png).toString("base64");
}
function InvoiceNumber() {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 1000000);
  const merchantprefix = "T";
  const transactionID = `${merchantprefix}${timestamp}${randomNum}`;
  return transactionID;
}
// DATA OBJECT
let data = {
  //"documentTitle": "RECEIPT", //Defaults to INVOICE
  currency: "EUR",
  taxNotation: "vat", //or gst
  marginTop: 25,
  marginRight: 25,
  marginLeft: 25,
  marginBottom: 25,
  logo: `${base64_encode(imgPath)}`, //or base64
  //"logoExtension": "png", //only when logo is base64
  sender: {
    company: "Natours Tour",
    address: "Gota",
    zip: "306 ",
    city: "Ahemdabad",
    country: "India",
    //"custom1": "custom value 1",
    //"custom2": "custom value 2",
    //"custom3": "custom value 3"
  },
  client: {
    company: "",
    address: "Clientstreet 456",
    zip: "4567 CD",
    city: "Clientcity",
    country: "Clientcountry",
    //"custom1": "custom value 1",
    //"custom2": "custom value 2",
    //"custom3": "custom value 3"
  },
  invoiceNumber: InvoiceNumber(),
  invoiceDate: Date.now(),
  products: [
    {
      quantity: "1",
      description: "THE PARK CAMPER",
      tax: 2100,
      price: 149700,
    },
    {
      quantity: "4",
      description: "THE SNOW ADVENTURER",
      tax: 1500,
      price: 99700,
    },
  ],
  bottomNotice: "Kindly pay your invoice within 15 days.",
};
// INVOICE PDF FUNCTION
// exports.invoicePdf = async (res) => {
//   //Create your invoice! Easy!
//   const fileName = `./invoice/invoice${Date.now()}.pdf`;
//   let result = await easyinvoice.createInvoice(data);
//   fs.writeFileSync(fileName, result.pdf, "base64");
//   //   res.download(fileName, "receipt.pdf");
// };
// invoicePdf();
exports.invoicePdf = async (req, res) => {
  try {
    const fileName = `invoice${Date.now()}.pdf`;
    let result = await easyinvoice.createInvoice(data);
    fs.writeFileSync(fileName, result.pdf, "base64");
    res.download(fileName, "invoice.pdf", (err) => {
      // Delete the file after download completes or if there's an error
      if (err) {
        console.error(err);
      }
      fs.unlinkSync(fileName);
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
