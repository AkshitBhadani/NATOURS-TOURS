/* eslint-disable */
import "@babel/polyfill";
import { displayMap } from "./mapbox";
import { login, logout } from "./login";
import { updateSettings } from "./updateSettings";
import { bookTour } from "./stripe";
import { signUp } from "./signup";
import { forgotPassword } from "./forgotpassword";
import { resetPassword } from "./resetPassword";
import { addreviewform } from "./addreview";

// DOM ELEMENTS
const mapBox = document.getElementById("map");
const loginForm = document.querySelector(".form--login");
const logOutBtn = document.querySelector(".nav__el--logout");
const userDataForm = document.querySelector(".form-user-data");
const userPasswordForm = document.querySelector(".form-user-password");

const forgot_Password = document.querySelector(".forgotpassword");
const signupForm = document.querySelector(".form--signup");
const resetForm = document.querySelector(".form--reset");
const userReviewForm = document.querySelector(".form-user-review");

const bookBtn = document.getElementById("book-tour");
console.log("book", bookBtn);
if (bookBtn)
  bookBtn.addEventListener("click", (e) => {
    // console.log("e", e);
    e.target.textContent = "Booking";
    const { tourId } = e.target.dataset;
    // console.log("tour", tourId);
    bookTour(tourId);
  });

if (userReviewForm)
  userReviewForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    document.querySelector(".btn--save-rating").textContent = "Updating...";

    const addreview = document.getElementById("addreview").value;
    const rating = document.getElementById("rating").value;
    const datetime = document.getElementById("datetime").value;
    await addreviewform({ addreview, rating, datetime }, "data");
  });

// DELEGATION
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm)
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    login(email, password);
  });

if (logOutBtn) logOutBtn.addEventListener("click", logout);

if (userDataForm)
  userDataForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append("name", document.getElementById("name").value);
    form.append("email", document.getElementById("email").value);
    form.append("photo", document.getElementById("photo").files[0]);
    console.log(form);

    updateSettings(form, "data");
  });

if (userPasswordForm)
  userPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    document.querySelector(".btn--save-password").textContent = "Updating...";

    const passwordCurrent = document.getElementById("password-current").value;
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("password-confirm").value;
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      "password"
    );

    document.querySelector(".btn--save-password").textContent = "Save password";
    document.getElementById("password-current").value = "";
    document.getElementById("password").value = "";
    document.getElementById("password-confirm").value = "";
  });

if (signupForm)
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    document.querySelector(".btn--green").textContent = "Sign Up...";

    const email = document.getElementById("email").value;
    const name = document.getElementById("name").value;
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("passwordConfirm").value;

    await signUp(email, name, password, passwordConfirm);

    document.querySelector(".btn--green").textContent = "Sign Up";
    document.getElementById("email").value = "";
    document.getElementById("name").value = "";
    document.getElementById("password").value = "";
    document.getElementById("passwordConfirm").value = "";
  });

if (forgot_Password)
  forgot_Password.addEventListener("submit", async (e) => {
    e.preventDefault();
    document.querySelector(".btn--green").textContent = "Process...";
    const email = document.getElementById("email").value;
    await forgotPassword(email);

    document.querySelector(".btn--green").textContent = "Success";
    document.getElementById("email").value = "";
  });

if (resetForm)
  resetForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    document.querySelector(".btn--green").textContent = "Process...";
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("passwordConfirm").value;
    await resetPassword(password, passwordConfirm);

    document.querySelector(".btn--green").textContent = "Success";
    document.getElementById("password").value = "";
    document.getElementById("passwordConfirm").value = "";
  });
