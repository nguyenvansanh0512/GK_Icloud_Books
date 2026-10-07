import { Router } from "express";
import { randomBytes } from "node:crypto";

import {
  getReadBooks,
  getWriteBooks,
} from "../config/database.js";

import {
  PRODUCT_PREFIX,
  VAT_PERCENT,
} from "../config/student.js";

const router = Router();

// Xem danh sách: dùng tài khoản chỉ đọc.
router.get("/", async (req, res, next) => {
  try {
    if (!req.session.startedAt) {
      req.session.startedAt = new Date().toISOString();
    }

    if (!req.session.csrfToken) {
      req.session.csrfToken = randomBytes(32).toString("hex");
    }

    const books = await getReadBooks()
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    res.render("home", {
      books,
      startedAt: req.session.startedAt,
      csrfToken: req.session.csrfToken,
    });
  } catch (error) {
    next(error);
  }
});

// Thêm sách: dùng tài khoản chỉ ghi trên books.
router.post("/books", async (req, res, next) => {
  try {
    if (
      !req.session.csrfToken ||
      req.body.csrfToken !== req.session.csrfToken
    ) {
      return res.status(403).send(
        "Phiên biểu mẫu không hợp lệ. Vui lòng tải lại trang."
      );
    }

    const code = String(req.body.code ?? "").trim();
    const title = String(req.body.title ?? "").trim();
    const rawPrice = String(req.body.price ?? "").trim();
    const price = Number(rawPrice);

    // Bắt buộc kiểm tra phía server.
    if (!code.startsWith(PRODUCT_PREFIX)) {
      return res.status(400).send(
        `Mã sách phải bắt đầu bằng ${PRODUCT_PREFIX}.`
      );
    }

    if (code.length > 50) {
      return res.status(400).send(
        "Mã sách không được vượt quá 50 ký tự."
      );
    }

    if (!title || title.length > 200) {
      return res.status(400).send(
        "Tên sách phải từ 1 đến 200 ký tự."
      );
    }

    // Giá được nhập theo số nguyên đồng Việt Nam.
    if (
      rawPrice === "" ||
      !Number.isSafeInteger(price) ||
      price < 0 ||
      price > 1_000_000_000
    ) {
      return res.status(400).send(
        "Giá phải là số nguyên từ 0 đến 1.000.000.000 đồng."
      );
    }

    // Tính trước khi lưu, làm tròn tiền thuế đến đồng.
    const taxAmount = Math.round(price * VAT_PERCENT / 100);
    const priceAfterTax = price + taxAmount;

    await getWriteBooks().insertOne({
      code,
      title,
      price,
      vatPercent: VAT_PERCENT,
      taxAmount,
      priceAfterTax,
      createdAt: new Date(),
    });

    res.redirect(303, "/");
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).send("Mã sách đã tồn tại.");
    }

    next(error);
  }
});

export default router;