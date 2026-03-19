# Hosting Comparison Quick Reference

Quick-reference table for the `system-design` and `hosting-advisor` skills. For deeper evaluation, use `web-research` to get current pricing and feature details.

## .NET Backend Hosting

| Provider | Plan | Cost | .NET Support | Limits | Canadian Region |
|----------|------|------|-------------|--------|-----------------|
| **Azure App Service** | Free (F1) | $0/mo | Native (.NET 9) | 60 min CPU/day, 1 GB RAM, custom domain (no SSL) | Canada Central, Canada East |
| **Azure Container Apps** | Consumption | Pay-per-use (generous free grant) | Container (any) | 2 vCPU, 4 GB, 180K vCPU-s/mo free | Canada Central |
| **Railway** | Hobby | $5/mo + usage (trial free) | Dockerfile/Nixpack | 8 GB RAM, 8 vCPU | US-West (no Canada) |
| **Render** | Free | $0/mo | Docker or native | 512 MB RAM, spins down after 15 min | Oregon (no Canada) |
| **Fly.io** | Free (hobby) | $0/mo (3 shared VMs) | Dockerfile | 256 MB RAM per VM, 3 VMs | Toronto (YYZ) available |
| **DigitalOcean App Platform** | Basic | $5/mo | Dockerfile | 512 MB RAM, 1 vCPU | Toronto (TOR1) available |

## React Frontend Hosting

| Provider | Plan | Cost | Build Support | Limits | CDN |
|----------|------|------|--------------|--------|-----|
| **Vercel** | Hobby | $0/mo | Vite, Next.js, etc. | 100 GB bandwidth, 6000 min build | Global edge |
| **Netlify** | Free | $0/mo | Any static/SPA | 100 GB bandwidth, 300 min build | Global CDN |
| **Cloudflare Pages** | Free | $0/mo | Any static/SPA | Unlimited bandwidth, 500 builds/mo | Global edge (fastest) |
| **GitHub Pages** | Free | $0/mo | Static only | 1 GB storage, 100 GB bandwidth | Global CDN |
| **Azure Static Web Apps** | Free | $0/mo | Any SPA, integrated API | 100 GB bandwidth, 2 custom domains | Multiple regions |

## Database Hosting

| Provider | Plan | Cost | Type | Limits |
|----------|------|------|------|--------|
| **SQLite** | File | $0 | Embedded relational | No separate server needed |
| **Supabase** | Free | $0/mo | PostgreSQL | 500 MB, 2 projects |
| **Neon** | Free | $0/mo | PostgreSQL (serverless) | 512 MB, 1 project |
| **PlanetScale** | Hobby | $0/mo | MySQL (Vitess) | 5 GB, 1B row reads/mo |
| **MongoDB Atlas** | Free | $0/mo | Document | 512 MB |
| **Azure SQL** | Free (preview) | $0/mo | SQL Server | 32 GB, 100K vCore-s/mo |
| **Turso** | Free | $0/mo | libSQL (SQLite-compatible) | 9 GB, 500 DBs |

## MVP Recommendation Stack

For a hackathon/MVP with C# .NET + React:

| Layer | Choice | Why |
|-------|--------|-----|
| **Backend** | Azure App Service Free or Fly.io | Zero cost, .NET native support |
| **Frontend** | Cloudflare Pages or Vercel | Zero cost, fastest CDN, dead-simple deploy |
| **Database** | SQLite (embedded) | Zero ops, zero cost, ships with the app |
| **Upgrade path** | Azure Container Apps + Supabase | When you need real DB and scaling |

## Cost Estimation

| Tier | Monthly Cost | Stack |
|------|-------------|-------|
| **MVP/Hackathon** | $0/mo | Free tiers across the board |
| **Early Production** | $5-15/mo | Hobby tiers, small managed DB |
| **Growth** | $50-100/mo | Container hosting, managed Postgres, Redis |
| **Scale** | $200+/mo | Dedicated instances, CDN, APM tools |
