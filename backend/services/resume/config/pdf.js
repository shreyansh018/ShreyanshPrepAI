import { PDFParse } from "pdf-parse";

const extractText = async (buffer) => {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error("PDF buffer is required");
  }

  const pdf = new PDFParse({ data: buffer });
  const result = await pdf.getText();
  return result.text;
};

export default extractText;
