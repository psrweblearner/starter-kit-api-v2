const catchAsync = require('../../utils/catchAsync');
const { delCache } = require('../../utils/cacheManager');
const services = require('../../services/v1');
const CacheKey = 'admin-users-list:*'
exports.register = catchAsync(async (req, res) => {
    await services.adminAuth.register(req);
    await delCache(req, CacheKey, true);
    res.status(201).json({ success: true, message: 'Admin User Register Successfully' });
});

exports.login = catchAsync(async (req, res) => {
    const data = await services.adminAuth.login(req);
    if (data.token) {
        res.cookie("admin_auth_token", data.token, { httpOnly: true, sameSite: 'Lax', path: '/', secure: process.env.NODE_ENV === 'production', maxAge: 10 * 60 * 1000 });
    }
    if (data.refreshToken) {
        res.cookie("admin_refresh_token", data.refreshToken, { httpOnly: false, sameSite: 'Lax', path: '/', secure: process.env.NODE_ENV === 'production', maxAge: 30 * 24 * 60 * 60 * 1000 }); // 30 days
    }
    res.status(200).json({ success: true, message: 'Admin User Login Successfully', data });
});

exports.switchRole = catchAsync(async (req, res) => {
    const data = await services.adminAuth.switchRole(req);
    if (data.token) {
        res.cookie("admin_auth_token", data.token, { httpOnly: true, sameSite: 'Lax', path: '/', secure: process.env.NODE_ENV === 'production', maxAge: 10 * 60 * 1000 });
    }

    if (data.refreshToken) {
        res.cookie("admin_refresh_token", data.refreshToken, { httpOnly: false, sameSite: 'Lax', path: '/', secure: process.env.NODE_ENV === 'production', maxAge: 30 * 24 * 60 * 60 * 1000 }); // 30 days
    }
    res.status(200).json({ success: true, message: 'Admin User Switch Role Successfully', data });
});

exports.refreshToken = catchAsync(async (req, res) => {
    const data = await services.adminAuth.refreshToken(req);
    res.status(200).json({
        success: true,
        message: 'Token Refreshed Successfully',
        data
    });
});

exports.authInfo = catchAsync(async (req, res) => {
    const data = await services.adminAuth.authInfo(req);
    res.status(200).json({
        success: true,
        message: 'Admin User Auth Info Successfully',
        data
    });
});

exports.forget = catchAsync(async (req, res) => {
    const result = await services.adminAuth.forget(req);

    if (!result?.sent) {
        return res.status(404).json({
            success: false,
            message: result?.message || 'OTP not sent. Username is invalid or you are no longer assigned to admin.'
        });
    }

    res.status(200).json({
        success: true,
        message: result.message || 'OTP has been sent to your registered email or mobile number.'
    });
});

exports.verifyOtp = catchAsync(async (req, res) => {
    await services.adminAuth.verifyOtp(req);
    res.status(200).json({
        success: true,
        message: 'OTP verified successfully'
    });
});

exports.resetPassword = catchAsync(async (req, res) => {
    await services.adminAuth.resetPassword(req);
    res.status(200).json({
        success: true,
        message: 'Password reset successfully'
    });
});
