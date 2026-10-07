import "dotenv/config";
import express from "express";
import { engine } from "express-handlebars";

import { connectDatabase } from "./config/database.js";
import { createSessionMiddleware } from "./config/session.js";

import {
  student,
  PRODUCT_PREFIX,
  VAT_PERCENT,
} from "./config/student.js";

import bookRoutes from "./routes/books.js";

const app = express();

app.engine("hbs", engine({
  extname: ".hbs",
  defaultLayout: "main",

  helpers: {
    money(value) {
      return Number(value).toLocaleString("vi-VN");
    },
  },
}));

app.set("view engine", "hbs");
app.set("views", "./views");

app.use(express.urlencoded({
  extended: false,
  limit: "10kb",
}));

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

async function start() {
  const requiredVariables = [
    "MONGODB_READ_URI",
    "MONGODB_WRITE_URI",
    "SESSION_SECRET",
  ];

  for (const name of requiredVariables) {
    if (!process.env[name]) {
      throw new Error(`Thiếu biến môi trường: ${name}`);
    }
  }

  // Phải kết nối trước khi dùng client cho Session.
  await connectDatabase();

  app.get("/health", (req, res) => {
    res.send("OK");
  });

  app.use(createSessionMiddleware());

  app.use((req, res, next) => {
    res.locals.student = student;
    res.locals.prefix = PRODUCT_PREFIX;
    res.locals.vatPercent = VAT_PERCENT;
    next();
  });

  app.use("/", bookRoutes);

  app.use((error, req, res, next) => {
    console.error("Loi xu ly:", error.code ?? error.name);

    res.status(500).send(
      "Có lỗi hệ thống. Kiểm tra kết nối và quyền MongoDB."
    );
  });

  const port = Number(process.env.PORT) || 3000;

  app.listen(port, "0.0.0.0", () => {
    console.log(`Server dang chay tai cong ${port}`);
  });
}

start().catch((error) => {
  console.error("Khoi dong that bai:", error.message);
  process.exit(1);
});