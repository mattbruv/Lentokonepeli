namespace DogfightServer;

using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

public class SignalingHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var id = Context.ConnectionId;
        
        Console.WriteLine($"new connection! ${id}");
        // Send a welcome message to the newly connected client
        await Clients.Client(id).SendAsync("ReceiveMessage",  $"Welcome to the chat! your ID is {id}");
        
        await base.OnConnectedAsync();
    }

    // Sends the offer to the other client
    public async Task SendOffer(string toConnectionId, string offer)
    {
        await Clients.Client(toConnectionId).SendAsync("ReceiveOffer", offer);
    }

    // Sends the answer to the other client
    public async Task SendAnswer(string toConnectionId, string answer)
    {
        await Clients.Client(toConnectionId).SendAsync("ReceiveAnswer", answer);
    }

    // Sends ICE candidates
    public async Task SendCandidate(string toConnectionId, string candidate)
    {
        await Clients.Client(toConnectionId).SendAsync("ReceiveCandidate", candidate);
    }
}

