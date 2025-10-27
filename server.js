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

// ✅ SEED KOMPLIT: jalan hanya saat DB masih kosong
(function seedIfEmpty() {
  const row = db.prepare("SELECT COUNT(*) AS c FROM products").get();
  if (row.c > 0) return; // sudah ada data, jangan seed lagi

  console.log("⏳ Seeding full catalog...");

  // 1) Definisi produk
  const products = [
    // Aplikasi Premium
    { name: "Netflix Premium", category: "Aplikasi Premium", image: "img/netflix.png" },
    { name: "CapCut Pro", category: "Aplikasi Premium", image: "img/capcut.png" },
    { name: "Prime Video", category: "Aplikasi Premium", image: "img/prime.png" },
    { name: "Canva Pro", category: "Aplikasi Premium", image: "img/canva.png" },
    { name: "Disney", category: "Aplikasi Premium", image: "img/disney.png" },
    { name: "Vidio", category: "Aplikasi Premium", image: "img/vidio.png" },
    { name: "Wetv", category: "Aplikasi Premium", image: "img/wetv.png" },
    { name: "Spotify", category: "Aplikasi Premium", image: "img/spotify.png" },
    { name: "YouTube", category: "Aplikasi Premium", image: "img/yt.png" },
    { name: "Zoom Pro", category: "Aplikasi Premium", image: "img/zoom.png" },
    { name: "Drama Box", category: "Aplikasi Premium", image: "img/drama.png" },
    { name: "Gemini", category: "Aplikasi Premium", image: "img/gemini.png" },
    { name: "CHAT GPT", category: "Aplikasi Premium", image: "img/chatgpts.png" },
    { name: "Perplexity", category: "Aplikasi Premium", image: "img/perplexity.png" },
    { name: "GET CONTACT", category: "Aplikasi Premium", image: "img/gtc.png" },

    // Game
    { name: "Diamond ML", category: "Game", image: "img/ml.png" },
    { name: "Diamond FF", category: "Game", image: "img/ff.png" },

    // Pulsa
    { name: "Pulsa Telkomsel", category: "Pulsa", image: "img/telkom.png" },
    { name: "Pulsa IM3", category: "Pulsa", image: "img/im3.png" },
    { name: "Pulsa AXIS", category: "Pulsa", image: "img/axis.png" },
    { name: "Pulsa XL", category: "Pulsa", image: "img/xl.png" },
    { name: "Pulsa By.U", category: "Pulsa", image: "img/byu.png" },

    // Paket Data
    { name: "Paket Data Telkomsel", category: "Paket Data", image: "img/pdtelkom.png" },
    { name: "Paket Data IM3", category: "Paket Data", image: "img/pdim3.png" },
    { name: "Paket Data AXIS", category: "Paket Data", image: "img/pdaxis.png" },
    { name: "Paket Data XL", category: "Paket Data", image: "img/pdxl.png" },
    { name: "Paket Data By.U", category: "Paket Data", image: "img/pdbyu.png" },

    // Suntik Sosmed
    { name: "Suntik Instagram", category: "Suntik Sosmed", image: "img/ig.png" },
    { name: "Suntik Tiktok", category: "Suntik Sosmed", image: "img/tiktok.png" },
  ];

  // 2) Definisi varian (harga sementara 10000; stok 10)
  const V = (title, price = 10000, stock = 10) => ({ title, price, stock });

  const variants = {
    // Aplikasi Premium (paket standar)
    "Netflix Premium": [V("Private 1 Bulan"), V("Semi Private 1 Bulan"), V("Sharing 1 Bulan")],
    "CapCut Pro": [V("1 Bulan"), V("6 Bulan")],
    "Prime Video": [V("Private 1 Bulan"), V("Semi Private 1 Bulan"), V("Sharing 1 Bulan")],
    "Canva Pro": [V("Private 1 Bulan"), V("Semi Private 1 Bulan"), V("Sharing 1 Bulan")],
    "Disney": [V("Private 1 Bulan"), V("Sharing 1 Bulan")],
    "Vidio": [V("Private 1 Bulan"), V("Sharing 1 Bulan")],
    "Wetv": [V("Private 1 Bulan"), V("Sharing 1 Bulan")],
    "Spotify": [V("Private 1 Bulan"), V("Sharing 1 Bulan")],
    "YouTube": [V("Premium 1 Bulan")],
    "Zoom Pro": [V("1 Bulan"), V("6 Bulan")],
    "Drama Box": [V("Private 1 Bulan")],
    "Gemini": [V("Pro 1 Bulan")],
    "CHAT GPT": [V("Plus 1 Bulan")],
    "Perplexity": [V("Pro 1 Bulan")],
    "GET CONTACT": [V("Premium 1 Bulan")],

    // Game
    "Diamond ML": [V("Top Up 86 Diamond"), V("Top Up 172 Diamond")],
    "Diamond FF": [V("Top Up 12 Diamond"), V("Top Up 50 Diamond")],

    // Pulsa
    "Pulsa Telkomsel": [V("Pulsa 25K"), V("Pulsa 50K")],
    "Pulsa IM3": [V("Pulsa 25K"), V("Pulsa 50K")],
    "Pulsa AXIS": [V("Pulsa 25K"), V("Pulsa 50K")],
    "Pulsa XL": [V("Pulsa 25K"), V("Pulsa 50K")],
    "Pulsa By.U": [V("Pulsa 25K"), V("Pulsa 50K")],

    // Paket Data
    "Paket Data Telkomsel": [V("5 GB"), V("10 GB")],
    "Paket Data IM3": [V("5 GB"), V("10 GB")],
    "Paket Data AXIS": [V("5 GB"), V("10 GB")],
    "Paket Data XL": [V("5 GB"), V("10 GB")],
    "Paket Data By.U": [V("5 GB"), V("10 GB")],

    // Suntik Sosmed
    "Suntik Instagram": [V("1000 Followers"), V("5000 Followers")],
    "Suntik Tiktok": [V("1000 Followers"), V("5000 Followers")],
  };

  // 3) Insert dalam transaksi (cepat & atomic)
  const insertProduct = db.prepare(
    "INSERT INTO products (name, category, image, stock) VALUES (?,?,?,0)"
  );
  const insertVariant = db.prepare(
    "INSERT INTO product_variants (product_id, title, price, stock) VALUES (?,?,?,?)"
  );
  const syncProduct = db.prepare(`
    UPDATE products
    SET stock = (
      SELECT COALESCE(SUM(stock),0)
      FROM product_variants
      WHERE product_id = ?
    )
    WHERE id = ?
  `);

  const tx = db.transaction(() => {
    for (const p of products) {
      const res = insertProduct.run(p.name, p.category, p.image);
      const pid = res.lastInsertRowid;

      // varian untuk produk tsb (jika tidak ada, biarkan kosong)
      (variants[p.name] || []).forEach(v =>
        insertVariant.run(pid, v.title, v.price, v.stock)
      );

      // hitung & set total stok
      syncProduct.run(pid, pid);
    }
  });

  tx();
  console.log("✅ Seeding full catalog: DONE");
})();

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

