# AirTrack: AWS Cloud Deployment Guide

**Target Event:** Environmental Hacks (Bharat Builds Tour - WeMakeDevs x AWS)  
**Eligibility Rule:** Uses at least one AWS open-source tool (`boto3`) OR deployed on AWS.

---

## 1. High-Level AWS Architecture

```mermaid
flowchart TD
    User([End Users / Parents / Schools])

    subgraph AWSCloud["AWS Cloud Infrastructure"]
        subgraph StaticTier["Frontend Edge (Static Delivery)"]
            CF[Amazon CloudFront\n(HTTPS CDN Distribution)]
            S3[Amazon S3 Bucket\n(Static React Production Bundle)]
            CF -->|Serves Web Assets| S3
        end

        subgraph ComputeTier["API & Application Compute"]
            ALB[Application Load Balancer / API Gateway]
            AppRunner[AWS App Runner / EC2 Container\n(AirTrack REST API - FastAPI + Uvicorn)]
            ALB --> AppRunner
        end

        subgraph DataAndSecurity["Data & Security Layer"]
            RDS[(Amazon RDS PostgreSQL / Aurora Serverless)]
            SM[AWS Secrets Manager / SSM Parameter Store]
            Bedrock[AWS Bedrock / Claude 3 Sonnet\n(AI School Safety Protocols)]
            CW[Amazon CloudWatch\n(Container Logs & Health Metrics)]
        end

        AppRunner --> RDS
        AppRunner --> SM
        AppRunner --> Bedrock
        AppRunner --> CW
    end

    User -->|HTTPS :443| CF
    User -->|HTTPS /api/v1| ALB
```

---

## 2. Step-by-Step Deployment Instructions

### Step 1: AWS Student Verification & Credits
1. Sign in to your account on [AWS Builder Center](https://builder.aws.com/).
2. Complete student verification to claim your hackathon promotional credits ($2,000 for track winners, $1,000 for runners-up).

### Step 2: Deploy Frontend to Amazon S3 & CloudFront
1. In `airtrack/frontend`, generate the production build:
   ```bash
   npm run build
   ```
2. Create an S3 bucket configured for static web hosting:
   ```bash
   aws s3 mb s3://airtrack-production-frontend --region ap-south-1
   aws s3 sync dist/ s3://airtrack-production-frontend --delete
   ```
3. Provision an **Amazon CloudFront** distribution pointing to the S3 bucket:
   - Viewer Protocol Policy: `Redirect HTTP to HTTPS`
   - Default Root Object: `index.html`
   - Custom Error Response: Error code `404` $\rightarrow$ `/index.html` (HTTP 200) for SPA client routing.

### Step 3: Deploy Backend to AWS App Runner (or EC2)
**AWS App Runner** is the simplest, fully-managed container service requiring zero infrastructure maintenance:
1. Build and push the container image to Amazon ECR:
   ```bash
   aws ecr create-repository --repository-name airtrack-api --region ap-south-1
   docker build -t airtrack-api -f deployment/Dockerfile.backend .
   docker tag airtrack-api:latest <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/airtrack-api:latest
   docker push <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/airtrack-api:latest
   ```
2. Create the App Runner service:
   - Runtime: Container image from ECR.
   - Port: `8000`
   - Environment variables:
     - `AIRTRACK_DEMO_MODE=false`
     - `DATABASE_URL=postgresql://user:password@rds-endpoint:5432/airtrack`
     - `ENABLE_AWS_BEDROCK=true`
     - `AWS_REGION=us-east-1`

### Step 4: Amazon CloudWatch & Logging
All incoming requests, CPCB verdict evaluations, and provider latencies are streamed to CloudWatch under log group `/aws/apprunner/airtrack-api/application`.

---

## 3. Cost & Free-Tier Optimization

| Component | Free-Tier / Credit Utilization | Estimated Monthly Cost |
| :--- | :--- | :--- |
| **Amazon S3** | 5 GB standard storage free | < $0.20 |
| **Amazon CloudFront** | 1 TB data transfer out free for 12 months | $0.00 |
| **AWS App Runner** | Pay-per-use (pauses when idle) | ~$5.00 - $12.00 / mo |
| **Amazon RDS PostgreSQL** | `db.t4g.micro` (750 hours/month free tier) | $0.00 |
| **AWS Bedrock** | Pay per 1,000 input/output tokens | ~$0.50 for demo usage |
| **Total Estimated Cost** | **Fully covered by AWS Free Tier & Student Credits** | **< $1.00 net** |
