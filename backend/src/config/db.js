import mongoose from "mongoose";
export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING);
    console.log("Lk csdl thành công!");
  } catch (err) {
    console.log("Lỗi khi kn csdl");
    process.exit(1);
  }
};
