# AniSticker — Custom Animated Emoji Order Platform

A full-stack Telegram Mini App for ordering custom animated emoji packs.  
**Stack:** React + Vite (GitHub Pages) · FastAPI + aiogram (Vultr VPS) · Supabase

---

## Architecture

```
Telegram
  └── Bot (@your_bot)
        └── Mini App button → GitHub Pages frontend
                                  └── API calls → FastAPI (Vultr VPS)
                                                      └── Supabase (DB + Storage)
```

---

## 1 · Supabase Setup

1. Create a project at https://supabase.com
2. Go to **SQL Editor** and run:
   - `supabase/schema.sql`
   - `supabase/storage.sql`
3. Go to **Settings → API** and copy:
   - `SUPABASE_URL`
   - `service_role` key → `SUPABASE_SERVICE_KEY`

---

## 2 · Telegram Bot Setup

1. Message @BotFather → `/newbot` → get `BOT_TOKEN`
2. Set Mini App URL:
   ```
   /newapp → choose your bot → set URL to https://HtunHlaAung.github.io/anisticker/
   ```
3. Enable inline mode if needed: `/setinline`

---

## 3 · Backend (Vultr VPS — Ubuntu 24.04)

### Install

```bash
# SSH into your VPS
ssh ubuntu@YOUR_VPS_IP

# Clone project
git clone https://github.com/HtunHlaAung/anisticker.git
cd anisticker

# Create virtualenv
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# Configure environment
cp backend/.env.example backend/.env
nano backend/.env   # fill in your values
```

### Configure `.env`

```env
BOT_TOKEN=7xxx:AAA...
OWNER_TELEGRAM_ID=1849257766
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
JWT_SECRET=your_very_long_random_secret_here
FRONTEND_URL=https://HtunHlaAung.github.io/anisticker
ALLOWED_ORIGINS=["https://HtunHlaAung.github.io","http://localhost:5173"]
```

### Start with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start API + Bot
pm2 start backend/ecosystem.config.js
pm2 save
pm2 startup   # follow printed command to enable on reboot

# Check logs
pm2 logs anisticker-api
pm2 logs anisticker-bot
```

### Nginx reverse proxy (HTTPS)

```bash
sudo apt install nginx certbot python3-certbot-nginx -y

# Create config
sudo nano /etc/nginx/sites-available/anisticker
```

Paste:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass         http://127.0.0.1:8000;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        client_max_body_size 20M;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/anisticker /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Issue SSL cert
sudo certbot --nginx -d api.yourdomain.com
```

> **No domain?** Use ngrok for dev:
> ```bash
> ngrok http 8000
> # copy the https URL → use as VITE_API_URL
> ```

---

## 4 · Frontend (GitHub Pages)

```bash
cd frontend

# Install deps
npm install

# Set API URL
cp .env.example .env
nano .env
# VITE_API_URL=https://api.yourdomain.com/api/v1

# Build
npm run build

# Deploy to GitHub Pages
# Option A: gh-pages package
npm run deploy

# Option B: push dist/ manually
# In your repo settings: Pages → Source → Deploy from branch → gh-pages
```

> In `vite.config.js`, make sure `base` matches your repo name:
> ```js
> base: "/anisticker/",
> ```

---

## 5 · Register Mini App with Telegram

```
Message @BotFather:
/mybots → your bot → Bot Settings → Menu Button → Edit menu button URL
→ https://HtunHlaAung.github.io/anisticker/
```

---

## 6 · First Login

1. Open your bot → tap **Open AniSticker**
2. Your Telegram ID (`1849257766`) is auto-promoted to **owner**
3. Go to the **Owner Panel** (⚙ icon top right)
4. Add categories, designs, payment methods

---

## User Flow

```
Open Mini App
  → Auto-login with Telegram
  → Design List (browse & multi-select)
  → CartBar (floating) → tap to proceed
  → Design Setup (logo, username, colors, custom text)
  → Payment (choose method, upload screenshot)
  → Order placed → owner notified via bot
  → Owner: accept/cancel in bot or dashboard
  → Customer: notified of status
  → Owner sets status "Done" when delivered
```

---

## File Structure

```
anisticker/
├── supabase/
│   ├── schema.sql          # all tables + RLS
│   └── storage.sql         # storage buckets
├── backend/
│   ├── main.py             # FastAPI app
│   ├── bot.py              # aiogram bot
│   ├── auth.py             # initData validation + JWT
│   ├── config.py           # settings
│   ├── database.py         # Supabase client
│   ├── models.py           # Pydantic models
│   ├── routes/
│   │   ├── auth.py
│   │   ├── categories.py
│   │   ├── designs.py
│   │   ├── orders.py
│   │   ├── payments.py
│   │   ├── users.py
│   │   └── upload.py
│   ├── requirements.txt
│   ├── .env.example
│   └── ecosystem.config.js # PM2
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── DesignList.jsx      # shop / home
    │   │   ├── DesignSetup.jsx     # logo + colors + text
    │   │   ├── Payment.jsx         # payment + screenshot
    │   │   ├── OrderConfirm.jsx    # success page
    │   │   ├── MyOrders.jsx        # customer order history
    │   │   ├── OwnerDashboard.jsx  # tabbed owner panel
    │   │   ├── OwnerOrders.jsx     # accept/cancel/done
    │   │   ├── OwnerDesigns.jsx    # CRUD designs
    │   │   ├── OwnerPayments.jsx   # CRUD payment methods
    │   │   ├── OwnerUsers.jsx      # role + ban management
    │   │   └── OwnerCategories.jsx # CRUD categories
    │   ├── components/
    │   │   ├── AnimationPreview.jsx  # lottie / TGS renderer
    │   │   ├── ColorPicker.jsx       # hex + HSV sliders
    │   │   ├── DesignCard.jsx        # grid card
    │   │   ├── CartBar.jsx           # floating cart bar
    │   │   ├── Modal.jsx             # bottom sheet
    │   │   └── Toast.jsx             # notifications
    │   ├── context/AppContext.jsx    # global state + cart
    │   ├── lib/
    │   │   ├── api.js          # axios client
    │   │   ├── telegram.js     # WebApp SDK helpers
    │   │   └── utils.js        # color, format helpers
    │   ├── index.css           # global styles (Telegram theme vars)
    │   ├── App.jsx             # router
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Notes

- **TGS files** (Telegram animated stickers) are gzip-compressed Lottie JSON. The `AnimationPreview` component handles decompression via `pako` automatically.
- **Colors** are stored as hex `#rrggbb`. The `ColorPicker` lets users input hex directly or adjust via HSV sliders.
- **JWT tokens** expire in 7 days; the frontend auto-refreshes them on next open.
- **Reseller pricing** — users with role `reseller` see the lower `reseller_price` on all designs.
- **Owner ID** is hardcoded to `1849257766` in `.env`; first login auto-promotes that Telegram account.
