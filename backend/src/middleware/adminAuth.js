// Admin authentication middleware

const ADMIN_PIN = process.env.ADMIN_PIN || '1357';

export function verifyAdminPin(req, res, next) {
  const pin = req.headers['x-admin-pin'] || req.body.pin;

  if (!pin) {
    return res.status(401).json({ error: 'PIN requerido' });
  }

  if (pin !== ADMIN_PIN) {
    return res.status(403).json({ error: 'PIN incorrecto' });
  }

  next();
}

export function checkAdminPin(pin) {
  return pin === ADMIN_PIN;
}
