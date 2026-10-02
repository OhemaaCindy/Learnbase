import axios from "axios";
import { BASEURL } from "../constants/api-endpoints";
import Cookies from "js-cookie";

export const axiosClient = axios.create({
  baseURL: BASEURL,
  // timeout: 1000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

axiosClient.interceptors.request.use(
  function (config) {
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

axiosClient.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    if (error.response) {
      if (error.response.status === 401) {
        // The API returns { success: false, errors: [{ message }] }. The older
        // backend returned a bare array of strings. Read whichever arrived
        // rather than assuming, so an unexpected shape cannot throw in here and
        // swallow the real error.
        const data = error.response.data;
        const message = Array.isArray(data)
          ? data[0]
          : data?.errors?.[0]?.message;

        const profileCompletionError = String(message ?? "")
          .toLowerCase()
          .includes("complete your profile");

        // Keep the session for the incomplete-profile case; drop it otherwise.
        if (!profileCompletionError) {
          Cookies.remove("token");
          window.location.href = "/";
        }
      } else if (error.response.status === 500) {
        return Promise.reject(
          new Error("Server error. Please try again later.")
        );
      }
    }

    if (error.code === "ECONNABORTED") {
      return Promise.reject(
        new Error("Request timeout. Please try again later.")
      );
    }

    return Promise.reject(error);
  }
);
