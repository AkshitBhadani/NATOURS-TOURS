import axios from "axios";
import { showAlert } from "./alerts";

export const resetPassword = async (password, passwordConfirm) => {
  try {
    const res = await axios({
      method: " PATCH",
      url: "http://127.0.0.1:3000/api/v1/users/resetPassword/:token",
      data: {
        password,
        passwordConfirm,
      },
    });
    if (res.data.status === "success") {
      showAlert("success", "Token sent to email!");
      window.setTimeout(() => {
        location.assign("/");
      }, 500);
    }
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
};
