import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };
global.mongoose = cached;

async function getUri(): Promise<string> {
  const uri = process.env.MONGODB_URI;

  // Use in-memory MongoDB for local dev when Atlas URI is missing or still has placeholder
  if (!uri || uri.includes("<db_password>")) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("MONGODB_URI is not configured for production");
    }
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const mms = await MongoMemoryServer.create();
    return mms.getUri();
  }

  return uri;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = getUri().then((uri) =>
      mongoose.connect(uri, { bufferCommands: false })
    );
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // A failed connect must clear the cached (rejected) promise, otherwise every
    // later connectDB() re-awaits the same rejection and never reconnects.
    cached.promise = null;
    throw err;
  }
  return cached.conn;
}
