import helmet from 'helmet';

/**
 * Расширенные настройки безопасности согласно OWASP рекомендациям
 */
export default function securityHeaders() {
  return [
    // Основные настройки helmet
    helmet(),
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://api.telegram.org'],
        fontSrc: ["'self'", 'https:', 'data:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'", 'https://t.me'],
      },
    }),
    helmet.dnsPrefetchControl({ allow: false }),
    helmet.frameguard({ action: 'deny' }),
    helmet.hidePoweredBy(),
    helmet.hsts({
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    }),
    helmet.ieNoOpen(),
    helmet.noSniff(),
    helmet.permittedCrossDomainPolicies(),
    helmet.referrerPolicy({ policy: 'same-origin' }),
    helmet.xssFilter(),

    // Дополнительные security headers
    (req, res, next) => {
      // Permissions Policy (бывший Feature-Policy)
      res.setHeader(
        'Permissions-Policy',
        'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
      );

      // Clear-Site-Data при выходе
      if (req.path === '/api/auth/logout') {
        res.setHeader(
          'Clear-Site-Data',
          '"cache", "cookies", "storage"'
        );
      }

      // Cache-Control
      if (req.method === 'GET') {
        res.setHeader(
          'Cache-Control',
          'no-store, max-age=0'
        );
      }

      next();
    }
  ];
} 