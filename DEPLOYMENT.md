# AWS EC2 Production Deployment Guide — HireGenius Auth Service (Amazon Linux 2023)

This document provides complete instructions for deploying the `hiregenius-auth-service` (Spring Boot 3.2.3, Java 21, Docker) to an AWS EC2 instance running **Amazon Linux 2023 (AL2023)** in `ap-south-1`, complete with systemd process supervision, Docker container isolation (mapped `80:8080`), and automated GitHub Actions CI/CD.

---

## 1. AWS EC2 Infrastructure Specifications

### Active Production Instance Specs
- **AMI**: Amazon Linux 2023 (AL2023 x86_64).
- **Default SSH User**: `ec2-user`
- **Elastic IP**: `13.203.243.162`
- **AWS Region**: `ap-south-1` (Asia Pacific, Mumbai)
- **Instance Type**: `t3.small` (2 vCPUs, 2 GB RAM) recommended for standard production traffic; `t3.micro` acceptable for low-traffic test.
- **Storage**: 20 GB GP3 EBS Root Volume.

### Security Group Inbound Rules
| Type | Port Range | Protocol | Source | Purpose |
| --- | --- | --- | --- | --- |
| **SSH** | `22` | TCP | `Your-Office/Admin-IP/32` | Secure administrative shell access |
| **HTTP** | `80` | TCP | `0.0.0.0/0`, `::/0` | Public Web & API traffic (Docker mapped 80:8080) |
| **HTTPS** | `443` | TCP | `0.0.0.0/0`, `::/0` | SSL application traffic (if enabled) |

### Security Group Outbound Rules
| Type | Port Range | Protocol | Destination | Purpose |
| --- | --- | --- | --- | --- |
| **All Traffic** | All (`0 - 65535`) | All | `0.0.0.0/0` | DB connection (MySQL), SMTP mail, Firebase |

---

## 2. Server Initial Prerequisites & Installation (Amazon Linux 2023)

Connect to your Amazon Linux 2023 EC2 instance via SSH:
```bash
ssh -i /path/to/your-key.pem ec2-user@13.203.243.162
```

### Step 2.1: Update System Packages using DNF
```bash
sudo dnf update -y
sudo dnf install -y git curl wget unzip htop
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
CORS_ALLOWED_ORIGINS=https://hiregenius-delta.vercel.app,http://localhost:5173,http://13.203.243.162
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

## 4. Container Deployment Setup (`hiregenius-auth`)

The application runs directly as a Docker container named `hiregenius-auth` (image `hiregenius-auth`), mapping host port 80 to internal container port 8080 (`-p 80:8080`).

### Running the Deployment Script
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 5. Systemd Service (OS Process Supervision)

To ensure the auth service container starts on server boot and restarts upon failure:

```bash
sudo cp hiregenius-auth.service /etc/systemd/system/hiregenius-auth.service
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
   ssh -i /path/to/key.pem ec2-user@13.203.243.162
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

- `EC2_HOST`: `13.203.243.162` (Elastic IP address).
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
curl -i http://localhost/actuator/health
```

To return to the main branch after resolving issues:
```bash
git checkout main
```

---

## 9. Health Checks & Production Monitoring Recommendations

1. **Spring Boot Health Endpoint**:
   - URL: `http://13.203.243.162/actuator/health` or `http://localhost/actuator/health`
   - Expected Response: `{"status":"UP"}`

2. **CloudWatch Alarm Setup**:
   - Install AWS CloudWatch Agent on Amazon Linux 2023: `sudo dnf install -y amazon-cloudwatch-agent`
   - Create a CloudWatch Metric Alarm for **CPU Utilization > 85% for 5 minutes**.
   - Create an alarm for **StatusCheckFailed_System** to send SNS notification via email/Slack.
