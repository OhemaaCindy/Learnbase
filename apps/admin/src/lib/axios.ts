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
        Cookies.remove("token");
        window.location.href = "/";
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
