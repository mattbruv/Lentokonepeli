using DogfightServer;

var builder = WebApplication.CreateBuilder(args);

// Add SignalR
builder.Services.AddSignalR();


// Add CORS services
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyHeader()
            .AllowAnyMethod()
            .WithOrigins("http://localhost:5173") // Specify your client URL here
            .AllowCredentials();  // Optional if you're using cookies or credentials
    });
});


var app = builder.Build();
app.UseCors();

// Serve static files from "wwwroot"
app.UseStaticFiles();

// Map SignalR hub
app.MapHub<SignalingHub>("/signaling");

app.Run();
