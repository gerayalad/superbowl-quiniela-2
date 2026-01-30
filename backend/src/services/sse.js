// Server-Sent Events service for real-time updates

const clients = new Set();

export function addClient(res) {
  clients.add(res);

  res.on('close', () => {
    clients.delete(res);
  });
}

export function removeClient(res) {
  clients.delete(res);
}

export function broadcast(event, data) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

  clients.forEach(client => {
    client.write(message);
  });
}

export function getClientCount() {
  return clients.size;
}
