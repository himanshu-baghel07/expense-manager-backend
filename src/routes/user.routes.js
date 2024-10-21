import { Router } from "express";
import {
  authenticate,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createExpense,
  getChartData,
  getExpenses,
  updateExpense,
} from "../controllers/expense.controller.js";

const router = Router();

router.route("/register").post(
  // upload.fields([
  //   {
  //     name: "avatar",
  //     maxCount: 1,
  //   },
  //   {
  //     name: "coverImage",
  //     maxCount: 1,
  //   },
  // ]),
  registerUser,
);

router.route("/login").post(loginUser);

router.route("/authenticate").post(authenticate);

//Secured routes
router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refresh-token").post(refreshAccessToken);

router.route("/create-expense").post(verifyJWT, createExpense);

router.route("/get-expenses").get(verifyJWT, getExpenses);

router.route("/update-expense/:expenseId").post(verifyJWT, updateExpense);
router.route("/get-chart-data").post(verifyJWT, getChartData);

export default router;
