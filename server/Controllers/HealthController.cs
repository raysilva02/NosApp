using Microsoft.AspNetCore.Mvc;
using Nos.Data;

namespace Nos.Controllers
{
    [ApiController]
    [Route("health")]
    public class HealthController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;

        public HealthController(ApplicationDbContext ctx)
        {
            _ctx = ctx;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var ok = await _ctx.Database.CanConnectAsync();
            return ok
                ? Ok(new { status = "ok" })
                : StatusCode(StatusCodes.Status503ServiceUnavailable, new { status = "degradado" });
        }
    }
}
