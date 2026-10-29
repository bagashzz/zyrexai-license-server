
const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const crypto = require("node:crypto");

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "16kb" }));

const PORT = Number(process.env.PORT || 3000);
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      })
    : null;

function hashSerial(serial) {
  return crypto
    .createHash("sha256")
    .update(serial.trim(), "utf8")
    .digest("hex");
}

function validSerial(serial) {
  return (
    typeof serial === "string" &&
    serial.trim().length > 0 &&
    serial.trim().length <= 256
  );
}

function requireDatabase(req, res, next) {
  if (!supabase) {
    return res.status(503).json({
      error: "Database configuration missing"
    });
  }
  next();
}

function requireAdmin(req, res, next) {
  const provided =
    req.get("x-admin-key") ||
    (req.get("authorization") || "").replace(/^Bearer\s+/i, "");

  if (
    !ADMIN_API_KEY ||
    typeof provided !== "string" ||
    Buffer.byteLength(provided) !== Buffer.byteLength(ADMIN_API_KEY) ||
    !crypto.timingSafeEqual(
      Buffer.from(provided),
      Buffer.from(ADMIN_API_KEY)
    )
  ) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "zyrexai-license-server"
  });
});

async function verifyLicense(req, res) {
  const serial = req.body?.serial;

  if (!validSerial(serial)) {
    return res.status(400).json({
      licensed: false,
      error: "Invalid serial"
    });
  }

  if (!supabase) {
    return res.status(503).json({
      licensed: false,
      error: "Server not configured"
    });
  }

  try {
    const { data, error } = await supabase
      .from("zyrex_licenses")
      .select("active")
      .eq("serial_hash", hashSerial(serial))
      .maybeSingle();

    if (error) throw error;

    return res.json({
      licensed: data?.active === true
    });
  } catch (error) {
    console.error("Verification failed:", error.message);
    return res.status(500).json({
      licensed: false,
      error: "Verification failed"
    });
  }
}

app.post("/v1/verify", verifyLicense);
app.post("/api/license/verify", verifyLicense);

app.post(
  "/api/admin/licenses",
  requireDatabase,
  requireAdmin,
  async (req, res) => {
    const serial = req.body?.serial;

    if (!validSerial(serial)) {
      return res.status(400).json({ error: "Invalid serial" });
    }

    try {
      const cleanSerial = serial.trim();
      const masked =
        cleanSerial.length <= 4
          ? "****"
          : "*".repeat(Math.min(cleanSerial.length - 4, 24)) +
            cleanSerial.slice(-4);

      const { error } = await supabase
        .from("zyrex_licenses")
        .upsert(
          {
            serial_hash: hashSerial(cleanSerial),
            masked_serial: masked,
            active: true,
            note:
              typeof req.body.note === "string"
                ? req.body.note.slice(0, 200)
                : null
          },
          { onConflict: "serial_hash" }
        );

      if (error) throw error;

      return res.json({
        success: true,
        message: "License activated"
      });
    } catch (error) {
      console.error("Activation failed:", error.message);
      return res.status(500).json({
        error: "Could not activate license"
      });
    }
  }
);

app.post(
  "/api/admin/licenses/revoke",
  requireDatabase,
  requireAdmin,
  async (req, res) => {
    const serial = req.body?.serial;

    if (!validSerial(serial)) {
      return res.status(400).json({ error: "Invalid serial" });
    }

    try {
      const { data, error } = await supabase
        .from("zyrex_licenses")
        .update({ active: false })
        .eq("serial_hash", hashSerial(serial))
        .select("id");

      if (error) throw error;

      return res.json({
        success: true,
        revoked: data.length > 0
      });
    } catch (error) {
      console.error("Revocation failed:", error.message);
      return res.status(500).json({
        error: "Could not revoke license"
      });
    }
  }
);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`ZyrexAi license server listening on port ${PORT}`);
});
  
