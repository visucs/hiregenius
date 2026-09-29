const adminUsersService = require('./users.service');
const ApiResponse = require('../../../utils/ApiResponse');

class AdminUsersController {
  async getUserDetail(req, res, next) {
    try {
      const { id } = req.params;
      const data = await adminUsersService.getUserDetail(id);
      return ApiResponse.success(res, data, 'User details retrieved successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      await adminUsersService.deleteUser(req.user.userId, id);
      return ApiResponse.success(res, null, 'User account and associated records permanently deleted.', 200);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminUsersController();
