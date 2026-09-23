# AWS EC2 Production Deployment Guide — HireGenius Auth Service (Amazon Linux 2023)

This document provides complete instructions for deploying the `hiregenius-auth-service` (Spring Boot 3.2.3, Java 21, Docker) to an AWS EC2 instance running **Amazon Linux 2023 (AL2023)** in `ap-south-1`, complete with systemd process supervision, Docker container isolation (mapped `80:8080`), Vercel API proxying, and automated GitHub Actions CI/CD with dynamic Security Group IP whitelisting.

---

## 1. AWS EC2 Infrastructure Specifications

### Active Production Instance Specs
- **AMI**: Amazon Linux 2023 (AL2023 x86_64).
- **Default SSH User**: `ec2-user`
- **Elastic IP**: `13.203.243.162`
- **AWS Region**: `ap-south-1` (Asia Pacific, Mumbai)
- **Host Port**: `80` (Docker maps host port 80 to container port 8080 via `-p 80:8080`).
- **Security Group ID**: `sg-011d4a518af48aa67`
- **Instance Type**: `t3.small` (2 vCPUs, 2 GB RAM) recommended for standard production traffic; `t3.micro` acceptable for low-traffic test.

### Security Group Inbound Rules
| Type | Port Range | Protocol | Source | Purpose |
| --- | --- | --- | --- | --- |
| **SSH** | `22` | TCP | `Your-Office/Admin-IP/32` + Dynamic Runner IP | Secure SSH access (whitelisted dynamically by CI/CD) |
| **HTTP** | `80` | TCP | `0.0.0.0/0`, `::/0` | Public API traffic (Docker mapped 80:8080) |
| **HTTPS** | `443` | TCP | `0.0.0.0/0`, `::/0` | SSL traffic |

---

## 2. Environment & Container Configuration

### Environment Variables (`.env`)
Create `/var/www/hiregenius/hiregenius-auth-service/.env`:
```bash
cat << 'EOF' > /var/www/hiregenius/hiregenius-auth-service/.env
PORT=8080
SPRING_DATASOURCE_URL=jdbc:mysql://<your-db-host>:3306/hiregenius?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=your_secure_db_password
JWT_SIGNING_KEY=your_super_secret_jwt_signing_key_that_is_at_least_256_bits_long
CORS_ALLOWED_ORIGINS=https://hiregenius-delta.vercel.app,http://localhost:5173,http://13.203.243.162
EOF
```

### Container Port & Logic (`deploy.sh`)
- Host Port: `PORT_HOST="${HOST_PORT:-80}"`
- Container Port: `-p "${PORT_HOST}:8080"`
- Post-start Verification: Automatically checks `docker ps` to verify host port 80 is mapped and active.

---

## 3. Vercel Reverse Proxy Setup (Mixed Content Fix)

Because the Vercel frontend is served over **HTTPS** (`https://<vercel-app>.vercel.app`) and the backend EC2 server is **HTTP** (`http://13.203.243.162`), direct browser calls to `http://13.203.243.162` cause browser mixed-content blocks.

To solve this, requests are proxied via Vercel Edge rewrites:

### `vercel.json` Rewrite Configuration
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "http://13.203.243.162/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Vercel Environment Variable
In Vercel Project Settings > Environment Variables, configure:
- `VITE_API_BASE_URL` = `/api`

This ensures browser requests call `https://<vercel-app>/api/auth/login` (same-origin HTTPS), and Vercel proxies the request to `http://13.203.243.162/api/auth/login` with zero mixed-content errors.

---

## 4. Automated GitHub Actions CI/CD (`.github/workflows/deploy-aws.yml`)

The CI/CD pipeline triggers automatically on `push` to `main`.

### Required GitHub Secrets
Under **Repository Settings > Secrets and variables > Actions**:
- `EC2_HOST`: `13.203.243.162`
- `EC2_USERNAME`: `ec2-user`
- `EC2_SSH_KEY`: Private SSH Key (`.pem` file content)
- `AWS_ACCESS_KEY_ID`: AWS IAM Access Key ID with EC2 Security Group permissions
- `AWS_SECRET_ACCESS_KEY`: AWS IAM Secret Access Key

### Dynamic Security Group Runner IP Whitelisting Flow
1. **Fetch Runner IP**: Gets public IP of GitHub runner via `curl -s https://checkip.amazonaws.com`.
2. **Authorize Ingress**: Adds rule to `sg-011d4a518af48aa67` opening port 22 for `${RUNNER_IP}/32`.
3. **Propagation Wait**: Sleeps 10 seconds.
4. **SSH Execution**: Connects via `appleboy/ssh-action@v1.0.3` and runs `./deploy.sh`.
5. **Always Revoke Ingress (`if: always()`)**: Revokes `${RUNNER_IP}/32` from `sg-011d4a518af48aa67` even if deployment fails.
