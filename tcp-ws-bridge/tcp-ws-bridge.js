const WebSocket = require("ws");
const net = require("net");

const WSS_PORT = 8080;   // port >= 1024
const TCP_HOST = process.env.TCP_HOST || "127.0.0.1";  // Proxy host
const TCP_PORT = process.env.TCP_PORT || 8000;         // Proxy port

const wss = new WebSocket.Server({ port: WSS_PORT, host: '0.0.0.0' });

wss.on("listening", () => {
    console.log(`[WS→TCP] Bridge running on port ${WSS_PORT}`);
});

wss.on("connection", (ws, req) => {
    console.log("[WS→TCP] Worker connected from", req.socket.remoteAddress);

    const tcp = net.connect(TCP_PORT, TCP_HOST, () => {
        console.log("[WS→TCP] Connected to proxy at", TCP_HOST + ":" + TCP_PORT);
    });

    ws.on("message", data => tcp.write(data));
    tcp.on("data", data => {
        if (ws.readyState === WebSocket.OPEN) ws.send(data);
    });

    ws.on("close", () => tcp.end());
    tcp.on("close", () => ws.close());

    ws.on("error", err => console.log("[WS→TCP] WS Error:", err.message));
    tcp.on("error", err => console.log("[WS→TCP] TCP Error:", err.message));
    
ws.on("message", data => {
    console.log("[WS→TCP] WS → TCP:", data.toString());
    tcp.write(data);
});

tcp.on("data", data => {
    console.log("[WS→TCP] TCP → WS:", data.toString());
    if (ws.readyState === WebSocket.OPEN) ws.send(data);
});

});

