#!/bin/bash

# Create SSL directory if it doesn't exist
mkdir -p ssl

# Generate SSL certificate and key
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/CN=localhost"

echo "SSL certificates generated successfully in the ssl directory" 