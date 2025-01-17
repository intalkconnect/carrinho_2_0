module.exports = function override(config, env) {
    // Modificar a URL do WebSocket para localhost ou a URL desejada
    if (env === 'development') {
      config.devServer.client.webSocketURL = 'wss://endpoints-checkout.rzyewu.easypanel.host/';
    }
    return config;
  };
  
