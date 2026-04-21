const catchAsync = require('../../utils/catchAsync');
const services = require('../../services/v1');

exports.create = catchAsync(async (req, res) => {
  const data = await services.user.create(req);
  res.status(201).json({ success: true, message: 'User created successfully', data });
});

exports.findAll = catchAsync(async (req, res) => {
  const {data,name} = await services.user.findAll(req);
  res.status(200).json({ success: true, message: 'Users fetched successfully', ...data, name });
});

exports.findOne = catchAsync(async (req, res) => {
  const {data,name} = await services.user.findOne(req);
  res.status(200).json({ success: true, message: 'User fetched successfully', ...data, name });
});

exports.update = catchAsync(async (req, res) => {
  const data = await services.user.update(req);
  res.status(200).json({ success: true, message: 'User updated successfully', data });
});
