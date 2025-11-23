using Isiran.Application.Common.Mappings;
using Isiran.Core.Interfaces;
using Isiran.Infrastructure.Persistence;
using Isiran.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using System.Reflection;
using Microsoft.AspNetCore.Authentication.JwtBearer;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        b => b.MigrationsAssembly("Isiran.Infrastructure")));

// Register ApplicationDbContext as DbContext for Repository<T>
builder.Services.AddScoped<DbContext>(sp => sp.GetRequiredService<ApplicationDbContext>());

// Repositories
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<Isiran.Core.Interfaces.IUserRepository, Isiran.Infrastructure.Persistence.Repositories.UserRepository>();
builder.Services.AddScoped<IRepository<Isiran.Domain.Tasks.TaskTimeEntry>, Isiran.Infrastructure.Persistence.Repositories.TaskTimeEntryRepository>();
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

// MediatR
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly()));
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(Isiran.Application.Projects.Commands.CreateProjectCommand).Assembly));

// AutoMapper
builder.Services.AddAutoMapper(typeof(MappingProfile));

// Gantt Engine
builder.Services.AddScoped<Isiran.GanttEngine.Services.IGanttCalculationService, Isiran.GanttEngine.Services.GanttCalculationService>();
builder.Services.AddScoped<Isiran.GanttEngine.Services.IEnhancedCriticalPathService, Isiran.GanttEngine.Services.EnhancedCriticalPathService>();
builder.Services.AddScoped<Isiran.GanttEngine.Services.IResourceLevelingService, Isiran.GanttEngine.Services.ResourceLevelingService>();

// JWT Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    var secretKey = builder.Configuration["JwtSettings:SecretKey"] 
        ?? throw new InvalidOperationException("JWT SecretKey not configured");
    var key = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
        System.Text.Encoding.UTF8.GetBytes(secretKey));

    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
        ValidAudience = builder.Configuration["JwtSettings:Audience"],
        IssuerSigningKey = key,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// JWT Service
builder.Services.AddScoped<Isiran.Core.Interfaces.IJwtService, Isiran.Infrastructure.Authentication.JwtService>();

// Export Service
builder.Services.AddScoped<Isiran.Application.Export.Services.IExportService, Isiran.Application.Export.Services.ExportService>();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Logging
builder.Logging.AddConsole();
builder.Logging.AddDebug();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowReactApp");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Ensure database is created
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    dbContext.Database.EnsureCreated();
}

app.Run();

