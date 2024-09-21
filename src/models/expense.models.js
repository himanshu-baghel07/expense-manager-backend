import mongoose, { Schema } from "mongoose";


const expenseSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        description: {
            type: String,
            trim: true,
        },
        category: {
            type: String,
            trim: true,
            required: true,
            index: true
        },
        date: {
            type: Date,
            required: true,
            default: Date.now
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        }
    },
    {
        timestamps: true
    }
)

expenseSchema.index({ user: 1, date: -1 })

export const Expense = mongoose.model("Expense", expenseSchema)