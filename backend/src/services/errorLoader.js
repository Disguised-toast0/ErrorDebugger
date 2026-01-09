import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const errorsPath = path.join(__dirname, "../data/errors");

export const loadErrors = () => {
  const files = fs.readdirSync(errorsPath);
  return files.map(file => {
    const data = fs.readFileSync(path.join(errorsPath, file));
    return JSON.parse(data);
  });
};

export const loadErrorById = (errorId) => {
  const filePath = path.join(errorsPath, `${errorId}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath));
};
