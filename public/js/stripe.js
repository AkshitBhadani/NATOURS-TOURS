/* eslint-disable */
import axios from "axios";
import { showAlert } from "./alerts";

export const bookTour = async (tourId) => {
  try {
    // 1) Get checkout session from API
    const url = `http://localhost:3000/check/${tourId}`;
    window.open(url, "_blank"); // Open URL in a new tab/window
  } catch (err) {
    console.error(err);
    showAlert("error", err);
  }
};
