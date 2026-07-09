import mongoose from 'mongoose';

const billingSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  treatment: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Paid', 'Unpaid', 'Pending', 'Partially Paid'],
    default: 'Unpaid'
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'N/A'],
    default: 'N/A'
  },
  items: [{
    name: { type: String, required: true },
    cost: { type: Number, required: true }
  }],
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.models.Billing || mongoose.model('Billing', billingSchema);
