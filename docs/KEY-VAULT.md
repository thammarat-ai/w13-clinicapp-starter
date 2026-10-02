# step-05 — Key Vault + Managed Identity (stretch)

> **สังเกตสำคัญ:** code ใน `server/` **ไม่เปลี่ยนเลย** จาก step-04
> เราเปลี่ยนแค่ว่า "ค่า `AZURE_SQL_CONNECTION_STRING` มาจากไหน" —
> นี่คือบทเรียนหลัก: ออกแบบให้อ่าน config จาก environment ตั้งแต่แรก (12-factor)
> วันที่ย้าย secret ไป Key Vault จึงไม่ต้องแก้ code

## ก่อน (step-00 → step-04)

```
App Service ── อ่าน env var ──► AZURE_SQL_CONNECTION_STRING
                                  = "Server=tcp:...;Password=Pl@inText!;..."
                                  ▲
                                  └── เห็นได้ใน Portal (คนที่มีสิทธิ์อ่าน config)
```

## หลัง (step-05)

```
┌─ Key Vault: kv-clinicapp-<user> ──────────┐
│  secret: sql-connection-string            │──┐
└───────────────────────────────────────────┘  │ resolve ตอน runtime
App Service (Managed Identity = ON)            │
  env: AZURE_SQL_CONNECTION_STRING             │
    = @Microsoft.KeyVault(SecretUri=...)  ◄────┘
```

## ขั้นตอน (ทำบน Portal 15 นาที)

1. **สร้าง Key Vault:** `key vaults` → + Create → `kv-clinicapp-<username>` (ชื่อไม่ซ้ำในโลก) · RG เดิม
2. **ใส่ secret:** Key Vault → Secrets → + Generate/Import → Name: `sql-connection-string` → Value: connection string จริง
3. **เปิด Managed Identity:** App Service → Settings → Identity → System assigned = **On** → Save
4. **ให้สิทธิ์อ่าน:** Key Vault → Access control (IAM) → Add role assignment → `Key Vault Secrets User` → ให้ Managed Identity ของ App Service
5. **เปลี่ยน env var:** App Service → Environment variables → แก้ `AZURE_SQL_CONNECTION_STRING` เป็น:

   ```
   @Microsoft.KeyVault(SecretUri=https://kv-clinicapp-<username>.vault.azure.net/secrets/sql-connection-string)
   ```

6. **รีสตาร์ท** แล้วเปิด `/doctors` — ถ้าเห็น JSON = secret resolve สำเร็จ ✅

## ตารางเปรียบเทียบ (ใช้ถามนิสิตตอนท้ายคาบ B)

| คำถาม | ก่อน (connection string ใน env) | หลัง (Key Vault reference) |
|-------|-------------------------------|---------------------------|
| secret อยู่ที่ไหน | App Service config (Portal เห็นได้) | Key Vault (แยก RBAC อีกชั้น) |
| เปลี่ยน password ต้องแก้กี่จุด | ทุก app ที่ใช้ | จุดเดียวใน Key Vault |
| ใครเห็นค่าได้ | ใครมีสิทธิ์อ่าน config ของ app | เฉพาะ identity ที่ได้รับ role |
| audit "ใครอ่าน secret" | ไม่มี | มี (Key Vault logs) |
| แก้ code ไหม | — | **ไม่ต้อง** |

## ถ้าทำแล้ว 503 / database_not_configured

1. Identity เปิดแล้วจริงไหม (ขั้น 3)
2. role ให้ถูก secret/ถูก vault ไหม (ขั้น 4) — สิทธิ์ propagate ช้า รอ 1–2 นาที
3. `SecretUri` ต้อง**ไม่มี / ท้ายสุด**และต้องเป็น URI ของ secret version หรือไม่มี version ก็ได้
4. ดู App Service → Diagnose and solve → "Key Vault reference status"
