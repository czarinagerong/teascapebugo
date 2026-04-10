import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

app.use(cors({ origin: process.env.FRONTEND_URL, methods: ["GET","POST","PATCH","DELETE","OPTIONS"], allowedHeaders: ["Content-Type","Authorization"] }));
app.use(express.json({ limit: "10mb" }));

const orderLimiter = rateLimit({ windowMs: 15*60*1000, max: 10, message: { error: "Too many orders. Please wait 15 minutes." } });
const loginLimiter = rateLimit({ windowMs: 15*60*1000, max: 10, message: { error: "Too many login attempts. Please wait 15 minutes." } });

app.get("/", (_req, res) => res.json({ status: "Teascape backend running" }));

// ── Store status (public) ─────────────────────────────────────────────────────
app.get("/store/status", async (_req, res) => {
  try {
    const { data } = await supabase.from("store_settings").select("key,value");
    const map = {};
    (data||[]).forEach((r) => { map[r.key] = r.value; });
    res.json({ isOpen: map["is_open"] !== "false", closeReason: map["close_reason"] || "" });
  } catch { res.status(500).json({ error: "Server error." }); }
});

// ── Store toggle (staff) ──────────────────────────────────────────────────────
app.patch("/staff/store", verifyToken, async (req, res) => {
  try {
    const { isOpen, closeReason } = req.body;
    await supabase.from("store_settings").upsert([
      { key: "is_open", value: String(isOpen), updated_at: new Date() },
      { key: "close_reason", value: closeReason || "", updated_at: new Date() },
    ]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Server error." }); }
});

// ── Public menu items (DB-added items only) ───────────────────────────────────
app.get("/menu/items", async (_req, res) => {
  try {
    const { data, error } = await supabase.from("menu_items").select("*").order("category").order("name");
    if (error) return res.status(500).json({ error: "Failed." });
    res.json(data);
  } catch { res.status(500).json({ error: "Server error." }); }
});

// ── Menu availability (public) ────────────────────────────────────────────────
app.get("/menu/availability", async (_req, res) => {
  try {
    const { data, error } = await supabase.from("menu_availability").select("item_id,type,name,available");
    if (error) return res.status(500).json({ error: "Failed." });
    res.json(data);
  } catch { res.status(500).json({ error: "Server error." }); }
});

// ── Menu availability (staff) ─────────────────────────────────────────────────
app.get("/staff/menu/availability", verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase.from("menu_availability").select("*").order("item_id").order("type").order("name");
    if (error) return res.status(500).json({ error: "Failed." });
    res.json(data);
  } catch { res.status(500).json({ error: "Server error." }); }
});

app.patch("/staff/menu/availability", verifyToken, async (req, res) => {
  try {
    const { item_id, type, name, available } = req.body;
    if (!item_id || !type || !name) return res.status(400).json({ error: "Missing fields." });
    const { error } = await supabase.from("menu_availability").upsert([{ item_id, type, name, available, updated_at: new Date() }], { onConflict: "item_id,type,name" });
    if (error) return res.status(500).json({ error: "Failed." });
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Server error." }); }
});

// ── Receipt upload ────────────────────────────────────────────────────────────
app.post("/upload/receipt", async (req, res) => {
  try {
    const { base64, orderId, mimeType } = req.body;
    if (!base64 || !orderId) return res.status(400).json({ error: "Missing fields." });
    const buffer = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ""), "base64");
    const ext = (mimeType||"image/jpeg").includes("png") ? "png" : "jpg";
    const fileName = `${orderId}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("receipts").upload(fileName, buffer, { contentType: mimeType||"image/jpeg", upsert: true });
    if (error) return res.status(500).json({ error: "Failed to upload." });
    const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(fileName);
    res.json({ url: urlData.publicUrl });
  } catch { res.status(500).json({ error: "Server error." }); }
});

// ── Menu image upload ─────────────────────────────────────────────────────────
app.post("/upload/menu-image", verifyToken, async (req, res) => {
  try {
    const { base64, mimeType } = req.body;
    if (!base64) return res.status(400).json({ error: "Missing image data." });
    const buffer = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ""), "base64");
    const ext = (mimeType || "image/jpeg").includes("png") ? "png" : "jpg";
    const fileName = `menu-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("menu-images").upload(fileName, buffer, { contentType: mimeType || "image/jpeg", upsert: true });
    if (error) return res.status(500).json({ error: "Failed to upload." });
    const { data: urlData } = supabase.storage.from("menu-images").getPublicUrl(fileName);
    res.json({ url: urlData.publicUrl });
  } catch { res.status(500).json({ error: "Server error." }); }
});

