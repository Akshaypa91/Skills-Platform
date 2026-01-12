import mongoose from "mongoose";

export const connectDB = async () => {
    await mongoose.connect('mongodb+srv://pagareakshay1294_db_user:GZd962ygUMlwk7hv@cluster0.krxjqth.mongodb.net/Skills_Platform')
        .then(() => { console.log('DB Connected')})
}