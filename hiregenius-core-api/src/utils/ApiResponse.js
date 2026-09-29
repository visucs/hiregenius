class ApiResponse {
  constructor(status, message, data = null) {
    this.status = status;
    this.message = message;
    if (data !== null && data !== undefined) {
      this.data = data;
    }
  }

  static success(res, data = null, message = 'Success', statusCode = 200) {
    const payload = {
      status: statusCode,
      message,
    };
    if (data !== null && data !== undefined) {
      payload.data = data;
    }
    return res.status(statusCode).json(payload);
  }

  static created(res, data = null, message = 'Created successfully') {
    return ApiResponse.success(res, data, message, 201);
  }
}

module.exports = ApiResponse;
