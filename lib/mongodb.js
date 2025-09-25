import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME;

if (!MONGODB_URI) {
	throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

if (!DB_NAME) {
	throw new Error("Please define the DB_NAME environment variable inside .env.local");
}

let cached = global.mongoose;

if (!cached) {
	cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
	if (cached.conn) {
		// Check if connection is still alive
		if (cached.conn.connection.readyState === 1) {
			return cached.conn;
		} else {
			// Connection is stale, reset it
			cached.conn = null;
			cached.promise = null;
		}
	}

	if (!cached.promise) {
		const opts = {
			dbName: DB_NAME,
			bufferCommands: false,
			maxPoolSize: 10,
			serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
			socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
			family: 4, // Use IPv4, skip trying IPv6
		};

		cached.promise = mongoose
			.connect(MONGODB_URI, opts)
			.then((mongoose) => {
				return mongoose;
			})
			.catch((error) => {
				console.error("MongoDB connection failed:", error);
				cached.promise = null;
				throw error;
			});
	}

	try {
		cached.conn = await cached.promise;
	} catch (e) {
		cached.promise = null;
		console.error("Database connection error:", e.message);
		throw new Error("Database connection failed");
	}

	return cached.conn;
}

export default dbConnect;
