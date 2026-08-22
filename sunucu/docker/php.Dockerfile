# AI Koçum — php-fpm imaji
# Resmi imajda curl/openssl/json/mbstring hazir; yalnizca MariaDB surucusu
# ve opcache eklenir.
FROM php:8.3-fpm-alpine
RUN docker-php-ext-install pdo_mysql opcache \
 && printf 'opcache.enable=1\nopcache.validate_timestamps=1\nopcache.revalidate_freq=5\n' > /usr/local/etc/php/conf.d/opcache.ini \
 && printf 'expose_php=Off\ndisplay_errors=Off\nlog_errors=On\n' > /usr/local/etc/php/conf.d/guvenlik.ini
