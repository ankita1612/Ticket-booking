import { body } from "express-validator";

export const purchaseValidator = [
  body("section_id")
    .notEmpty()
    .withMessage("Section is required")
    .isMongoId()
    .withMessage("Section must be a valid Mongo ID"),

  body("row_id")
    .notEmpty()
    .withMessage("Row is required")
    .isMongoId()
    .withMessage("Row must be a valid Mongo ID"),

  body("quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isInt({ min: 1 })
    .withMessage("Quantity must be a positive integer"),
];
