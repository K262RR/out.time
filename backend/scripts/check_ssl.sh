#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Загрузка переменных окружения
if [ -f ../.env ]; then
    source ../.env
else
    echo -e "${RED}❌ Файл .env не найден${NC}"
    exit 1
fi

# Проверка наличия домена
if [ -z "$DOMAIN" ]; then
    echo -e "${RED}❌ Переменная DOMAIN не установлена в .env${NC}"
    exit 1
fi

# Удаляем https:// из домена если есть
DOMAIN=$(echo $DOMAIN | sed 's|https://||')

echo -e "${YELLOW}🔍 Начинаем проверку SSL для домена $DOMAIN...${NC}\n"

# Проверка редиректа HTTP -> HTTPS
echo -e "${YELLOW}1. Проверка редиректа HTTP -> HTTPS${NC}"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN)
if [ "$HTTP_STATUS" = "301" ] || [ "$HTTP_STATUS" = "308" ]; then
    echo -e "${GREEN}✅ Редирект работает корректно (код $HTTP_STATUS)${NC}"
else
    echo -e "${RED}❌ Редирект не работает (код $HTTP_STATUS)${NC}"
fi

# Проверка HTTPS
echo -e "\n${YELLOW}2. Проверка HTTPS соединения${NC}"
HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN)
if [ "$HTTPS_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ HTTPS работает корректно${NC}"
else
    echo -e "${RED}❌ HTTPS не работает (код $HTTPS_STATUS)${NC}"
fi

# Проверка SSL сертификата
echo -e "\n${YELLOW}3. Проверка SSL сертификата${NC}"
CERT_INFO=$(openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | openssl x509 -noout -dates)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ SSL сертификат действителен${NC}"
    echo "$CERT_INFO"
else
    echo -e "${RED}❌ Проблема с SSL сертификатом${NC}"
fi

# Проверка срока действия сертификата
echo -e "\n${YELLOW}4. Проверка срока действия сертификата${NC}"
if command -v certbot &> /dev/null; then
    certbot certificates 2>/dev/null | grep "Expiry Date"
else
    echo -e "${YELLOW}⚠️ Certbot не установлен${NC}"
fi

# Проверка заголовков безопасности
echo -e "\n${YELLOW}5. Проверка заголовков безопасности${NC}"
HEADERS=$(curl -sI https://$DOMAIN)

check_header() {
    if echo "$HEADERS" | grep -i "$1" > /dev/null; then
        echo -e "${GREEN}✅ $1 настроен${NC}"
    else
        echo -e "${RED}❌ $1 отсутствует${NC}"
    fi
}

check_header "Strict-Transport-Security"
check_header "Content-Security-Policy"
check_header "X-Frame-Options"
check_header "X-Content-Type-Options"
check_header "X-XSS-Protection"

# Проверка настроек Certbot
echo -e "\n${YELLOW}6. Проверка автообновления Certbot${NC}"
if systemctl is-active --quiet certbot.timer; then
    echo -e "${GREEN}✅ Автообновление Certbot активно${NC}"
else
    echo -e "${RED}❌ Автообновление Certbot не настроено${NC}"
fi

# Проверка конфигурации nginx
echo -e "\n${YELLOW}7. Проверка конфигурации nginx${NC}"
if nginx -t &> /dev/null; then
    echo -e "${GREEN}✅ Конфигурация nginx корректна${NC}"
else
    echo -e "${RED}❌ Ошибки в конфигурации nginx${NC}"
    nginx -t
fi

echo -e "\n${YELLOW}8. Рекомендации по SSL Labs${NC}"
echo "Для полной проверки безопасности посетите:"
echo "https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"

echo -e "\n${GREEN}✅ Проверка завершена${NC}" 