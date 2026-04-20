const catchAsync = require('../../utils/catchAsync');
const { delCache } = require('../../utils/cacheManager');
const services = require('../../services/v1');
const CacheKey = 'admin-users-list:*';
const ACCESS_COOKIE_MAX_AGE = 20 * 60 * 1000;
const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

const SetUserCookies = (res, data) => {
    if (data.token) {
        res.cookie("user_auth_token", data.token, {
            httpOnly: true,
            sameSite: 'Lax',
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            maxAge: ACCESS_COOKIE_MAX_AGE
        });
    }

    if (data.refreshToken) {
        res.cookie("user_refresh_token", data.refreshToken, {
            httpOnly: false,
            sameSite: 'Lax',
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            maxAge: REFRESH_COOKIE_MAX_AGE
        });
    }
};

exports.register = catchAsync(async (req, res) => {
    await services.userAuth.register(req);
    await delCache(req, CacheKey, true);
    res.status(201).json({ success: true, message: 'User Register Successfully' });
});

exports.login = catchAsync(async (req, res) => {
    const data = await services.userAuth.login(req);
    SetUserCookies(res, data);
    res.status(200).json({ success: true, message: 'User Login Successfully', data });
});

exports.refreshToken = catchAsync(async (req, res) => {
    const data = await services.userAuth.refreshToken(req);
    SetUserCookies(res, data);
    res.status(200).json({
        success: true,
        message: 'Token Refreshed Successfully',
        data
    });
});

exports.authInfo = catchAsync(async (req, res) => {
    const data = await services.userAuth.authInfo(req);
    res.status(200).json({
        success: true,
        message: 'User Auth Info Successfully',
        data
    });
});

exports.forget = catchAsync(async (req, res) => {
    const result = await services.userAuth.forget(req);

    if (!result?.sent) {
        return res.status(404).json({
            success: false,
            message: result?.message || 'OTP not sent. Username is invalid.'
        });
    }

    res.status(200).json({
        success: true,
        message: result.message || 'OTP has been sent to your registered email or mobile number.'
    });
});

exports.verifyOtp = catchAsync(async (req, res) => {
    await services.userAuth.verifyOtp(req);
    res.status(200).json({
        success: true,
        message: 'OTP verified successfully'
    });
});

exports.resetPassword = catchAsync(async (req, res) => {
    await services.userAuth.resetPassword(req);
    res.status(200).json({
        success: true,
        message: 'Password reset successfully'
    });
});
