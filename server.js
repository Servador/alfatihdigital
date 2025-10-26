import express from "express";
import sqlite3 from "sqlite3";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// ====== DATABASE ======
sqlite3.verbose();
const DB_FILE = path.join(__dirname, "db", "nava.db");
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) return console.error(err);
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

// ====== SEED DATA ======
db.serialize(() => {
  db.get("SELECT COUNT(*) as c FROM products", (err, row) => {
    if (row.c === 0) {
      console.log("⏳ Seeding Products & Variants...");

      const productsSeed = [
        { name: "Netflix Premium", category: "Aplikasi Premium", image: "img/netflix.png" },
        { name: "CapCut Pro", category: "Aplikasi Premium", image: "img/capcut.png" },
        { name: "Prime Video", category: "Aplikasi Premium", image: "img/prime.png" },
        { name: "Canva Pro", category: "Aplikasi Premium", image: "img/canva.png" },
        { name: "Disney", category: "Aplikasi Premium", image: "img/disney.png" },
        { name: "Vidio", category: "Aplikasi Premium", image: "img/vidio.png" },
        { name: "Diamond ML 86", category: "Game", image: "img/ml.png" },
        { name: "Diamond FF 12", category: "Game", image: "img/ff.png" },
        { name: "Pulsa Telkomsel", category: "Pulsa", image: "img/telkom.png" },
        { name: "Pulsa XL", category: "Pulsa", image: "img/xl.png" },
        { name: "Suntik Instagram", category: "Suntik Sosmed", image: "img/ig.png" },
        { name: "Suntik Tiktok", category: "Suntik Sosmed", image: "img/tiktok.png" },
        { name: "Paket Data XL", category: "Pulsa", image: "img/pdxl.png" },
        { name: "Paket Data Telkom", category: "Pulsa", image: "img/pdtelkom.png" },
        { name: "Pulsa By u", category: "Pulsa", image: "img/byu.png" },
        { name: "Paket Data By u", category: "Pulsa", image: "img/pdbyu.png" },
        { name: "Wetv", category: "Aplikasi Premium", image: "img/wetv.png" },
        { name: "Viu", category: "Aplikasi Premium", image: "img/viu.png" },
        { name: "Pulsa AXIS", category: "Pulsa", image: "img/axis.png" },
        { name: "Pulsa IM3", category: "Pulsa", image: "img/im3.png" },
        { name: "Paket Data AXIS", category: "Pulsa", image: "img/pdaxis.png" },
        { name: "Paket Data IM3", category: "Pulsa", image: "img/pdim3.png" },
        { name: "Zoom Pro", category: "Aplikasi Premium", image: "img/zoom.png" },
        { name: "Youtube", category: "Aplikasi Premium", image: "img/yt.png" },
        { name: "Spotify", category: "Aplikasi Premium", image: "img/spotify.png" },
        { name: "Drama Box", category: "Aplikasi Premium", image: "img/drama.png" },
        { name: "Gemini", category: "Aplikasi Premium", image: "img/gemini.png" },
        { name: "CHAT GPT", category: "Aplikasi Premium", image: "img/chatgpts.png" },
        { name: "Perplexity", category: "Aplikasi Premium", image: "img/perplexity.png" },
        { name: "GET CONTACT", category: "Aplikasi Premium", image: "img/gtc.png" },
      ];

      const variantsSeed = {
        "Netflix Premium": [
          { title: "Private 1 Bulan", price: 12000, stock: 10 },
          { title: "Semi Private 1 Bulan", price: 20000, stock: 10 },
          { title: "Sharing 1 Bulan", price: 8000, stock: 10 }
        ],
        "CapCut Pro": [
          { title: "1 Bulan", price: 5000, stock: 10 },
          { title: "6 Bulan", price: 25000, stock: 10 }
        ],
        "Diamond ML 86": [
          { title: "Top Up 86 Diamond", price: 17000, stock: 10 },
          { title: "Top Up 172 Diamond", price: 33000, stock: 10 }
        ],
        "Pulsa Telkomsel": [
          { title: "Pulsa 25K", price: 26000, stock: 10 },
          { title: "Pulsa 50K", price: 51000, stock: 10 }
        ],
        "Boost Instagram": [
          { title: "1000 Followers", price: 12000, stock: 10 },
          { title: "5000 Followers", price: 45000, stock: 10 }
        ],
        "Prime Video": [
          { title: "Private 1 Bulan", price: 12000, stock: 10 },
          { title: "Semi Private 1 Bulan", price: 20000, stock: 10 },
          { title: "Sharing 1 Bulan", price: 8000, stock: 10 }
        ],
        "Canva Pro": [
          { title: "Private 1 Bulan", price: 12000, stock: 10 },
          { title: "Semi Private 1 Bulan", price: 20000, stock: 10 },
          { title: "Sharing 1 Bulan", price: 8000, stock: 10 }
        ],
        "Diamond FF 12": [
          { title: "Private 1 Bulan", price: 12000, stock: 10 },
          { title: "Semi Private 1 Bulan", price: 20000, stock: 10 },
          { title: "Sharing 1 Bulan", price: 8000, stock: 10 }
        ],
        "Pulsa XL": [
          { title: "Pulsa 25K", price: 26000, stock: 10 },
          { title: "Pulsa 50K", price: 51000, stock: 10 }
        ],
        "Boost Tiktok": [
          { title: "1000 Followers", price: 12000, stock: 10 },
          { title: "5000 Followers", price: 45000, stock: 10 }
        ],
      };

      const prodStmt = db.prepare("INSERT INTO products (name, category, image) VALUES (?,?,?)");

      productsSeed.forEach(prod => {
        prodStmt.run(prod.name, prod.category, prod.image, function () {
          const productId = this.lastID;
          const vList = variantsSeed[prod.name] || [];

          const varStmt = db.prepare("INSERT INTO product_variants (product_id, title, price, stock) VALUES (?,?,?,?)");
          vList.forEach(v => varStmt.run(productId, v.title, v.price, v.stock));
          varStmt.finalize();

          syncProductStock(productId);
        });
      });

      prodStmt.finalize(() => {
        console.log("✅ Products & Variants SEED COMPLETE ✅");
      });
    }
  });
});

