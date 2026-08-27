# Deploy — Oracle Cloud Free Tier (xavfsiz sozlama)

Nega bu variant: Oracle Cloud "Always Free" VM vaqt chegarasiz bepul (30 kunlik
sinov emas). Polling rejimi o'zgarishsiz ishlaydi — webhook shart emas.
Noutbuk yopilsa ham server 24/7 ishlab turadi.

Bu qo'llanma hozircha **domensiz, faqat kerak bo'lgan tarmoqqa cheklangan**
holatga mo'ljallangan, lekin keyinchalik domen qo'shilib to'liq HTTPS'ga
o'tish oson bo'ladigan qilib qurilgan (nginx boshidanoq bor — faqat
sertifikat keyinroq qo'shiladi).

Arxitektura: `internet → [Oracle Security List firewall] → [ufw firewall] →
nginx (80-port) → Node/Express (faqat 127.0.0.1:3000, tashqaridan
ko'rinmaydi)`. Bot (`bot/index.js`) hech qanday portni tinglamaydi — u
faqat chiqish (outbound) ulanish orqali Telegramga polling qiladi.

## 1. VM yaratish

1. https://www.oracle.com/cloud/free/ da hisob oching (Always Free
   resurslar uchun pul yechilmaydi).
2. Console → Compute → Instances → **Create Instance**.
3. Image: **Ubuntu 22.04**, Shape: **Always Free** deb belgilangan birini
   tanlang.
4. SSH kalit juftligini yarating/yuklang, saqlang.
5. Instance yaratilgach: **Networking → reserve a Public IP** (ephemeral
   emas, "Reserved") — shunda IP manzil o'zgarmay qoladi (MongoDB Atlas
   whitelist va keyingi DNS uchun muhim).

## 2. Serverga ulanish va asosiy tayyorlash

```bash
ssh -i <kalit.pem> ubuntu@<PUBLIC_IP>

sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx fail2ban unattended-upgrades ufw
sudo npm install -g pm2
```

### Xavfsizlik yangilanishlari avtomatik

```bash
sudo dpkg-reconfigure -plow unattended-upgrades   # "Yes" tanlang
```

### Swap (agar VM shape 1GB RAM bo'lsa — E2.1.Micro)

Ampere A1 (6-24GB RAM) shape tanlagan bo'lsangiz shart emas, lekin
zarar qilmaydi:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### fail2ban (SSH'ga qo'pol kuch hujumidan himoya)

Standart sozlamalar SSH uchun yetarli — `sudo apt install fail2ban` bilan
o'rnatilgach avtomatik ishlaydi (`sudo systemctl status fail2ban` bilan
tekshiring).

### ufw (ichki firewall — Oracle Security List'ga QO'SHIMCHA qatlam)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw enable
```

**Diqqat:** 3000-port BU YERDA ochilmaydi — Express `127.0.0.1`da
tinglaydi (kod ichida standart), tashqaridan faqat nginx (80-port)
orqali kirish mumkin.

### Oracle Security List (tashqi firewall, VCN sozlamalarida)

Console → VM → Subnet → **Security List** → Ingress Rules:

- `22/tcp` — manba: faqat sizning statik IP'ingiz (bor bo'lsa) yoki
  vaqtincha `0.0.0.0/0` (fail2ban + kalit-bilan-kirish bilan birga
  qabul qilinadi, lekin IP'ingiz bilan cheklash yaxshiroq).
- `80/tcp` — agar kassir stansiyasi **tashqaridan** kirishi kerak bo'lsa
  manbani shu ehtiyojga qarab belgilang (oshxona/kassir IP'si yoki
  `0.0.0.0/0`, agar chinakam ochiq bo'lishi kerak bo'lsa).
  **Agar kassir stansiyasi FAQAT oshxona ichida ishlatilsa — bu qoidani
  butunlay qo'shmang**, shunda API internetdan umuman ko'rinmaydi
  (eng xavfsiz holat), kassir kompyuteri esa VM bilan bir xil
  VCN/VPN orqali yoki mahalliy tarmoqdagi boshqa yechim orqali ulanadi.
- `443/tcp` — faqat keyinroq domen+TLS qo'shilganda kerak bo'ladi,
  hozircha qo'shmang.

## 3. Kodni ko'chirish

```bash
git clone <repo-url> ~/oshxona-bot
cd ~/oshxona-bot
npm install
```

`.env` faylini alohida (git orqali EMAS) ko'chiring:

```bash
scp -i <kalit.pem> .env ubuntu@<PUBLIC_IP>:~/oshxona-bot/.env
ssh -i <kalit.pem> ubuntu@<PUBLIC_IP> "chmod 600 ~/oshxona-bot/.env"
```

**MUHIM — deploy qilishdan oldin:**
- `BOT_TOKEN`ni @BotFather orqali, Atlas foydalanuvchi parolini Atlas
  panelidan **rotate qiling** (avvalgi qiymatlar suhbat orqali ochiq
  almashilgan — `CLAUDE.md` eslatmasiga qarang).
- MongoDB Atlas → Network Access: `0.0.0.0/0` o'rniga **faqat VM'ning
  reserved public IP'sini** whitelist qiling (defense in depth).
- `.env`da `HOST=127.0.0.1` qatori bo'lishi kerak (`.env.example`da bor).

## 4. nginx — reverse proxy

```bash
sudo nano /etc/nginx/sites-available/oshxona
```

```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/oshxona /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