// ── Orders ────────────────────────────────────────────────────────────────────
app.post("/orders", orderLimiter, async (req, res) => {
  try {
    const { id, customer_name, phone, items, total, payment, order_type, status, address, pickup_time, special_notes, receipt_url } = req.body;
    if (!id||!customer_name||!phone||!items||!total||!payment||!order_type) return res.status(400).json({ error: "Missing required fields." });
    const { data: existing } = await supabase.from("orders").select("id").eq("id", id).maybeSingle();
    if (existing) return res.status(409).json({ error: "Order already exists.", id });
    const { error } = await supabase.from("orders").insert([{ id, customer_name, phone, items, total, payment, order_type, status: status||"Payment Pending", address: address||null, pickup_time: pickup_time||null, special_notes: special_notes||null, receipt_url: receipt_url||null }]);
    if (error) { console.error("[POST /orders]", error); return res.status(500).json({ error: "Failed to save order." }); }
    res.status(201).json({ success: true, id });
  } catch { res.status(500).json({ error: "Server error." }); }
});

app.patch("/orders/:id/receipt", async (req, res) => {
  try {
    const { error } = await supabase.from("orders").update({ receipt_url: req.body.receipt_url }).eq("id", req.params.id);
    if (error) return res.status(500).json({ error: "Failed." });
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Server error." }); }
});

// ── Cancel order ─────────────────────────
app.delete("/orders/:id", async (req, res) => {
  try {
    const { data: order } = await supabase.from("orders").select("status").eq("id", req.params.id).maybeSingle();
    if (!order) return res.status(404).json({ error: "Order not found." });
    if (order.status !== "Payment Pending") return res.status(400).json({ error: "Order cannot be cancelled at this stage. Please contact us." });
    await supabase.from("orders").delete().eq("id", req.params.id);
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Server error." }); }
});

app.get("/orders/:query", async (req, res) => {
  try {
    const q = req.params.query.trim();
    let { data, error } = await supabase.from("orders").select("*").eq("id", q.toUpperCase()).maybeSingle();
    if (!data && !error) {
      const r = await supabase.from("orders").select("*").eq("phone", q).order("created_at",{ascending:false}).limit(1).maybeSingle();
      data=r.data; error=r.error;
    }
    if (error) return res.status(500).json({ error: "Failed." });
    if (!data) return res.status(404).json({ error: "Order not found." });
    res.json(mapOrder(data));
  } catch { res.status(500).json({ error: "Server error." }); }
});

app.get("/staff/orders", verifyToken, async (_req, res) => {
  try {
    const { data, error } = await supabase.from("orders").select("*").order("created_at",{ascending:false});
    if (error) return res.status(500).json({ error: "Failed." });
    res.json(data.map(mapOrder));
  } catch { res.status(500).json({ error: "Server error." }); }
});

// ── JWT ─────────────────────────────────
function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized." });
  try { req.staff = jwt.verify(auth.slice(7), process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ error: "Invalid or expired token." }); }
}

// ✅ UPDATED FUNCTION ONLY
function mapOrder(data) {
  return {
    id: data.id,
    customer: data.customer_name,
    phone: data.phone,
    items: data.items,
    total: data.total,
    payment: data.payment,
    type: data.order_type,
    time: data.created_at
      ? new Date(data.created_at).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })
      : "",
    created_at: data.created_at,
    status: data.status,
    address: data.address,
    pickupTime: data.pickup_time,
    specialNotes: data.special_notes,
    receiptImage: data.receipt_url,
  };
}

// ── Staff Login ───────────────────────────────────────────────────────────────
app.post("/staff/login", loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Missing credentials." });
    const { data: staff } = await supabase.from("staff_accounts").select("*").eq("username", username.trim()).maybeSingle();
    if (!staff) return res.status(401).json({ error: "Invalid username or password." });
    const valid = await bcrypt.compare(password, staff.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid username or password." });
    const token = jwt.sign({ id: staff.id, username: staff.username }, process.env.JWT_SECRET, { expiresIn: "12h" });
    res.json({ token, username: staff.username });
  } catch { res.status(500).json({ error: "Server error." }); }
});

// ── Staff order status update ─────────────────────────────────────────────────
app.patch("/staff/orders/:id", verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["Payment Pending","Payment Confirmed","Preparing","Delivering / Ready for Pickup","Delivered"];
    if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status." });
    const { error } = await supabase.from("orders").update({ status, updated_at: new Date() }).eq("id", req.params.id);
    if (error) return res.status(500).json({ error: "Failed." });
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Server error." }); }
});

// ── Staff Menu routes ─────────────────────────────────────────────────────────
app.get("/staff/menu", verifyToken, async (_req, res) => {
  try {
    const { data, error } = await supabase.from("menu_items").select("*").order("category").order("name");
    if (error) return res.status(500).json({ error: "Failed." });
    res.json(data);
  } catch { res.status(500).json({ error: "Server error." }); }
});

