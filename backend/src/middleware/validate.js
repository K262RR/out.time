const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  
  const extractedErrors = errors.array().map(err => ({ [err.path]: err.msg }));

  throw new ApiError(422, 'Ошибка валидации данных', { details: extractedErrors });
};

module.exports = validate; 