## 5. Ishga tushirish (PM2 bilan)

```bash
cd ~/oshxona-bot
pm2 start ecosystem.config.js
pm2 install pm2-logrotate     # log fayllar diskni to'ldirib yubormasligi uchun
pm2 save
pm2 startup   # chiqqan buyruqni sudo bilan bajaring — VM qayta yoqilganda
              # botlar avtomatik ishga tushadi
```

Foydali buyruqlar:

```bash
pm2 status
pm2 logs
pm2 restart all
```

## 6. Sinovdan o'tkazish

```bash
curl http://<PUBLIC_IP>/health   # {"ok":true} qaytishi kerak
```

Kassir kompyuterida (agar tarmoq ruxsat bergan bo'lsa):
`http://<PUBLIC_IP>/kassir.html`

## 7. Keyinroq domen + to'liq HTTPS qo'shish

Domen olinganida (masalan bepul DuckDNS yoki haqiqiy domen VM IP'siga
ko'rsatilgach):

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d sizning-domeningiz.uz
```

Certbot nginx konfiguratsiyasini avtomatik TLS bilan yangilaydi va
443-portni ochadi. Shundan keyin:
- Oracle Security List'ga `443/tcp` qoidasini qo'shing.
- `.env`da `NODE_ENV=production` qiling — shu paytdan boshlab
  `api/app.js`dagi HTTPS-majburiy tekshiruvi ishga tushadi (HTTP
  so'rovlar 400 bilan rad etiladi). `trust proxy: loopback` sozlamasi
  allaqachon to'g'ri ishlaydi, chunki nginx doim `127.0.0.1`dan
  ulanadi.
- `pm2 restart all`.

## 8. Kod yangilanganda

```bash
cd ~/oshxona-bot
git pull
npm install   # faqat package.json o'zgargan bo'lsa
pm2 restart all
```

## Xavfsizlik nazorat ro'yxati (deploy oldidan)

- [ ] `BOT_TOKEN` va Atlas paroli rotate qilindi
- [ ] Atlas Network Access faqat VM'ning reserved IP'siga cheklandi
- [ ] `.env` fayli `chmod 600`, faqat `scp` orqali ko'chirilgan (git'ga
      tushmagan)
- [ ] `HOST=127.0.0.1` — Express to'g'ridan-to'g'ri tashqariga ochiq emas
- [ ] ufw yoqilgan, faqat 22 va 80 (kerak bo'lsagina) ochiq
- [ ] Oracle Security List 3000-portni HECH QACHON ochmaydi
- [ ] fail2ban va unattended-upgrades ishlab turibdi
- [ ] `pm2 startup` bajarilgan — VM qayta yoqilsa botlar o'zi ko'tariladi
- [ ] `pm2-logrotate` o'rnatilgan
