import mongoose from "mongoose";

// const BookingSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true },
//     email: { type: String, required: true },
//     carModel: { type: String, required: true },
//     testDriveDate: { type: Date, required: true },
//   },
//   {
//     timestamps: true,
//   }
// );

// const Booking = mongoose.model("Booking", BookingSchema);
// export default Booking;

const testDriveSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  carModel: { type: String, required: true },
  notes: { type: String },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  }, // New field
});

const Booking = mongoose.model("Booking", testDriveSchema);
export default Booking;
