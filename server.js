import express from "express";
import sqlite3 from "sqlite3";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// ✅ Auto create db folder & file agar Railway tidak error
const dbFolder = path.join(__dirname, "db");
if (!fs.existsSync(dbFolder)) fs.mkdirSync(dbFolder);

const DB_FILE = path.join(dbFolder, "nava.db");
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, "");
  console.log("✅ Database baru dibuat otomatis:", DB_FILE);
}

// ====== DATABASE ======
sqlite3.verbose();
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) return console.error("❌ DB ERROR:", err.message);
  console.log("✅ Database Connected:", DB_FILE);
  db.run("PRAGMA foreign_keys = ON");
});

// ====== SYNC STOCK FUNCTION ======
function syncProductStock(productId) {
  db.run(`
    UPDATE products
    SET stock = (
      SELECT COALESCE(SUM(stock),0)
      FROM product_variants
      WHERE product_id = ?
    )
    WHERE id = ?
  `, [productId, productId]);
}

// ====== INIT TABLES ======
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      category TEXT,
      image TEXT,
      stock INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS product_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      title TEXT,
      price INTEGER,
      stock INTEGER DEFAULT 0,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  db.run(`
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
    )
  `);
});

// ✅ SEED minimal agar tidak error saat Railway start
db.get("SELECT COUNT(*) AS c FROM products", (err, row) => {
  if (row?.c === 0) {
    console.log("⏳ Seeding minimal data...");

    db.run(
      "INSERT INTO products (name, category, image, stock) VALUES (?,?,?,?)",
      ["Contoh Produk", "Kategori", "img/placeholder.png", 10],
      function () {
        const pid = this.lastID;
        db.run(
          "INSERT INTO product_variants (product_id, title, price, stock) VALUES (?,?,?,?)",
          [pid, "Varian Contoh", 10000, 10]
        );
        console.log("✅ Seed minimal complete ✅");
      }
    );
  }
});

// ===== AUTH =====
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@mail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

function verifyToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Token invalid" });
    req.user = decoded;
    next();
  });
}

// ✅ LOGIN ADMIN
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Email/Password salah" });
  }
  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "2h" });
  res.json({ token });
});

// === ORDER ENDPOINTS ===
// ✅ Buat Pesanan
app.post("/api/orders", (req, res) => {
  const { product_id, variant_id, name, contact, total, method } = req.body;
  const createdAt = new Date().toISOString();

  db.run(
    `
    INSERT INTO orders (product_id, variant_id, name, contact, method, total, createdAt)
    VALUES (?,?,?,?,?,?,?)
    `,
    [product_id, variant_id, name, contact, method, total, createdAt],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// ✅ Ambil daftar produk
app.get("/api/products", (req, res) => {
  const sql = `
    SELECT p.*,
      json_group_array(
        json_object('id', v.id,'title', v.title,'price', v.price,'stock', v.stock)
      ) AS variants
    FROM products p
    LEFT JOIN product_variants v ON p.id = v.product_id
    GROUP BY p.id
  `;
  
  db.all(sql, [], (_, rows) => {
    rows.forEach(r => {
      r.variants = JSON.parse(r.variants || "[]");
    });
    res.json(rows);
  });
});

// ✅ Serve frontend
app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Running on PORT ${PORT}`));
