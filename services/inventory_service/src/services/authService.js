
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

// Register a new user
async function registerUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    const error = new Error("Email is already registered");
    error.code = "EMAIL_ALREADY_EXISTS";
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return user;
}

// Log in an existing user
async function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // Use the same error for an unknown email and an incorrect password.
  if (!user) {
    const error = new Error("Invalid email or password");
    error.code = "INVALID_CREDENTIALS";
    throw error;
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordMatches) {
    const error = new Error("Invalid email or password");
    error.code = "INVALID_CREDENTIALS";
    throw error;
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  const token = jwt.sign(
    {
      sub: user.id,
      role: user.role,
    },
    jwtSecret,
    {
      expiresIn: "15m",
      issuer: "ticket-booking-api",
      audience: "ticket-booking-client",
    }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    token,
  };
}

module.exports = {
  registerUser,
  loginUser,
};