app.post("/staff/menu", verifyToken, async (req, res) => {
  try {
    const { name, category, price, description, available, image_url, price_m, price_l, sizes, flavors, addons } = req.body;
    if (!name || !category || !price) return res.status(400).json({ error: "Missing required fields." });
    const id = `${category.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
    const { error } = await supabase.from("menu_items").insert([{
      id, name, category,
      price: String(price),
      description: description || null,
      available: available !== false,
      image_url: image_url || null,
      price_m: price_m || null,
      price_l: price_l || null,
      sizes: JSON.stringify(sizes || []),
      flavors: JSON.stringify(flavors || []),
      addons: JSON.stringify(addons || []),
    }]);
    if (error) return res.status(500).json({ error: "Failed." });
    res.status(201).json({ success: true, id });
  } catch { res.status(500).json({ error: "Server error." }); }
});

app.patch("/staff/menu/:id", verifyToken, async (req, res) => {
  try {
    const { error } = await supabase.from("menu_items").update(req.body).eq("id", req.params.id);
    if (error) return res.status(500).json({ error: "Failed." });
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Server error." }); }
});

app.delete("/staff/menu/:id", verifyToken, async (req, res) => {
  try {
    const { error } = await supabase.from("menu_items").delete().eq("id", req.params.id);
    if (error) return res.status(500).json({ error: "Failed." });
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Server error." }); }
});

// ── Staff Inventory routes ────────────────────────────────────────────────────
app.get("/staff/inventory/logs", verifyToken, async (_req, res) => {
  try {
    const { data, error } = await supabase.from("inventory_logs").select("*").order("created_at", { ascending: false }).limit(100);
    if (error) return res.status(500).json({ error: "Failed." });
    res.json(data);
  } catch { res.status(500).json({ error: "Server error." }); }
});

app.get("/staff/inventory", verifyToken, async (_req, res) => {
  try {
    const { data, error } = await supabase.from("inventory").select("*").order("category").order("item");
    if (error) return res.status(500).json({ error: "Failed." });
    res.json(data);
  } catch { res.status(500).json({ error: "Server error." }); }
});

app.post("/staff/inventory", verifyToken, async (req, res) => {
  try {
    const { item, category, stock, unit, min_stock } = req.body;
    if (!item || !unit) return res.status(400).json({ error: "Missing required fields." });
    const id = `inv-${Date.now()}`;
    const { error } = await supabase.from("inventory").insert([{ id, item, category: category || "General", stock: stock || 0, unit, min_stock: min_stock || 5 }]);
    if (error) return res.status(500).json({ error: "Failed." });
    res.status(201).json({ success: true, id });
  } catch { res.status(500).json({ error: "Server error." }); }
});

app.patch("/staff/inventory/:id", verifyToken, async (req, res) => {
  try {
    const { qty, type } = req.body;
    if (!qty || !type) return res.status(400).json({ error: "Missing fields." });
    const { data: current } = await supabase.from("inventory").select("stock,item,unit").eq("id", req.params.id).maybeSingle();
    if (!current) return res.status(404).json({ error: "Item not found." });
    const newStock = type === "add" ? current.stock + qty : Math.max(0, current.stock - qty);
    await supabase.from("inventory").update({ stock: newStock, updated_at: new Date() }).eq("id", req.params.id);
    await supabase.from("inventory_logs").insert([{
      item_id: req.params.id, item_name: current.item,
      type: type === "add" ? "Added" : "Deducted",
      qty, remaining: newStock, unit: current.unit, staff: "Staff",
    }]);
    res.json({ newStock });
  } catch { res.status(500).json({ error: "Server error." }); }
});

app.delete("/staff/inventory/:id", verifyToken, async (req, res) => {
  try {
    const { error } = await supabase.from("inventory").delete().eq("id", req.params.id);
    if (error) return res.status(500).json({ error: "Failed." });
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Server error." }); }
});

// ── Reviews (public) ──────────────────────────────────────────────────────────
app.get("/reviews", async (_req, res) => {
  try {
    const { data, error } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: "Failed." });
    res.json(data);
  } catch { res.status(500).json({ error: "Server error." }); }
});

app.post("/reviews", async (req, res) => {
  try {
    const { name, rating, text } = req.body;
    if (!name || !rating || !text) return res.status(400).json({ error: "Missing fields." });
    const { data, error } = await supabase.from("reviews").insert([{ name, rating, text }]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch { res.status(500).json({ error: "Server error." }); }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Teascape backend running on port ${PORT}`));