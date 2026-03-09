#!/bin/sh

# Ensure the destination directory exists (it should, but just in case)
mkdir -p /etc/nginx/templates

# Default to HTTP config
echo "Initializing Nginx configuration..."
cp /usr/share/nginx/templates-store/nginx-http.conf.template /etc/nginx/templates/default.conf.template

# If ENABLE_HTTPS is set to true, try to use the SSL template
if [ "$ENABLE_HTTPS" = "true" ]; then
    echo "Checking for HTTPS certificates..."
    
    # Check if certificates exist
    if [ -f "/etc/nginx/certs/server.crt" ] && [ -f "/etc/nginx/certs/server.key" ]; then
        echo "Certificates found. Enabling HTTPS configuration..."
        cp /usr/share/nginx/templates-store/nginx-ssl.conf.template /etc/nginx/templates/default.conf.template
    else
        echo "WARNING: ENABLE_HTTPS is true but certificates (server.crt, server.key) not found in /etc/nginx/certs/"
        echo "Falling back to HTTP configuration."
    fi
else
    echo "Using HTTP configuration (ENABLE_HTTPS is not true)..."
fi

# Nginx's entrypoint will ONLY process .template files in /etc/nginx/templates/
# Since we only put default.conf.template there, only that one will be processed.


