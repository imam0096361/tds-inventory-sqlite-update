# 🔌 Custom Port Configuration

## 📋 Port Mapping

Your Docker deployment uses **custom ports** to avoid conflicts with other services:

### Frontend (Web Interface)
- **Host Port:** `5555`
- **Container Port:** `80`
- **Access:** http://your-server-ip:5555/

### Backend API
- **Host Port:** `5000` (internal)
- **Container Port:** `5000`
- **Access:** Through Nginx proxy at http://your-server-ip:5555/api/

### PostgreSQL Database
- **Host Port:** `9999`
- **Container Port:** `5432`
- **Access:** localhost:9999 (from host) or postgres:5432 (from containers)

---

## 🔧 Configuration Files

### docker-compose.yml (Frontend Only)
```yaml
ports:
  - "5555:80"
```

### docker-compose.full.yml (Full Stack)
```yaml
frontend:
  ports:
    - "5555:80"  # Web interface

postgres:
  ports:
    - "9999:5432"  # Database
```

---

## 🌐 Access URLs

### Development/Testing
- Frontend: http://localhost:5555/
- API: http://localhost:5555/api/
- Database: localhost:9999

### Production (On Ubuntu Server)
- Frontend: http://your-server-ip:5555/
- API: http://your-server-ip:5555/api/
- Database: localhost:9999

---

## 🔐 Firewall Configuration

### Ubuntu UFW Firewall
```bash
# Allow web access
sudo ufw allow 5555/tcp

# Allow PostgreSQL access (optional, for external tools)
sudo ufw allow 9999/tcp

# Enable firewall
sudo ufw enable
sudo ufw status
```

### If Behind Cloudflare/Nginx
You can proxy port 5555 to standard ports:

**Cloudflare:**
- Set Origin Port to 5555

**Nginx Reverse Proxy:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5555;
    }
}
```

---

## 🔄 Changing Ports

To use different ports, edit these files:

### 1. docker-compose.yml (Frontend Only)
```yaml
ports:
  - "8888:80"  # Change 5555 to your desired port
```

### 2. docker-compose.full.yml (Full Stack)
```yaml
frontend:
  ports:
    - "8888:80"  # Change 5555 to your desired port

postgres:
  ports:
    - "7777:5432"  # Change 9999 to your desired port
```

### 3. Update Firewall
```bash
sudo ufw allow 8888/tcp  # Your new frontend port
sudo ufw allow 7777/tcp  # Your new database port
```

### 4. Restart Containers
```bash
docker-compose down
docker-compose up -d
```

---

## ✅ Why Custom Ports?

### Benefits:
- ✅ No conflicts with Apache/Nginx on port 80/443
- ✅ No conflicts with existing PostgreSQL on 5432
- ✅ Can run multiple apps on same server
- ✅ Better security (non-standard ports)
- ✅ No root privileges required

### Trade-offs:
- ⚠️ Must specify port in URL (:5555)
- ⚠️ Need to open port in firewall
- ⚠️ Reverse proxy recommended for production

---

## 🎯 Recommended Setup

### Production (With Domain)
```bash
# Docker on custom port
docker-compose up -d  # Uses port 5555

# Nginx reverse proxy on standard ports
sudo apt install nginx
# Configure proxy to localhost:5555
# Access via http://yourdomain.com (port 80/443)
```

### Development/Testing
```bash
# Direct access via custom port
docker-compose up -d
# Access via http://localhost:5555
```

---

## 🔍 Troubleshooting

### Port Already in Use
```bash
# Check what's using port 5555
sudo lsof -i :5555
sudo netstat -tulpn | grep :5555

# Kill the process or change port
```

### Cannot Access from Browser
```bash
# Check firewall
sudo ufw status

# Check container is running
docker ps

# Check logs
docker logs tds-inventory-frontend
```

### Connection Refused
```bash
# Verify port mapping
docker port tds-inventory-frontend

# Should show: 0.0.0.0:5555->80/tcp
```

---

## 📝 Quick Reference

**Start Services:**
```bash
docker-compose up -d
```

**Access Application:**
```
http://your-server-ip:5555
```

**Stop Services:**
```bash
docker-compose down
```

**View Logs:**
```bash
docker logs -f tds-inventory-frontend
```

**Change Ports:**
```bash
# Edit docker-compose.yml
# Change "5555:80" to your port
docker-compose down && docker-compose up -d
```

---

**Last Updated:** October 30, 2025  
**Port Configuration:** 5555 (Frontend), 9999 (Database)  
**Status:** ✅ Production Ready

