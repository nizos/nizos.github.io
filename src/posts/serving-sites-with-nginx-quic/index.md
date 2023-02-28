---
title: 'Serving Sites with NGINX QUIC'
excerpt: ''
date: 2023-02-28
author: Nizar
permalink: /{{ title | slugify }}/index.html
cover: git-flow-cover.jpg
tags: [http, nginx, quic]
---

# Serving Sites with NGINX QUIC

NGINX has [recently released](https://www.nginx.com/blog/binary-packages-for-preview-nginx-quic-http3-implementation/) prebuilt [binary packages](https://quic.nginx.org/packages.html) for the preview NGINX QUIC+HTTP/3 implementation for Red Hat Enterprise Linux 9 and Ubuntu 22.04.

The prebuilt binary packages eliminate the need to compile from source and automatically install a [quicktls](https://github.com/quictls) library package as a dependency as OpenSSL does not yet support QUIC.

## QUIC

QUIC is a general-purpose transport layer network protocol that provides built-in security and improved performance compared to TCP + TLS. It's built-in security features, such as encryption and authentication, allow for the exchange of setup keys and protocols to take place in the initial handshake. Thus reducing the connection setup overhead and latency as shown by the diagram below.

{% image "./assets/QUIC.png", "QUIC diagram", "QUIC diagram" %}

For a more detailed breakdown of QUIC and how it works, checkout Cloudflare's blog article The Road to QUIC.

## Using NGINX QUIC

What follows is a step-by-step guide on how to serve a website using NGINX QUIC. For this setup, we will use a newly created Ubuntu 22.04 server.

### Update the system

```shell
sudo apt update && sudo apt upgrade -y

# Reboot if necessary
sudo reboot -h now
```

### Install NGINX-QUIC

```shell
# Install the prerequisites
sudo apt update && sudo apt install curl gnupg2 ca-certificates lsb-release ubuntu-keyring

# Import an official nginx signing key to verify packages authenticity
curl https://nginx.org/keys/nginx_signing.key | gpg --dearmor \
| sudo tee /usr/share/keyrings/nginx-archive-keyring.gpg >/dev/null

# Set up the apt repository for nginx-quic packages
echo "deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] \
https://packages.nginx.org/nginx-quic/ubuntu `lsb_release -cs` nginx-quic" \
| sudo tee /etc/apt/sources.list.d/nginx-quic.list

# Install nginx-quic
sudo apt update
sudo apt install nginx-quic
```

### Firewall

```shell
# Adjust firewall
sudo ufw default allow outgoing
sudo ufw default deny incoming
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 443/udp

# Enable firewall
sudo ufw enable
```

### Certbot

```shell
# Make sure snapd core is up to date
sudo snap install core; sudo snap refresh core

# Ensure that no older version is already installed
sudo apt remove certbot

# Install the certbot package
sudo snap install --classic certbot

# Link the certbot command from the snap install directory
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

### Site directory

```shell
sudo mkdir -p /var/www/WEBSITE/html
sudo chown -R www-data:www-data /var/www/WEBSITE/html
sudo chmod -R 755 /var/www/WEBSITE
```

### Webpage

```shell
# Create a sample index.html
nano /var/www/WEBSITE/html/index.html
```

Paste in the following contents and save

```html
<html>
    <head>
        <title>Welcome to WEBSITE!</title>
    </head>
    <body>
        <h1>Success!  The WEBSITE server block is working!</h1>
    </body>
</html>
```

### Configure Website

```shell
# Create and link the server block directory
sudo mkdir /etc/nginx/sites-available
sudo ln -s /etc/nginx/sites-available /etc/nginx/sites-enabled
```

### Create the website configuration

```shell
sudo nano /etc/nginx/sites-available/WEBSITE
```

Paste in the following content and save the file

```txt
server {
    listen 80;

    index index.html index.nginx-debian.html;
    server_name WEBSITE www.WEBSITE;

    root /var/www/WEBSITE/html;
}
```

### Configure NGINX

Edit the NGINX conf file

```shell
sudo nano /etc/nginx/nginx.conf
```

Adjust the config file to match the following block

```txt
user  www-data;
worker_processes  auto;

error_log  /var/log/nginx/error.log notice;
pid        /var/run/nginx.pid;


events {
    worker_connections  1024;
}


http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile        on;
    #tcp_nopush     on;

    keepalive_timeout  65;

    #gzip  on;

    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

### Start NGINX

```shell
# Enable nginx on system startup if not already enabled
sudo systemctl enable nginx

# Check the status of nginx
sudo systemctl status nginx

# Make sure no errors were encountered
sudo nginx -t
```

### Generate certificates

```shell
sudo certbot certonly --nginx
```

Fill in your email address, agree to the terms and hit enter when prompted to pick the domains to create certificates for.

### Enable HTTP/3

Update the website configuration file to enable HTTP/3

```shell
sudo nano /etc/nginx/sites-available/WEBSITE
```

Adjust the file's contents to match the following block

```txt
server {
    # for better compatibility we recommend
    # using the same port number for QUIC and TCP
    listen 443 http3 reuseport; # QUIC
    listen 443 ssl;             # TCP
    
    listen [::]:443 http3 reuseport;
    listen [::]:443 ssl;

    ssl_certificate     /etc/letsencrypt/live/WEBSITE/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/WEBSITE/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/myconf.se/chain.pem;
    ssl_protocols       TLSv1.3;

    location / {
        # advertise that QUIC is available on the configured port
        add_header Alt-Svc 'h3=":$server_port"; ma=86400';

        # signal whether we are using QUIC+HTTP/3
        add_header X-protocol $server_protocol always;

        #proxy_pass <upstream_group>;
        root       /var/www/WEBSITE/html/;
    }
}
```

### Apply changes

```shell
# Restart NGINX
sudo systemctl reload nginx

# Make sure no errors were encountered
sudo nginx -t
```

### Live!

The website should now be live with QUIC+HTTP/3 enabled.

{% image "./assets/live.png", "View of website in browser", "View of website in browser" %}

### Verify

Head over to [https://www.http3check.net/](https://www.http3check.net/) to verify that QUIC and HTTP/3 are supported on your site.

{% image "./assets/verification.png", "QUIC verification", "QUIC verification" %}
