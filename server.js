const mongoose = require("mongoose");
const dotenv = require("dotenv");

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! Shutting down....");
  console.log(err);
  console.log(err.neme, err.message);
  process.exit(1);
});
dotenv.config({ path: "./config.env" });
const app = require("./app");

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log("DB connection successful!"));

// just fpr testing
// const testTour = new Tour({
//     name:'The park Camper',
//     price:577
// });
// testTour.save().then(doc=>{
//     console.log(doc);
// }).catch(err=>{
//     console.log('ERRER🎇:',err);
// })

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`app running  on port ${port}`);
});

process.on("unhandledRejection", (err) => {
  console.log(err.neme, err.message);
  console.log("UNHANDLED REJECTION ! Shutting down....");
  server.close(() => {
    process.exit(1);
  });
});