// ✅ Get Products with Variants
app.get("/api/products", (req, res) => {
  const products = db.prepare("SELECT * FROM products").all();
  const variants = db.prepare("SELECT * FROM product_variants").all();

  const map = {};
  products.forEach(p => (map[p.id] = { ...p, variants: [] }));
  variants.forEach(v => map[v.product_id]?.variants.push(v));

  res.json(Object.values(map));
});

// Replace endpoint POST /api/orders menjadi ini:
app.post("/api/orders", (req, res) => {
  const { product_id, variant_id, name, contact, method, total } = req.body;
  const createdAt = new Date().toISOString();

  // Buat order
  const q = db.prepare(`
    INSERT INTO orders (product_id, variant_id, name, contact, method, total, createdAt)
    VALUES (?,?,?,?,?,?,?)
  `);

  const result = q.run(product_id, variant_id, name, contact, method, total, createdAt);

  // Kurangi stok varian -1
  db.prepare(`
    UPDATE product_variants SET stock = stock - 1 WHERE id = ?
  `).run(variant_id);

  // Sync stok produk total
  db.prepare(`
    UPDATE products
    SET stock = (
      SELECT COALESCE(SUM(stock), 0)
      FROM product_variants WHERE product_id = ?
    )
    WHERE id = ?
  `).run(product_id, product_id);

  res.json({ id: result.lastInsertRowid, stockAdjusted: true });
});


