import * as yup from "yup";

export const ticketSchema = yup.object({
  section_id: yup
    .string()
    .required("Please select a section"),
  row_id: yup
    .string()
    .required("Please select a row"),
  quantity: yup
    .number()
    .typeError("Please add valid ticket quantity")
    .required("Please enter ticket quantity")
    .min(1, "Minimum 1 ticket required")
    .max(10, "You can book up to 10 tickets"),
});
