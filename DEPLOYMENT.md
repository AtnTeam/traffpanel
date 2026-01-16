# Інструкція з розгортання проекту на Ubuntu сервері

Цей документ описує покрокові інструкції для розгортання проекту на Ubuntu 24.04 LTS сервері.

## Передумови

- Ubuntu 24.04 LTS сервер з доступом через SSH
- Права суперкористувача (sudo)
- Домен або IP адреса сервера

## Крок 1: Оновлення системи та встановлення базових пакетів

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl git build-essential
```

## Крок 2: Встановлення Node.js та npm

Проект потребує Node.js версії 18 або вище. Встановимо Node.js через NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Перевіримо встановлену версію:

```bash
node --version
npm --version
```

## Крок 3: Встановлення PM2 для управління процесами

PM2 дозволить запускати backend як сервіс з автозапуском:

```bash
sudo npm install -g pm2
```

## Крок 4: Встановлення Nginx

Nginx буде використовуватися для обслуговування frontend та проксування API запитів:

```bash
sudo apt install -y nginx
```

## Крок 5: Клонування проекту з Git

```bash
cd /var/www
sudo git clone <URL_ВАШОГО_РЕПОЗИТОРІЮ> trafic_back_panel
sudo chown -R $USER:$USER /var/www/trafic_back_panel
cd trafic_back_panel
```

**Примітка:** Замініть `<URL_ВАШОГО_РЕПОЗИТОРІЮ>` на реальний URL вашого Git репозиторію.

## Крок 6: Налаштування Backend

### 6.1. Створення .env файлу

```bash
cd backend
cp env.example .env
nano .env
```

Налаштуйте наступні параметри в `.env` файлі:

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration (SQLite)
DB_PATH=./data/trafic_db.sqlite

# External API Configuration
EXTERNAL_API_URL=https://your-api-url.com/admin_api/v1/clicks/log
EXTERNAL_API_KEY=your-external-api-key-here

# Keitaro Integration
KEITARO_REDIRECT_BASE=https://your-keitaro-domain.com/pwagroup

# Authentication Configuration
JWT_SECRET=your-very-secure-secret-key-minimum-32-characters-long-change-this
JWT_EXPIRES_IN=24h
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password-here
```

**Важливо:** 
- Змініть `JWT_SECRET` на випадковий рядок мінімум 32 символи
- Змініть `ADMIN_PASSWORD` на безпечний пароль

### 6.2. Встановлення залежностей backend

```bash
npm install
```

### 6.3. Створення директорії для бази даних

```bash
mkdir -p data
```

## Крок 7: Налаштування Frontend

### 7.1. Створення .env файлу для frontend

```bash
cd ../frontend
nano .env
```

Додайте наступний рядок (замініть на ваш домен або IP):

```env
VITE_API_URL=http://your-domain.com/api
```

Або якщо використовуєте IP:

```env
VITE_API_URL=http://YOUR_SERVER_IP/api
```

### 7.2. Встановлення залежностей та збірка frontend

```bash
npm install
npm run build
```

Після збірки статичні файли будуть в директорії `dist/`.

## Крок 8: Налаштування PM2 для Backend

### 8.1. Створення PM2 конфігурації

```bash
cd /var/www/trafic_back_panel/backend
pm2 start src/server.js --name trafic-backend
pm2 save
pm2 startup
```

Виконайте команду, яку виведе `pm2 startup` (вона буде схожа на):

```bash
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER
```

### 8.2. Перевірка статусу

```bash
pm2 status
pm2 logs trafic-backend
```

## Крок 9: Налаштування Nginx

### 9.1. Створення конфігурації Nginx

```bash
sudo nano /etc/nginx/sites-available/trafic_back_panel
```

Додайте наступну конфігурацію (замініть `your-domain.com` на ваш домен або IP):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend static files
    root /var/www/trafic_back_panel/frontend/dist;
    index index.html;

    # API proxy
    location /api {
        proxy_pass http://localhost:3001/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Frontend routes (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 9.2. Активування конфігурації

```bash
sudo ln -s /etc/nginx/sites-available/trafic_back_panel /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## Крок 10: Налаштування файрволу (опціонально)

Якщо використовуєте UFW:

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Крок 11: Перевірка роботи

1. Перевірте статус PM2:
   ```bash
   pm2 status
   ```

2. Перевірте логи backend:
   ```bash
   pm2 logs trafic-backend
   ```

3. Перевірте статус Nginx:
   ```bash
   sudo systemctl status nginx
   ```

4. Відкрийте браузер та перейдіть на `http://your-domain.com` або `http://YOUR_SERVER_IP`

## Крок 12: Налаштування SSL сертифікату (рекомендовано)

Для використання HTTPS встановіть Let's Encrypt:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Certbot автоматично оновить конфігурацію Nginx для використання HTTPS.

## Корисні команди для управління

### PM2 команди:

```bash
# Перегляд статусу
pm2 status

# Перегляд логів
pm2 logs trafic-backend

# Перезапуск
pm2 restart trafic-backend

# Зупинка
pm2 stop trafic-backend

# Видалення з автозапуску
pm2 delete trafic-backend
```

### Nginx команди:

```bash
# Перезавантаження конфігурації
sudo systemctl reload nginx

# Перезапуск
sudo systemctl restart nginx

# Перевірка конфігурації
sudo nginx -t

# Перегляд логів
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## Оновлення проекту

Для оновлення проекту з Git:

```bash
cd /var/www/trafic_back_panel
git pull origin main  # або master, залежно від вашої гілки

# Backend
cd backend
npm install
pm2 restart trafic-backend

# Frontend
cd ../frontend
npm install
npm run build
sudo systemctl reload nginx
```

## Резервне копіювання бази даних

SQLite база даних знаходиться в `/var/www/trafic_back_panel/backend/data/trafic_db.sqlite`.

Рекомендується налаштувати автоматичне резервне копіювання:

```bash
# Створення скрипта резервного копіювання
sudo nano /usr/local/bin/backup-trafic-db.sh
```

Додайте:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/trafic_back_panel"
DB_PATH="/var/www/trafic_back_panel/backend/data/trafic_db.sqlite"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cp $DB_PATH "$BACKUP_DIR/trafic_db_$DATE.sqlite"

# Видалення резервних копій старіших за 30 днів
find $BACKUP_DIR -name "trafic_db_*.sqlite" -mtime +30 -delete
```

Зробіть скрипт виконуваним:

```bash
sudo chmod +x /usr/local/bin/backup-trafic-db.sh
```

Додайте до crontab (щоденне резервне копіювання о 2:00):

```bash
sudo crontab -e
```

Додайте рядок:

```
0 2 * * * /usr/local/bin/backup-trafic-db.sh
```

## Усунення проблем

### Backend не запускається

1. Перевірте логи: `pm2 logs trafic-backend`
2. Перевірте .env файл: `cat backend/.env`
3. Перевірте чи існує директорія data: `ls -la backend/data/`

### Frontend не відображається

1. Перевірте чи зібраний frontend: `ls -la frontend/dist/`
2. Перевірте права доступу: `sudo chown -R www-data:www-data frontend/dist`
3. Перевірте логи Nginx: `sudo tail -f /var/log/nginx/error.log`

### API запити не працюють

1. Перевірте чи працює backend: `pm2 status`
2. Перевірте проксування в Nginx конфігурації
3. Перевірте VITE_API_URL в frontend/.env

## Контакти та підтримка

При виникненні проблем перевірте логи та конфігураційні файли.

