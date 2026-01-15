
import mongoose from "mongoose";

export const connectDB = async () => {
	try {
		if (!process.env.MONGO_URI) {
			throw new Error("MONGO_URI is missing in environment variables");
		}

		await mongoose.connect(process.env.MONGO_URI);

		console.log("DB Connected");
	} catch (error) {
		console.log("DB Connection Failed:", error.message);
		process.exit(1);
	}
};
