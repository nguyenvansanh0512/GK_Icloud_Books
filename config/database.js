import { MongoClient } from "mongodb";
import { setServers } from "node:dns/promises";
import { DB_NAME } from "./student.js";

let readClient;
let writeClient;

export async function connectDatabase() {
  // Cấu hình DNS khi chạy trên máy local.
  if (process.env.NODE_ENV !== "production") {
    setServers(["8.8.8.8", "1.1.1.1"]);
  }

  readClient = new MongoClient(process.env.MONGODB_READ_URI);
  writeClient = new MongoClient(process.env.MONGODB_WRITE_URI);

  await Promise.all([
    readClient.connect(),
    writeClient.connect(),
  ]);

  console.log("Da ket noi MongoDB bang hai tai khoan.");
}

export function getReadBooks() {
  return readClient.db(DB_NAME).collection("books");
}

export function getWriteBooks() {
  return writeClient.db(DB_NAME).collection("books");
}

export function getSessionClient() {
  if (!writeClient) {
    throw new Error("MongoDB write client chua duoc ket noi.");
  }

  // connect-mongo cần MongoClient, không phải Db hoặc Collection.
  return writeClient;
}