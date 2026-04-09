import { Request, Response } from 'express';
import { User } from '../models/User.model';
import { Role } from '../models/Permission.model';
import mongoose from 'mongoose';

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;

    const query: any = {};
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } }
      ];
    }

    const [users, totalRecords] = await Promise.all([
      User.find(query)
        .select('-passwordHash')
        .populate('roles')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: users,
      meta: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error('[User Controller] Error in getUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
    });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, fullName, role } = req.body;

    // Validate inputs
    if (!email || !password || !fullName || !role) {
      res.status(400).json({ success: false, message: 'Vui lòng cung cấp đủ thông tin' });
      return;
    }

    if (!['ADMIN', 'STAFF'].includes(role)) {
      res.status(400).json({ success: false, message: 'Role không hợp lệ. Chỉ chấp nhận ADMIN hoặc STAFF' });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'Email đã được sử dụng' });
      return;
    }

    // Map role string to Role document
    const roleName = role === 'ADMIN' ? 'ADMIN' : 'EXECUTION_OFFICER';
    const assignedRole = await Role.findOne({ name: roleName });
    
    if (!assignedRole) {
      res.status(500).json({ success: false, message: `Hệ thống chưa tạo báo cho role: ${roleName}` });
      return;
    }

    // Assign a system unit. 
    const SYSTEM_UNIT_ID = new mongoose.Types.ObjectId('000000000000000000000001');

    // Generate random employeeId
    const employeeId = `EMP-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    const newUser = new User({
      employeeId,
      name: fullName,
      email,
      passwordHash: password, // Mongoose pre-save hook will hash this
      roles: [assignedRole._id],
      unit: SYSTEM_UNIT_ID,
      isActive: true,
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản thành công',
      data: {
        _id: newUser._id,
        email: newUser.email,
        fullName: newUser.name,
      }
    });

  } catch (error) {
    console.error('[User Controller] Error in createUser:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo tài khoản',
    });
  }
};
