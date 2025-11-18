-- 
-- BRAINDEMY DATABASE DEV SCHEMA
--
-- Definición de la base de datos para el proyecto académico Braindemy.
-- Este esquema está diseñado para utilizarse en Supabase + PostgreSQL.
-- Este esquema está en su estructura para desarrollo. 
-- Equipo: TecniSoft
-- Proyecto: Braindemy
--

-- Esta es una limpieza previa de la base de datos en caso que ya exista una.
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Habilita extensiones de supabase en caso de no estar disponibles.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Definición decada uno de los enums, se realiza acá para un mejor mantenimiento, orden y limpieza del script.
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student');
CREATE TYPE user_status AS ENUM ('active', 'banned', 'pending_verification');
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled');
CREATE TYPE payment_type AS ENUM ('course', 'subscription');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'cancelled');

-- TABLAS DE USUARIOS
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    birthdate DATE,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    timezone TEXT,
    status user_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    image_url TEXT,
    bio TEXT,
    specialty TEXT,
    rating NUMERIC(3,2) DEFAULT 0,
    active_courses_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    image_url TEXT,
    bio TEXT,
    academy TEXT,
    academic_level TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLAS DE SESIONES

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL
);

-- TABLAS DE SUSCRIPCIONES Y PAGOS

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    max_courses INT DEFAULT 5,
    max_students_per_course INT DEFAULT 50,
    features JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    amount NUMERIC(10,2) NOT NULL,
    type payment_type NOT NULL,
    reference TEXT,
    status payment_status DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE teacher_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status subscription_status DEFAULT 'active'
);

CREATE TABLE cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    balance NUMERIC(10,2) NOT NULL DEFAULT 0,
    label TEXT, -- nombre de la tarjeta.
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLAS DE CURSOS

CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) DEFAULT 0,
    schedule JSONB DEFAULT '{}'::jsonb,
    category TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE course_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    status enrollment_status DEFAULT 'active',
    enrolled_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(course_id, student_id)
);

CREATE TABLE course_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(course_id, student_id)
);

-- TABLAS DE SESIONES EN VIVO

CREATE TABLE live_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    session_url TEXT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE live_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- INSERCIÓN DE USUARIO PARA PRUEBAS (SOLO EN VERSIÓN PARA DESARROLLO)
INSERT INTO users (
    first_name,
    last_name,
    email,
    birthdate,
    password_hash,
    role,
    timezone,
    status
) VALUES (
    'Admin',
    'Root',
    'admin@braindemy.dev',
    '1990-01-01',
    'admin123',
    'admin',
    'America/El_Salvador',
    'active'
);