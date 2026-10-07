export const student = {
  fullName: "Nguyễn Văn Sanh",
  studentId: "23IT232",
};

export const DB_NAME = `DB_${student.studentId}`;

export const PRODUCT_PREFIX = student.studentId.slice(-3);

export const VAT_PERCENT =
  Number(student.studentId.slice(-1)) + 6;