import session from "express-session";
import MongoStore from "connect-mongo";

import { getSessionClient } from "./database.js";
import { DB_NAME } from "./student.js";

export function createSessionMiddleware() {
  const store = MongoStore.create({
    client: getSessionClient(),
    dbName: DB_NAME,
    collectionName: "sessions",
    ttl: 24 * 60 * 60,
    autoRemove: "disabled",
  });

  store.on("error", () => {
    console.error("Loi kho luu tru Session.");
  });

  return session({
    name: "books.sid",
    secret: process.env.SESSION_SECRET,
    store,
    resave: false,
    saveUninitialized: false,

    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  });
}