// ===== AUTH ADMIN MIDDLEWARE =====
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Token invalid" });
    req.user = decoded;
    next();
  });
}

// ===== AUTH ADMIN =====
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Email/Password salah" });
  }
  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "2h" });
  res.json({ token });
});

// ✅ Semua endpoint dibawah ini memerlukan Token
app.use("/api/admin", verifyToken);

// ✅ LIST ALL ORDERS FOR ADMIN
app.get("/api/admin/orders", (req, res) => {
  const sql = `
    SELECT o.*, p.name AS product_name, v.title AS variant_title
    FROM orders o
    LEFT JOIN products p ON o.product_id = p.id
    LEFT JOIN product_variants v ON o.variant_id = v.id
    ORDER BY o.id DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ✅ UPDATE STOK PRODUK SETIAP VARIAN DIEDIT
app.put("/api/admin/variant/:id", (req, res) => {
  const { title, price, stock } = req.body;
  const sql = "UPDATE product_variants SET title=?, price=?, stock=? WHERE id=?";
  
  db.run(sql, [title, price, stock, req.params.id], function () {
    db.get("SELECT product_id FROM product_variants WHERE id=?", [req.params.id], (_, r) => {
      if (r) syncProductStock(r.product_id);
    });
    res.json({ updated: this.changes });
  });
});

// ✅ ADD VARIANT
app.post("/api/admin/product/:id/variant", (req, res) => {
  const { title, price, stock } = req.body;
  db.run(
    "INSERT INTO product_variants (product_id, title, price, stock) VALUES (?,?,?,?)",
    [req.params.id, title, price, stock ?? 0],
    function () {
      syncProductStock(req.params.id);
      res.json({ id: this.lastID });
    }
  );
});

// ✅ DELETE VARIANT
app.delete("/api/admin/variant/:id", (req, res) => {
  db.get("SELECT product_id FROM product_variants WHERE id=?", [req.params.id], (e, r) => {
    const pid = r?.product_id;
    db.run("DELETE FROM product_variants WHERE id=?", [req.params.id], function () {
      if (pid) syncProductStock(pid);
      res.json({ deleted: this.changes });
    });
  });
});

// ====== FRONTEND PRODUCTS ======
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

      // ✅ Hitung ulang total stok dari varian
      const totalStock = r.variants.reduce((sum, v) => sum + (v.stock ?? 0), 0);
      r.stock = totalStock;

      // ✅ Simpan agar konsisten
      db.run("UPDATE products SET stock=? WHERE id=?", [totalStock, r.id]);
    });

    res.json(rows);
  });
});

// ====== ADMIN LIST PRODUCTS ======
app.get("/api/admin/products", (req,res)=>{
  db.all("SELECT * FROM products", [], (_, products)=>{
    db.all("SELECT * FROM product_variants", [], (_, variants)=>{
      const map={}; products.forEach(p=>map[p.id]={...p, variants:[]});
      variants.forEach(v=>map[v.product_id]?.variants.push(v));
      res.json(Object.values(map));
    });
  });
});

app.get("/admin", (req,res)=>{
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.redirect("/login.html");
  
  jwt.verify(token, JWT_SECRET,(err)=>{
    if(err) return res.redirect("/login.html");
    res.sendFile(path.join(__dirname,"public","admin.html"));
  });
});

// ✅ SIMPAN ORDER (CUSTOMER)
app.post("/api/orders", (req, res) => {
  const { product_id, variant_id, name, contact, total, method } = req.body;
  const createdAt = new Date().toISOString();

  db.run(
    `INSERT INTO orders (product_id, variant_id, name, contact, method, total, createdAt)
     VALUES (?,?,?,?,?,?,?)`,
    [product_id, variant_id, name, contact, method, total, createdAt],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      const newId = this.lastID;

      // ✅ LANGSUNG KURANGI STOK DI SINI
      db.run(
        "UPDATE product_variants SET stock = stock - 1 WHERE id = ?",
        [variant_id],
        () => {
          syncProductStock(product_id); // update stok total produk
          res.json({ id: newId, stockAdjusted: true });
        }
      );
    }
  );
});


// ✅ ADMIN UPDATE STATUS ORDER (dengan normalisasi & urutan aman)
app.post("/api/admin/orders/:id/status", verifyToken, (req, res) => {
  const requested = (req.body?.status ?? "").toString().toLowerCase();
  const allowed = ["pending", "paid", "done", "canceled"];
  const status = allowed.includes(requested) ? requested : "pending";

  // 1) Ambil data order (butuh variant_id & product_id)
  db.get(
    "SELECT variant_id, product_id FROM orders WHERE id = ?",
    [req.params.id],
    (err, row) => {
      if (err) {
        console.log("❌ ORDER LOOKUP ERROR:", err.message);
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        console.log("❌ ORDER NOT FOUND:", req.params.id);
        return res.status(404).json({ error: "Order tidak ditemukan" });
      }

      const { variant_id, product_id } = row;

      // 2) Update status order
      db.run(
        "UPDATE orders SET status = ? WHERE id = ?",
        [status, req.params.id],
        function (err2) {
          if (err2) {
            console.log("❌ ERROR UPDATE STATUS:", err2.message);
            return res.status(500).json({ error: err2.message });
          }

          console.log("✅ STATUS UPDATE:", status, "| Order ID:", req.params.id, "| rows:", this.changes);

          // 3) Kurangi stok HANYA ketika status = 'paid'
          if (status !== "paid") {
            // Tidak ada pengurangan stok
            return res.json({ updated: this.changes, stockAdjusted: false });
          }

          // 3a) Kurangi stok varian (pastikan non-negatif secara logis)
          db.run(
            "UPDATE product_variants SET stock = stock - 1 WHERE id = ?",
            [variant_id],
            function (err3) {
              if (err3) {
                console.log("❌ ERROR DECREASE VARIANT STOCK:", err3.message);
                return res.status(500).json({ error: err3.message });
              }
              console.log("✅ VARIANT STOCK -1 | variant_id:", variant_id, "| rows:", this.changes);

              // 3b) Sync total stok produk (sum semua varian)
              db.run(
                `
                UPDATE products
                SET stock = (
                  SELECT COALESCE(SUM(stock), 0)
                  FROM product_variants
                  WHERE product_id = ?
                )
                WHERE id = ?
                `,
                [product_id, product_id],
                function (err4) {
                  if (err4) {
                    console.log("❌ ERROR SYNC PRODUCT STOCK:", err4.message);
                    return res.status(500).json({ error: err4.message });
                  }
                  console.log("✅ PRODUCT STOCK SYNCED | product_id:", product_id);

                  // 4) Selesai
                  return res.json({ updated: 1, stockAdjusted: true });
                }
              );
            }
          );
        }
      );
    }
  );
});


// ✅ GET ORDER BY ID — Untuk cek pesanan customer
app.get("/api/orders/:id", (req, res) => {
  const sql = `
    SELECT o.*, p.name AS product_name, v.title AS variant_title
    FROM orders o
    LEFT JOIN products p ON o.product_id = p.id
    LEFT JOIN product_variants v ON o.variant_id = v.id
    WHERE o.id = ?
  `;

  db.get(sql, [req.params.id], (err, row) => {
    if (err) {
      console.log("❌ QUERY ERROR:", err.message);
      return res.status(500).json({ error: err.message });
    }

    if (!row) return res.json({ error: "Order tidak ditemukan" });

    row.formattedId = "NV" + String(row.id).padStart(5, "0");
    res.json(row);
  });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`🚀 http://localhost:${PORT}`));
