# AWS EC2 Production Deployment Guide — HireGenius Auth Service (Amazon Linux 2023)

This document provides complete instructions for deploying the `hiregenius-auth-service` (Spring Boot 3.2.3, Java 21, Docker) to an AWS EC2 instance running **Amazon Linux 2023 (AL2023)**, complete with systemd process supervision, Nginx reverse proxying, Let's Encrypt HTTPS certificates, and automated GitHub Actions CI/CD.

---

## 1. AWS EC2 Infrastructure Specifications

### Recommended Instance Specs
- **AMI**: Amazon Linux 2023 (AL2023 x86_64).
- **Default SSH User**: `ec2-user`
- **Instance Type**: `t3.small` (2 vCPUs, 2 GB RAM) recommended for standard production traffic; `t3.micro` acceptable for low-traffic dev/test.
- **Storage**: 20 GB GP3 EBS Root Volume.
- **AWS Region**: `us-east-1` (or your primary application region).
- **Elastic IP**: Recommended — Allocate a static Elastic IP (EIP) and associate it with the EC2 instance so your domain DNS mapping remains permanent across instance reboots.

### Security Group Inbound Rules
| Type | Port Range | Protocol | Source | Purpose |
| --- | --- | --- | --- | --- |
| **SSH** | `22` | TCP | `Your-Office/Admin-IP/32` | Secure administrative shell access |
| **HTTP** | `80` | TCP | `0.0.0.0/0`, `::/0` | Web traffic & ACME SSL validation |
| **HTTPS** | `443` | TCP | `0.0.0.0/0`, `::/0` | Secure SSL application traffic |

### Security Group Outbound Rules
| Type | Port Range | Protocol | Destination | Purpose |
| --- | --- | --- | --- | --- |
| **All Traffic** | All (`0 - 65535`) | All | `0.0.0.0/0` | DB connection (MySQL), SMTP mail, Firebase |

---

## 2. Server Initial Prerequisites & Installation (Amazon Linux 2023)

Connect to your Amazon Linux 2023 EC2 instance via SSH:
```bash
ssh -i /path/to/your-key.pem ec2-user@<your-ec2-elastic-ip>
```

### Step 2.1: Update System Packages using DNF
```bash
sudo dnf update -y
sudo dnf install -y git curl wget unzip htop nginx
```

### Step 2.2: Install & Enable Docker Engine on Amazon Linux 2023
```bash
sudo dnf install -y docker
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
newgrp docker
docker --version
```

---

## 3. Environment Variables Configuration

Create the application folder and directory structure:
```bash
sudo mkdir -p /var/www/hiregenius
sudo chown -R ec2-user:ec2-user /var/www/hiregenius
cd /var/www/hiregenius
git clone https://github.com/visucs/hiregenius.git .
cd hiregenius-auth-service
```

Create the runtime environment file `.env` inside `/var/www/hiregenius/hiregenius-auth-service/.env`:
```bash
cat << 'EOF' > /var/www/hiregenius/hiregenius-auth-service/.env
PORT=8080
SPRING_DATASOURCE_URL=jdbc:mysql://<your-rds-or-mysql-host>:3306/hiregenius?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=your_secure_db_password
JWT_SIGNING_KEY=your_super_secret_jwt_signing_key_that_is_at_least_256_bits_long
JWT_EXPIRATION_MS=86400000
CORS_ALLOWED_ORIGINS=https://hiregenius-delta.vercel.app,http://localhost:5173
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_FROM=krvisuji92@gmail.com
FIREBASE_CREDENTIALS_PATH=
FIREBASE_CREDENTIALS_JSON=
EOF
```

> [!CAUTION]
> Never commit `.env` to Git repository. The file is excluded by `.dockerignore` and `.gitignore`.

---

## 4. Nginx Reverse Proxy & Certbot SSL Setup (Amazon Linux 2023)

### Step 4.1: Configure Nginx Reverse Proxy
Amazon Linux 2023 loads Nginx configurations directly from `/etc/nginx/conf.d/*.conf` (it does not use the `sites-available`/`sites-enabled` directory structure).

Copy the provided Nginx configuration directly to `/etc/nginx/conf.d/hiregenius-auth.conf`:
```bash
sudo cp /var/www/hiregenius/hiregenius-auth-service/nginx.conf /etc/nginx/conf.d/hiregenius-auth.conf
```

Edit `/etc/nginx/conf.d/hiregenius-auth.conf` and update `auth.yourdomain.com` to your actual domain name pointed at your EC2 Elastic IP:
```bash
sudo nano /etc/nginx/conf.d/hiregenius-auth.conf
```

