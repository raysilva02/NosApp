using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration.Json;
using Microsoft.IdentityModel.Tokens;
using Nos.Data;
using Nos.Hubs;
using Nos.Models;
using Nos.Services;

// Npgsql: permite DateTime local (Kind=Local) em colunas timestamp.
// Sem isso, `DateTime.Now` (hora local) gera erro ao salvar no PostgreSQL.
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);
var cs = builder.Configuration.GetConnectionString("DefaultConnection")!;

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.All;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

builder.Services.AddDbContext<ApplicationDbContext>(o => o.UseNpgsql(cs));
builder.Services.AddDatabaseDeveloperPageExceptionFilter();

// Identity (gerencia usuários e senhas) sem o cookie de sessão — a API usa JWT.
builder.Services.AddIdentityCore<ApplicationUser>(o =>
{
    o.Password.RequireDigit = false;
    o.Password.RequiredLength = 6;
    o.Password.RequireNonAlphanumeric = false;
    o.Password.RequireUppercase = false;
    o.Password.RequireLowercase = false;
}).AddEntityFrameworkStores<ApplicationDbContext>().AddDefaultTokenProviders();

var jwtKey = builder.Configuration["Jwt:Key"]!;
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        NameClaimType = ClaimTypes.NameIdentifier,
    };
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            // O SignalR envia o token via query string (access_token) para WebSockets.
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/chatHub"))
                context.Token = accessToken;
            return Task.CompletedTask;
        }
    };
});

// Serviços de domínio.
builder.Services.AddHttpClient("ExpoPush", c => c.BaseAddress = new Uri("https://exp.host/"));
builder.Services.AddScoped<ChatService>();
builder.Services.AddScoped<PushService>();
builder.Services.AddScoped<ExpoPushService>();
builder.Services.AddScoped<TokenService>();

builder.Services.AddControllers();
builder.Services.AddSignalR();

var app = builder.Build();

app.UseForwardedHeaders();

if (app.Environment.IsDevelopment())
{
    app.UseMigrationsEndPoint();
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseHsts();
}

// Tratamento global de exceções: envelope JSON consistente em produção.
app.Use(async (ctx, next) =>
{
    try { await next(); }
    catch (Exception)
    {
        if (ctx.Response.HasStarted) throw;
        ctx.Response.Clear();
        ctx.Response.StatusCode = StatusCodes.Status500InternalServerError;
        ctx.Response.ContentType = "application/json";
        await ctx.Response.WriteAsJsonAsync(new { erro = "Ocorreu um erro interno. Tente novamente." });
    }
});

app.UseHttpsRedirection();
app.UseDefaultFiles();
app.UseStaticFiles(); // serve os áudios de /wwwroot/uploads
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapHub<ChatHub>("/chatHub");
app.MapControllers();

app.Run();
