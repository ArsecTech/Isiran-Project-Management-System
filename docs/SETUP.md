# Isiran Setup Guide

## Prerequisites

- .NET 9 SDK
- SQL Server 2019+ (or SQL Server Express)
- Node.js 20+
- Docker Desktop (optional, for containerized setup)

## Backend Setup

### 1. Restore Dependencies

```bash
cd src/Isiran.Api
dotnet restore
```

### 2. Database Setup

#### Option A: Using SQL Scripts

1. Open SQL Server Management Studio (SSMS)
2. Run `database/Schema.sql` to create the database
3. Run `database/SeedData.sql` to insert seed data

#### Option B: Using EF Core Migrations

```bash
cd src/Isiran.Infrastructure
dotnet ef migrations add InitialCreate --startup-project ../Isiran.Api
dotnet ef database update --startup-project ../Isiran.Api
```

### 3. Update Connection String

Edit `src/Isiran.Api/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER;Database=IsiranDB;Trusted_Connection=true;"
  }
}
```

### 4. Run the API

```bash
cd src/Isiran.Api
dotnet run
```

The API will be available at `https://localhost:5001` or `http://localhost:5000`

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Docker Setup

### 1. Build and Run with Docker Compose

```bash
docker-compose up -d
```

This will start:
- SQL Server on port 1433
- Redis on port 6379
- API on port 5000
- Frontend on port 3000

### 2. View Logs

```bash
docker-compose logs -f
```

### 3. Stop Services

```bash
docker-compose down
```

## Development Workflow

1. **Backend Changes**: Restart the API server
2. **Frontend Changes**: Hot reload is enabled
3. **Database Changes**: Create EF Core migrations

## Testing the API

### Using Swagger

Navigate to `https://localhost:5001/swagger` when the API is running.

### Example API Calls

```bash
# Get all projects
curl https://localhost:5001/api/projects

# Get project by ID
curl https://localhost:5001/api/projects/{id}

# Create project
curl -X POST https://localhost:5001/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Project","code":"TEST001"}'
```

## Troubleshooting

### Database Connection Issues

- Verify SQL Server is running
- Check connection string in `appsettings.json`
- Ensure SQL Server allows TCP/IP connections
- Check firewall settings

### Port Conflicts

- Change ports in `appsettings.json` (API)
- Change ports in `vite.config.ts` (Frontend)
- Change ports in `docker-compose.yml` (Docker)

### CORS Issues

- Verify CORS configuration in `Program.cs`
- Check frontend URL is in allowed origins

## Next Steps

1. Set up authentication (JWT)
2. Configure Redis for caching
3. Set up SignalR for real-time updates
4. Configure logging (Serilog, ELK)
5. Set up monitoring (Prometheus, Grafana)

