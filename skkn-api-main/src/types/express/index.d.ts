import { IUserDocument } from '../../models/User.model';
import { FilterQuery } from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      /**
       * Populated bởi `authenticate` middleware sau khi xác thực JWT thành công.
       * Đã được populate đầy đủ roles và permissions để tránh query DB nhiều lần.
       */
      user: IUserDocument;

      /**
       * Populated bởi `scopeQuery` middleware.
       * Đây là bộ lọc MongoDB an toàn dựa trên dataScope của role,
       * được inject vào controllers để đảm bảo Row-Level Security.
       */
      queryFilter: FilterQuery<any>;
    }
  }
}
