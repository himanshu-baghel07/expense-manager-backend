import { Expense } from "../models/expense.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import { decryptPayload } from "../utils/DecryptMethod.js";

const createExpense = asyncHandler(async (req, res) => {
  if (!req.body.encryptedRequestBody) {
    throw new ApiError(400, "Encrypted data is missing");
  }

  const decryptedRequestBody = decryptPayload(req.body.encryptedRequestBody);
  console.log("Decrypted data:", decryptedRequestBody);

  const { title, amount, description, category, date } = decryptedRequestBody;

  console.log("User Request Body: ", req.body);
  console.log("User Title", title);

  if ([title, amount, category].some((field) => field?.trim === "")) {
    throw new ApiError(400, "Title, amount, and category are required");
  }

  if (isNaN(amount) || amount < 0) {
    throw new ApiError(400, "Amount should be positive number");
  }

  const user = req.user;

  if (!user) {
    throw new ApiError(401, "Unauthorized request");
  }

  const newExpense = await Expense.create({
    title,
    amount: parseFloat(amount),
    description: description || "",
    category,
    date: date || Date.now(),
    user: user._id,
  });

  if (!newExpense) {
    throw new ApiError(500, "Something went wrong while creating the expense");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, "Expense created successfully"));
});

const getExpenses = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    throw new ApiError(401, "Unauthorized request");
  }

  const expenses = await Expense.find({ user: user._id }).sort({ date: -1 });

  if (!expenses || expenses.length === 0) {
    return res.status(404).json(new ApiError(404, "No expenses found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, expenses, "Expenses retrieved successfully"));
});

const updateExpense = asyncHandler(async (req, res) => {
  const { expenseId } = req.params;
  const { title, amount, description, category, date } = req.body;
  const user = req.user;

  const expense = await Expense.findOne({
    _id: expenseId,
    user: req.user._id,
  });
  console.log("User making the request: ", user);
  console.log("Expense ID from params: ", expenseId);

  if (!expense) {
    throw new ApiError(404, "Expense not found or unauthorized access");
  }

  if ([title, amount, category].some((field) => field?.trim === "")) {
    throw new ApiError(404, "title,amount,category, is required");
  }

  if (isNaN(amount) || amount < 0) {
    throw new ApiError(400, "Amount should be a positive number");
  }

  expense.title = title || expense.title;
  expense.amount = parseFloat(amount) || expense.amount;
  expense.description = description || expense.description;
  expense.category = category || expense.category;
  expense.date = date || expense.date;

  const updatedExpense = await expense.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Expense updated successfully"));
});

const getChartData = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    throw new ApiError(401, "Unauthorized request");
  }

  const expenses = await Expense.aggregate([
    { $match: { user: user._id } },
    {
      $group: {
        _id: "$category",
        total_Amounnt: { $sum: "$amount" },
      },
    },
  ]);
  if (!expenses || expenses.length === 0) {
    return res
      .status(404)
      .json(new ApiResponse(404, "No expenses found for this user"));
  }
  return res.status(200).json(new ApiResponse(200, expenses));
});

export { createExpense, getExpenses, updateExpense, getChartData };
