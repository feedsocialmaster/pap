-- Verificar usuarios CMS
SELECT id, email, nombre, apellido, role, 
       LEFT("passwordHash", 20) as hash_preview,
       LENGTH("passwordHash") as hash_length
FROM "User"
WHERE email IN (
  'supersu@pasoapaso.com',
  'admin@pasoapaso.com', 
  'admin.ventas@pasoapaso.com',
  'vendedor1@pasoapaso.com',
  'vendedor2@pasoapaso.com',
  'vendedor3@pasoapaso.com'
)
ORDER BY role, email;
