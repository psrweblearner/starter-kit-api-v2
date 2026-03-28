'use strict';

const { z } = require('zod');

/**
 * Schema for User Registration
 */
const register = z.object({
  body: z.object({
    firstName: z.string().min(3).max(50),
    lastName: z.string().min(3).max(50),
    email: z.string().email(),
    mobile: z.string().min(8).max(15),
    designation: z.string().min(3).max(50).optional(),
    about: z.string().optional(),
    address: z.string().optional(),
    password: z.string().min(8).optional(),
    profile: z.string().optional(),
  }).strict()
});

/**
 * Schema for User Login
 */
const login = z.object({
  body: z.object({
    username: z.string().refine(
      (val) =>
        z.string().email().safeParse(val).success ||
        /^[0-9]{8,15}$/.test(val),
      {
        message: "Must be a valid email or mobile number",
      }
    ),
    password: z.string().min(1),
  }),
});

const switchRole = z.object({
  body: z.object({
    userId: z.number().int().positive(),
    roleId: z.number().int().positive(),
  }),
});

const forget = z.object({
  body: z.object({
    username: z.string().refine(
      (val) =>
        z.string().email().safeParse(val).success ||
        /^[0-9]{8,15}$/.test(val),
      {
        message: "Must be a valid email or mobile number",
      }
    ),
  }),
});

const verifyOtp = z.object({
  body: z.object({
    username: z.string().refine(
      (val) =>
        z.string().email().safeParse(val).success ||
        /^[0-9]{8,15}$/.test(val),
      {
        message: "Must be a valid email or mobile number",
      }
    ),
    otp: z.string().regex(/^[0-9]{6}$/, 'OTP must be a 6-digit number'),
  }),
});

const resetPassword = z.object({
  body: z.object({
    username: z.string().refine(
      (val) =>
        z.string().email().safeParse(val).success ||
        /^[0-9]{8,15}$/.test(val),
      {
        message: "Must be a valid email or mobile number",
      }
    ),
    otp: z.string().regex(/^[0-9]{6}$/, 'OTP must be a 6-digit number'),
    password: z.string().min(8),
  }),
});

module.exports = {
  register,
  login,
  switchRole,
  forget,
  verifyOtp,
  resetPassword,
};