Verify Nginx configuration syntax and enable the Nginx service:
```bash
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx
```

### Step 4.2: Install Certbot on Amazon Linux 2023
Amazon Linux 2023 default repos do not include Certbot as a DNF package. Install Certbot and its Nginx plugin using `pip3`:

```bash
sudo dnf install python3-pip -y
sudo pip3 install certbot certbot-nginx
```

*Alternative (Recommended isolated virtual environment approach):*
```bash
sudo dnf install python3-pip -y
sudo python3 -m venv /opt/certbot/
sudo /opt/certbot/bin/pip install --upgrade pip
sudo /opt/certbot/bin/pip install certbot certbot-nginx
sudo ln -sf /opt/certbot/bin/certbot /usr/bin/certbot
```

### Step 4.3: Obtain Free Let's Encrypt SSL Certificate
Once your domain (e.g. `auth.hiregenius.com`) DNS `A` record points to your EC2 Elastic IP, run:
```bash
sudo certbot --nginx -d auth.yourdomain.com
```

Follow the interactive prompts to provide an admin email and accept terms. Certbot will automatically issue the SSL certificate and update `/etc/nginx/conf.d/hiregenius-auth.conf` with valid SSL paths.

### Step 4.4: Setup Automatic SSL Certificate Renewal Cron Job
Since pip-installed Certbot does not create a systemd timer automatically on AL2023, create a cron job:
```bash
echo "0 0,12 * * * root certbot renew --quiet --post-hook 'systemctl reload nginx'" | sudo tee /etc/cron.d/certbot-renew
```

Test dry-run renewal:
```bash
sudo certbot renew --dry-run
```

---

## 5. Systemd Service (OS Process Supervision)

To ensure the auth service container starts on boot and restarts upon failure:

```bash
sudo cp /var/www/hiregenius/hiregenius-auth-service/hiregenius-auth.service /etc/systemd/system/hiregenius-auth.service
sudo systemctl daemon-reload
sudo systemctl enable --now hiregenius-auth.service
```

Check service status:
```bash
sudo systemctl status hiregenius-auth.service
```

---

## 6. Manual Deployment Instructions

When CI/CD is not used, perform deployments manually on the EC2 host:

1. SSH into the server as `ec2-user`:
   ```bash
   ssh -i /path/to/key.pem ec2-user@<your-ec2-elastic-ip>
   ```
2. Navigate to the service folder:
   ```bash
   cd /var/www/hiregenius/hiregenius-auth-service
   ```
3. Make `deploy.sh` executable and run it:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```
4. Verify execution log:
   ```bash
   cat deploy-log.txt
   ```

---

## 7. Automated GitHub Actions CI/CD Setup

A GitHub Actions workflow `.github/workflows/deploy-aws.yml` is configured to trigger on pushes to `main`.

### Required GitHub Secrets
In your GitHub repository under **Settings > Secrets and variables > Actions**, add the following repository secrets:

- `EC2_HOST`: Elastic IP address or domain of the EC2 instance.
- `EC2_USERNAME`: `ec2-user` (Amazon Linux 2023 default SSH user).
- `EC2_SSH_KEY`: Content of the private SSH key (`.pem`) used to connect to EC2.
- `EC2_PORT`: `22` (or custom SSH port).

---

## 8. Rollback Procedure

If a broken deployment reaches production, rollback to the previous working commit:

### Step 8.1: Revert via Git
```bash
cd /var/www/hiregenius/hiregenius-auth-service
git log --oneline -n 5   # Identify last stable commit hash
git checkout <stable-commit-hash>
./deploy.sh
```

### Step 8.2: Verify Recovery
Check running container and health endpoint:
```bash
docker ps
curl -i http://localhost:8080/actuator/health
```

To return to the main branch after resolving issues:
```bash
git checkout main
```

---

## 9. Health Checks & Production Monitoring Recommendations

1. **Spring Boot Health Endpoint**:
   - URL: `http://localhost:8080/actuator/health` or `https://auth.yourdomain.com/actuator/health`
   - Expected Response: `{"status":"UP"}`

2. **CloudWatch Alarm Setup**:
   - Install AWS CloudWatch Agent on Amazon Linux 2023: `sudo dnf install -y amazon-cloudwatch-agent`
   - Create a CloudWatch Metric Alarm for **CPU Utilization > 85% for 5 minutes**.
   - Create an alarm for **StatusCheckFailed_System** to send SNS notification via email/Slack.

3. **External Uptime Monitoring**:
   - Configure a free monitor on UptimeRobot or Better Stack to ping `https://auth.yourdomain.com/actuator/health` every 5 minutes.
