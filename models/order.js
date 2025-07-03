// models/order.js
import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 6,
      maxlength: 200,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    approved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Manager', // Assuming all users (including managers) are in a "User" collection
      default: null,
    },
    approved_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

OrderSchema.index({ username: 1 });

const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
export default Order;
