using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Nos.Data;
using Nos.Hubs;
using Nos.Models;
var builder = WebApplication.CreateBuilder(args);
var cs = builder.Configuration.GetConnectionString("DefaultConnection")!;

builder.Services.Configure<ForwardedHeadersOptions>(options => {
    options.ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.All;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});


builder.Services.AddDbContext<ApplicationDbContext>(o => o.UseSqlServer(cs));
builder.Services.AddDatabaseDeveloperPageExceptionFilter();
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(o => {
    o.SignIn.RequireConfirmedAccount = false; o.Password.RequireDigit = false;
    o.Password.RequiredLength = 6; o.Password.RequireNonAlphanumeric = false;
    o.Password.RequireUppercase = false; o.Password.RequireLowercase = false;
}).AddEntityFrameworkStores<ApplicationDbContext>().AddDefaultTokenProviders();
builder.Services.ConfigureApplicationCookie(o => {
    o.LoginPath = "/Account/Login"; o.LogoutPath = "/Account/Logout";
    o.AccessDeniedPath = "/Account/Login"; o.ExpireTimeSpan = TimeSpan.FromDays(30);
    o.SlidingExpiration = true; o.Cookie.HttpOnly = true; o.Cookie.IsEssential = true;
});
builder.Services.AddControllersWithViews();
builder.Services.AddSignalR();
var app = builder.Build();

app.UseForwardedHeaders();

if (app.Environment.IsDevelopment()) app.UseMigrationsEndPoint();
else { app.UseExceptionHandler("/Home/Error"); app.UseHsts(); }
app.UseHttpsRedirection(); app.UseStaticFiles(); app.UseRouting();
app.UseAuthentication(); app.UseAuthorization();
app.MapHub<ChatHub>("/chatHub");
app.MapControllerRoute(name: "default", pattern: "{controller=Home}/{action=Index}/{id?}");
app.Run();