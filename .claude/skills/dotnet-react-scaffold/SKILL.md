---
name: dotnet-react-scaffold
description: Scaffold and manage C# .NET 9 + React + Vite + TypeScript projects with Tailwind CSS, shadcn/ui, and common packages pre-configured
user_invocable: true
allowedTools:
  - Bash
  - Write
  - Edit
  - Read
  - Glob
  - Grep
---

# .NET + React Scaffold Skill

You scaffold and manage full-stack projects using C# .NET 9 (backend) and React + Vite + TypeScript (frontend). Optimized for hackathon/MVP speed.

## Project Structure

```
[project-root]/
├── src/
│   └── Api/
│       ├── Api.csproj
│       ├── Program.cs
│       ├── appsettings.json
│       ├── appsettings.Development.json
│       ├── Properties/
│       │   └── launchSettings.json
│       ├── Endpoints/                  # Minimal API endpoint groups
│       ├── Models/                     # Data models / DTOs
│       ├── Services/                   # Business logic
│       └── Data/                       # DbContext, migrations
├── client/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/               # Shared/UI components
│   │   ├── pages/                    # Route pages
│   │   ├── hooks/                    # Custom hooks
│   │   ├── lib/                      # Utils, API client
│   │   └── types/                    # TypeScript type definitions
│   └── public/
├── tests/
│   └── Api.Tests/
│       └── Api.Tests.csproj
├── [ProjectName].sln
├── .gitignore
├── .editorconfig
└── README.md
```

## Scaffold Workflow

### Step 1: Gather Requirements

Ask the user (if not provided):
- Project name (default: derived from directory name)
- Do they need a database? (default: SQLite via EF Core)
- Do they need authentication? (default: no)
- Any specific API endpoints to start with?

### Step 2: Generate .NET Backend

```bash
# Create solution and API project
dotnet new sln -n [ProjectName]
dotnet new webapi -n Api -o src/Api --use-minimal-apis --no-openapi
dotnet sln add src/Api/Api.csproj

# Create test project
dotnet new xunit -n Api.Tests -o tests/Api.Tests
dotnet sln add tests/Api.Tests/Api.Tests.csproj
dotnet add tests/Api.Tests/Api.Tests.csproj reference src/Api/Api.csproj

# Add core NuGet packages
dotnet add src/Api/Api.csproj package Serilog.AspNetCore
dotnet add src/Api/Api.csproj package Microsoft.EntityFrameworkCore.Sqlite  # if DB needed
dotnet add src/Api/Api.csproj package Microsoft.EntityFrameworkCore.Design  # if DB needed
```

**Optional packages (add based on requirements):**
```bash
dotnet add src/Api/Api.csproj package Anthropic.SDK           # LLM integration
dotnet add src/Api/Api.csproj package NetTopologySuite         # Geospatial
dotnet add src/Api/Api.csproj package NetTopologySuite.IO.GeoJSON
```

### Step 3: Configure Program.cs

Minimal API setup with:
- Serilog structured logging
- CORS for React dev server (localhost:5173)
- EF Core with SQLite (if DB needed)
- Swagger/OpenAPI in development
- Health check endpoint
- Static file serving for production SPA

```csharp
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Serilog
builder.Host.UseSerilog((ctx, config) => config
    .ReadFrom.Configuration(ctx.Configuration)
    .WriteTo.Console());

// CORS for React dev server
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()));

// Add services here

var app = builder.Build();

app.UseSerilogRequestLogging();
app.UseCors();

if (app.Environment.IsDevelopment())
{
    // Swagger if added
}

app.UseDefaultFiles();
app.UseStaticFiles();

// Map endpoints here
app.MapGet("/api/health", () => Results.Ok(new { status = "healthy" }));

// SPA fallback for production
app.MapFallbackToFile("index.html");

app.Run();
```

### Step 4: Generate React Frontend

```bash
cd client
npm create vite@latest . -- --template react-ts
npm install
npm install -D tailwindcss @tailwindcss/vite
npm install react-router-dom axios @tanstack/react-query
```

**Optional npm packages (add based on requirements):**
```bash
npm install react-leaflet leaflet                    # Maps
npm install -D @types/leaflet                         # Map types
npm install lucide-react                              # Icons
npm install clsx tailwind-merge                       # Utility for className merging
```

### Step 5: Configure Vite Proxy

`vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
```

### Step 6: Set Up Base Files

- `client/src/lib/api.ts` — Axios instance pre-configured with `/api` base URL
- `client/src/App.tsx` — React Router setup with QueryClientProvider
- `client/src/main.tsx` — Entry point with providers
- `client/src/pages/Home.tsx` — Basic landing page
- `.gitignore` — Combined .NET + Node ignores
- `.editorconfig` — Consistent formatting
- `src/Api/Api.http` — REST Client test file for VS Code

### Step 7: Verify Build

```bash
# Backend
cd src/Api && dotnet build
cd ../..

# Frontend
cd client && npm run build
cd ..

# Run both (in separate terminals or use a script)
# Terminal 1: cd src/Api && dotnet run
# Terminal 2: cd client && npm run dev
```

## Adding Features

### Add a New API Endpoint Group

Create a file in `src/Api/Endpoints/[Name]Endpoints.cs`:

```csharp
public static class [Name]Endpoints
{
    public static void Map[Name]Endpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/[name]");

        group.MapGet("/", async () => { /* ... */ });
        group.MapGet("/{id}", async (int id) => { /* ... */ });
        group.MapPost("/", async ([Name]Request request) => { /* ... */ });
    }
}
```

Register in `Program.cs`: `app.Map[Name]Endpoints();`

### Add EF Core Entity

1. Create model in `src/Api/Models/`
2. Add DbSet to `AppDbContext` in `src/Api/Data/`
3. Run `dotnet ef migrations add [Name] --project src/Api`
4. Run `dotnet ef database update --project src/Api`

### Add a React Page

1. Create component in `client/src/pages/[Name].tsx`
2. Add route in `App.tsx`
3. Create API hook in `client/src/hooks/use[Name].ts` using TanStack Query

## Key Configuration Files

### appsettings.Development.json
```json
{
  "Serilog": {
    "MinimumLevel": {
      "Default": "Debug",
      "Override": {
        "Microsoft.AspNetCore": "Warning"
      }
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=app.db"
  }
}
```

### launchSettings.json
```json
{
  "profiles": {
    "Api": {
      "commandName": "Project",
      "launchBrowser": false,
      "applicationUrl": "http://localhost:5000",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
  }
}
```

## Guidelines

- **Keep it flat.** No Clean Architecture layers for MVP. One project with folders.
- **Minimal API only.** No controllers — use `MapGroup` and lambda endpoints.
- **SQLite first.** Zero-ops database. Upgrade to Postgres when needed.
- **No auth by default.** Add it only when the user asks.
- **React Router for navigation.** TanStack Query for server state.
- **Tailwind for styling.** Add shadcn/ui components as needed, not upfront.
- **Don't over-scaffold.** Only create files/folders needed for immediate features.

## Integration with Other Skills

- **`system-design`** → provides architecture decisions that inform scaffold choices
- **`hosting-advisor`** → informs production build and deployment configuration
- **`llm-integration`** → adds Anthropic.SDK and Claude API patterns
- **`map-integration`** → adds react-leaflet and geospatial packages