// ✅ GET DETAIL ORDER BY ID
app.get("/api/orders/:id", (req, res) => {
  const id = req.params.id;
  const sql = `
    SELECT o.*, 
      p.name AS product_name,
      v.title AS variant_title,
      v.price AS variant_price
    FROM orders o
    LEFT JOIN products p ON o.product_id = p.id
    LEFT JOIN product_variants v ON o.variant_id = v.id
    WHERE o.id = ?
  `;

  const row = db.prepare(sql).get(id);

  if (!row) {
    return res.json({ error: "Order tidak ditemukan" });
  }

  row.formattedId = "NV" + String(row.id).padStart(5, "0");

  res.json(row);
});

// ✅ Web UI Route
app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ================= ADMIN API =================

// ✅ Ambil semua produk + varian (PROTECTED)
app.get("/api/admin/products", verifyToken, (req, res) => {
  const products = db.prepare("SELECT * FROM products").all();
  const variants = db.prepare("SELECT * FROM product_variants").all();

  const map = {};
  products.forEach(p => map[p.id] = { ...p, variants: [] });
  variants.forEach(v => map[v.product_id]?.variants.push(v));

  res.json(Object.values(map));
});

// ✅ Ambil semua pesanan (PROTECTED)
app.get("/api/admin/orders", verifyToken, (req, res) => {
  const rows = db.prepare(`
    SELECT o.*, p.name AS product_name, v.title AS variant_title
    FROM orders o
    LEFT JOIN products p ON p.id = o.product_id
    LEFT JOIN product_variants v ON v.id = o.variant_id
    ORDER BY o.id DESC
  `).all();
  res.json(rows);
});

// ✅ Update Status Pesanan
app.post("/api/admin/orders/:id/status", verifyToken, (req, res) => {
  const { status } = req.body;
  db.prepare("UPDATE orders SET status=? WHERE id=?")
    .run(status, req.params.id);
  res.json({ success: true });
});

// ✅ Update produk
app.put("/api/admin/product/:id", verifyToken, (req, res) => {
  const { name, category, image, stock } = req.body;
  db.prepare(`
    UPDATE products SET name=?, category=?, image=?, stock=? 
    WHERE id=?
  `).run(name, category, image, stock, req.params.id);
  res.json({ success: true });
});

// ✅ Tambah varian
app.post("/api/admin/product/:id/variant", verifyToken, (req, res) => {
  const { title, price } = req.body;
  db.prepare(`
    INSERT INTO product_variants (product_id, title, price, stock)
    VALUES (?,?,?,10)
  `).run(req.params.id, title, price);
  res.json({ success: true });
});

// ✅ Hapus varian
app.delete("/api/admin/variant/:id", verifyToken, (req, res) => {
  db.prepare("DELETE FROM product_variants WHERE id=?")
    .run(req.params.id);
  res.json({ success: true });
});

app.put("/api/admin/variant/:id", verifyToken, (req, res) => {
  const { title, price, stock } = req.body;
  const variantId = req.params.id;

  // Update varian
  db.prepare(
    "UPDATE product_variants SET title=?, price=?, stock=? WHERE id=?"
  ).run(title, price, stock, variantId);

  // Ambil product_id terkait
  const row = db.prepare(
    "SELECT product_id FROM product_variants WHERE id=?"
  ).get(variantId);

  if (row) {
    // Sync ulang stok total produk
    db.prepare(`
      UPDATE products
      SET stock = (
        SELECT COALESCE(SUM(stock), 0)
        FROM product_variants
        WHERE product_id = ?
      )
      WHERE id = ?
    `).run(row.product_id, row.product_id);
  }

  res.json({ updated: true, stockSynced: true });
});

// ✅ Run Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server berjalan di PORT ${PORT}`));
