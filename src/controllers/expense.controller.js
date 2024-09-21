import { Expense } from "../models/expense.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const createExpense = asyncHandler(async (req, res) => {

    const { title, amount, description, category, date } = req.body

    console.log("User Request Body: ", req.body)
    console.log("User Title", title)

    //check title, amount and category should not be empty
    if ([title, amount, category].some((field) => field?.trim === '')) {
        throw new ApiError(400, "Title, amount, and category are required")
    }

    //validate amount
    if (isNaN(amount) || amount < 0) {
        throw new ApiError(400, "Amount should be positive number")
    }

    const user = req.user

    if (!user) {
        throw new ApiError(401, "Unauthorized request")
    }

    const newExpense = await Expense.create({
        title,
        amount: parseFloat(amount),
        description: description || '',
        category,
        date: date || Date.now(),
        user: user._id
    })

    if (!newExpense) {
        throw new ApiError(500, "Something went wrong while creating the expense");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, "Expense created successfully"))
})

const getExpenses = asyncHandler(async (req, res) => {

    const user = req.user

    if (!user) {
        throw new ApiError(401, "Unauthorized request")
    }

    const expenses = await Expense.find({ user: user._id }).sort({ date: -1 })

    if (!expenses || expenses.length === 0) {
        return res
            .status(404)
            .json(new ApiError(404, "No expenses found"))
    }

    return res
        .status(200)
        .json(new ApiResponse(200, expenses, "Expenses retrieved successfully"))
})

export { createExpense, getExpenses }