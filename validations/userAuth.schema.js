'use strict';

const { z } = require('zod');

/**
 * Schema for User Registration
 */
const register = z.object({
  body: z.object({
    name: z.string().min(3).max(50),
    email: z.string().email(),
    mobile: z.string().min(8).max(15),
    password: z.string().min(8).optional(),
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
  forget,
  verifyOtp,
  resetPassword,
};
