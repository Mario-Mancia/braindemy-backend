-- DATOS DE PRUEBA

-- Insertar usuarios base
INSERT INTO users (id, first_name, last_name, email, birthdate, password_hash, role)
VALUES
  (uuid_generate_v4(), 'Mario', 'Admin', 'admin@example.com', '1990-01-01', 'hashed_password', 'admin'),
  (uuid_generate_v4(), 'Laura', 'Teacher', 'laura.teacher@example.com', '1988-05-10', 'hashed_password', 'teacher'),
  (uuid_generate_v4(), 'Carlos', 'Teacher', 'carlos.teacher@example.com', '1985-11-22', 'hashed_password', 'teacher'),
  (uuid_generate_v4(), 'Ana', 'Student', 'ana.student@example.com', '2001-03-14', 'hashed_password', 'student'),
  (uuid_generate_v4(), 'Pedro', 'Student', 'pedro.student@example.com', '2002-07-30', 'hashed_password', 'student');

-- Obtener IDs generados
WITH u AS (
   SELECT id, role FROM users
)
SELECT * FROM u;

-- ===========================================
--  Insertar perfiles según rol (teachers/students)
-- ===========================================

-- Teachers
INSERT INTO teachers (id, user_id, bio, specialty)
SELECT uuid_generate_v4(), id,
       'Docente con amplia experiencia.',
       'Programación'
FROM users WHERE role = 'teacher';

-- Students
INSERT INTO students (id, user_id, bio, academy, academic_level)
SELECT uuid_generate_v4(), id,
       'Estudiante activo.',
       'Braindemy Academy',
       'Nivel Intermedio'
FROM users WHERE role = 'student';

-- ===========================================
-- Tarjetas (teacher = 500, student = 150)
-- ===========================================

INSERT INTO cards (id, user_id, label, balance)
SELECT uuid_generate_v4(), id,
       'Tarjeta principal',
       CASE 
         WHEN role = 'teacher' THEN 500
         WHEN role = 'student' THEN 150
         ELSE 0
       END
FROM users
WHERE role IN ('teacher', 'student');

-- ===============================
--   SUSCRIPCIONES
-- ===============================

INSERT INTO subscriptions (id, name, price, max_courses, max_students_per_course, features)
VALUES
  (uuid_generate_v4(), 'Plan Básico', 9.99, 5, 50, '{"support":"email"}'),
  (uuid_generate_v4(), 'Plan Premium', 29.99, 20, 500, '{"support":"priority","certificates":true}');

-- ===============================
--   PAGOS
-- ===============================

INSERT INTO payments (id, user_id, amount, type, status)
SELECT uuid_generate_v4(), id, 29.99, 'subscription', 'completed'
FROM users
WHERE role = 'teacher'
LIMIT 3;

-- ===============================
--   SUSCRIPCIONES
-- ===============================

INSERT INTO teacher_subscriptions (id, teacher_id, subscription_id, payment_id, start_date, end_date, status)
SELECT 
  uuid_generate_v4(),
  t.id,
  (SELECT id FROM subscriptions ORDER BY created_at LIMIT 1),
  (SELECT id FROM payments ORDER BY created_at LIMIT 1),
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  'active'
FROM teachers t
LIMIT 1;

-- ===============================
--   CURSOS
-- ===============================

INSERT INTO courses (id, teacher_id, title, description, price, category)
SELECT 
  uuid_generate_v4(),
  id,
  'Curso de Programación en TypeScript',
  'Aprende TypeScript desde cero',
  49.99,
  'Programación'
FROM teachers
LIMIT 1;

INSERT INTO courses (id, teacher_id, title, description, price, category)
SELECT 
  uuid_generate_v4(),
  id,
  'Curso de Bases de Datos',
  'Domina SQL y NoSQL',
  39.99,
  'Bases de Datos'
FROM teachers
OFFSET 1 LIMIT 1;

-- ===============================
--   INSCRIPCIONES A CURSOS
-- ===============================

INSERT INTO course_enrollments (id, course_id, student_id, status)
SELECT 
  uuid_generate_v4(),
  (SELECT id FROM courses LIMIT 1),
  id,
  'active'
FROM students
LIMIT 2;

-- ===============================
--   RESEÑAS DE CURSOS
-- ===============================

INSERT INTO course_reviews (id, course_id, student_id, rating, comment)
SELECT
  uuid_generate_v4(),
  (SELECT id FROM courses LIMIT 1),
  id,
  5,
  'Excelente curso!'
FROM students
LIMIT 1;

-- ===============================
--   SESIÓN EN VIVO
-- ===============================

INSERT INTO live_sessions (id, course_id, session_url, start_time)
VALUES (
  uuid_generate_v4(),
  (SELECT id FROM courses LIMIT 1),
  'https://meet.example.com/session1',
  NOW()
);

-- ===============================
--   MENSAJES EN VIVO
-- ===============================

INSERT INTO live_chat_messages (id, session_id, sender_id, message)
SELECT 
  uuid_generate_v4(),
  (SELECT id FROM live_sessions LIMIT 1),
  id,
  'Hola profesor!'
FROM users
WHERE role = 'student'
LIMIT 1;
