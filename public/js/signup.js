import axios from "axios";
import { showAlert } from "./alerts";

export const signUp = async (email, name, password, passwordConfirm) => {
  try {
    const res = await axios({
      method: "POST",
      url: "http://127.0.0.1:3000/api/v1/users/signUp",
      data: {
        email,
        name,
        password,
        passwordConfirm,
      },
    });
    if (res.data.status === "success") {
      showAlert("success", "SignUp successfully!");
      window.setTimeout(() => {
        location.assign("/");
      }, 1500);
    }
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
};
