-- Script para actualizar las contraseñas de las usuarias demo
-- Contraseña para todas: "pass1234"
-- Hash bcrypt: $2a$10$7zyxgi85qGhkPGkBBeqKmuzsyJNn4Qe2oso3o13a05fqKmtjNi9Se

-- Actualizar dueña
UPDATE "User"
SET "passwordHash" = '$2a$10$7zyxgi85qGhkPGkBBeqKmuzsyJNn4Qe2oso3o13a05fqKmtjNi9Se'
WHERE email = 'duena@pasoapaso.com';

-- Actualizar Ana García (PLATA)
UPDATE "User"
SET "passwordHash" = '$2a$10$7zyxgi85qGhkPGkBBeqKmuzsyJNn4Qe2oso3o13a05fqKmtjNi9Se'
WHERE email = 'clienta@example.com';

-- Actualizar María López (ORO)
UPDATE "User"
SET "passwordHash" = '$2a$10$7zyxgi85qGhkPGkBBeqKmuzsyJNn4Qe2oso3o13a05fqKmtjNi9Se'
WHERE email = 'maria.lopez@demo.com';

-- Actualizar Laura Martínez (BRONCE)
UPDATE "User"
SET "passwordHash" = '$2a$10$7zyxgi85qGhkPGkBBeqKmuzsyJNn4Qe2oso3o13a05fqKmtjNi9Se'
WHERE email = 'laura.martinez@demo.com';

-- Verificar las actualizaciones
SELECT email, nombre, apellido
FROM "User"
WHERE role = 'CLIENTA' OR role = 'DUENA'
ORDER BY email;
