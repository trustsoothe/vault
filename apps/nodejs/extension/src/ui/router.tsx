import React from "react";
import { createHashRouter } from "react-router-dom";
import Header from "./Header/Header";

export const router = createHashRouter([
  {
    path: "",
    element: <Header />,
    children: [],
  },
]);
