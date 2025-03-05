## Multiplayer Functionality

The multiplayer mode in Wartiles Online uses Socket.io for real-time communication between players. Each player connects to a central game server that manages:

- Lobby creation and player matching
- Synchronized game state between all players
- Real-time updates as players make moves
- Handling player disconnections

### Common Issues

**Players can't see each other in the lobby**: 
- Make sure all players are connecting to the same server URL.
- Check for connectivity issues (indicated by a "Disconnected" status in the top right).
- If deployed to fly.io, ensure the deployment is properly set up with WebSocket support.

**Game state not synchronized**:
- If players are making moves that aren't visible to others, it could indicate a WebSocket connection issue.
- Try refreshing the page to reestablish the connection.

## Deployment

### Deploy to GitHub

// ... existing code ...

### Deploy to fly.io

// ... existing code ...

### WebSocket Configuration for fly.io

For proper multiplayer functionality on fly.io, make sure:

1. Your application uses WebSockets correctly:
   ```
   fly deploy --auto-confirm=true
   ```

2. If you encounter connection issues, check your fly.io logs:
   ```
   fly logs
   ```

3. For persistent multiplayer, consider increasing the min_machines_running in fly.toml:
   ```
   min_machines_running = 1
   ```

// ... existing code ... 