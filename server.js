import express from "express";
import Database from "better-sqlite3";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";

// Load ENV
dotenv.config();

// Fix dirname in ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// ✅ Auto create db folder & db file
const dbFolder = path.join(__dirname, "db");
if (!fs.existsSync(dbFolder)) fs.mkdirSync(dbFolder);

const DB_FILE = path.join(dbFolder, "nava.db");
if (!fs.existsSync(DB_FILE)) {
  console.log("📌 Generating new SQLite DB file");
  fs.writeFileSync(DB_FILE, "");
}

const db = new Database(DB_FILE);
console.log("✅ Database Connected:", DB_FILE);
db.pragma("foreign_keys = ON");

// ✅ Create Tables
db.exec(`
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  category TEXT,
  image TEXT,
  stock INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER,
  title TEXT,
  price INTEGER,
  stock INTEGER DEFAULT 0,
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER,
  variant_id INTEGER,
  name TEXT,
  contact TEXT,
  method TEXT,
  total INTEGER,
  status TEXT DEFAULT 'pending',
  createdAt TEXT
);
`);

// ✅ Seed Minimal if empty
const checkProduct = db.prepare("SELECT COUNT(*) as c FROM products").get();
if (checkProduct.c === 0) {
  console.log("🔥 Seeding minimal product");

  const p = db.prepare("INSERT INTO products (name, category, image, stock) VALUES (?,?,?,?)");
  const v = db.prepare("INSERT INTO product_variants (product_id, title, price, stock) VALUES (?,?,?,?)");

  const prod = p.run("Contoh Produk", "Kategori", "img/placeholder.png", 10);
  v.run(prod.lastInsertRowid, "Varian Contoh", 10000, 10);

  console.log("✅ Seeding selesai");
}

// ===== AUTH =====
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@mail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

function verifyToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: "Invalid Token" });
  }
}

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Email/Password salah" });
  }
  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "2h" });
  res.json({ token });
});

// ✅ Create Order
app.post("/api/orders", (req, res) => {
  const q = db.prepare(`
    INSERT INTO orders (product_id, variant_id, name, contact, method, total, createdAt)
    VALUES (?,?,?,?,?,?,?)
  `);

  const createdAt = new Date().toISOString();
  const result = q.run(
    req.body.product_id,
    req.body.variant_id,
    req.body.name,
    req.body.contact,
    req.body.method,
    req.body.total,
    createdAt
  );

  res.json({ id: result.lastInsertRowid });
});

// ✅ Get Products with Variants
app.get("/api/products", (req, res) => {
  const products = db.prepare("SELECT * FROM products").all();
  const variants = db.prepare("SELECT * FROM product_variants").all();

  const map = {};
  products.forEach(p => (map[p.id] = { ...p, variants: [] }));
  variants.forEach(v => map[v.product_id]?.variants.push(v));

  res.json(Object.values(map));
});

// ✅ Web UI Route
app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Run Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server berjalan di PORT ${PORT}`));
