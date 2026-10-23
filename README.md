# FoodyPay Multi-Tenant POS & Digital Menu Server

Production-ready Restaurant POS & Waiter Ordering System.

## Architecture
- `crm/`: Static Merchant POS & Waiter Terminal Application
- `server/`: Node.js / Express backend with MongoDB Atlas multi-tenant storage

## Branches
- `main`: Primary development & integration branch
- `prod`: Production deployment branch
- `stage`: Staging & testing branch

## API Status Endpoint
`GET /api/status` returns real-time environment status, database connection, and memory telemetry.
