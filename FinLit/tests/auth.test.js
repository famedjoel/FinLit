/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock dependencies
jest.mock('node-fetch');
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('mockSalt'),
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn(),
}));

// Create a mock User module
const mockFindOne = jest.fn();
const mockCreate = jest.fn();
const mockFindById = jest.fn();
const mockFindByIdAndUpdate = jest.fn();

// Mock the sqlite-adapter module
jest.unstable_mockModule('../config/sqlite-adapter.js', () => ({
  connect: jest.fn().mockResolvedValue({
    get: jest.fn(),
    run: jest.fn(),
    all: jest.fn(),
  }),
  User: {
    findOne: mockFindOne,
    create: mockCreate,
    findById: mockFindById,
    findByIdAndUpdate: mockFindByIdAndUpdate,
  },
}));

// Also mock the db module
jest.unstable_mockModule('../config/db.js', () => ({
  default: jest.fn().mockResolvedValue({}),
}));

// Import the module under test after setting up all mocks
let authRoutes;

// Mock Express request/response objects
const mockRequest = (body = {}, params = {}, query = {}) => {
  return {
    body,
    params,
    query,
    headers: {},
  };
};

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Create a setup function to import the routes module
async function setupModule() {
  authRoutes = await import('../routes/authRoutes.js');
}

describe('Authentication System', () => {
  beforeAll(async () => {
    // Import the auth routes before tests
    await setupModule();
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  // Test user registration
  describe('User Registration (Signup)', () => {
    test('should successfully register a new user', async () => {
      // Arrange
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123',
      };
      const req = mockRequest(userData);
      const res = mockResponse();

      // Mock User.findOne to return null (user doesn't exist)
      mockFindOne.mockResolvedValue(null);

      // Mock User.create to return a new user
      mockCreate.mockResolvedValue({
        id: 1,
        ...userData,
        password: 'hashedPassword',
      });

      // Act
      await authRoutes.signup(req, res);

      // Assert
      expect(mockFindOne).toHaveBeenCalledWith({ email: userData.email });
      expect(mockCreate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'User registered successfully',
      }));
    });

    test('should return error if user already exists', async () => {
      // Arrange
      const userData = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'Password123',
      };
      const req = mockRequest(userData);
      const res = mockResponse();

      // Mock User.findOne to return an existing user
      mockFindOne.mockResolvedValue({
        id: 1,
        username: 'existinguser',
        email: 'existing@example.com',
      });

      // Act
      await authRoutes.signup(req, res);

      // Assert
      expect(mockFindOne).toHaveBeenCalledWith({ email: userData.email });
      expect(mockCreate).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Email already in use',
      }));
    });

    test('should handle server errors during registration', async () => {
      // Arrange
      const userData = {
        username: 'erroruser',
        email: 'error@example.com',
        password: 'Password123',
      };
      const req = mockRequest(userData);
      const res = mockResponse();

      // Mock User.findOne to throw an error
      mockFindOne.mockRejectedValue(new Error('Database connection error'));

      // Act
      await authRoutes.signup(req, res);

      // Assert
      expect(mockFindOne).toHaveBeenCalledWith({ email: userData.email });
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Server error',
      }));
    });
  });

  // Test user login
  describe('User Login', () => {
    test('should successfully login a user with valid credentials', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'Password123',
      };
      const req = mockRequest(loginData);
      const res = mockResponse();

      // Mock User.findOne to return a user
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword',
        recentActivity: [],
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
      };
      mockFindOne.mockResolvedValue(mockUser);

      // Act
      await authRoutes.login(req, res);

      // Assert
      expect(mockFindOne).toHaveBeenCalledWith({ email: loginData.email });
      expect(mockUser.comparePassword).toHaveBeenCalledWith(loginData.password);
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Login successful',
        user: expect.objectContaining({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
        }),
      }));
    });

    test('should reject login with invalid email', async () => {
      // Arrange
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'Password123',
      };
      const req = mockRequest(loginData);
      const res = mockResponse();

      // Mock User.findOne to return null (user doesn't exist)
      mockFindOne.mockResolvedValue(null);

      // Act
      await authRoutes.login(req, res);

      // Assert
      expect(mockFindOne).toHaveBeenCalledWith({ email: loginData.email });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invalid email or password',
      }));
    });

    test('should reject login with invalid password', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };
      const req = mockRequest(loginData);
      const res = mockResponse();

      // Mock User.findOne to return a user
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword',
        comparePassword: jest.fn().mockResolvedValue(false),
      };
      mockFindOne.mockResolvedValue(mockUser);

      // Act
      await authRoutes.login(req, res);

      // Assert
      expect(mockFindOne).toHaveBeenCalledWith({ email: loginData.email });
      expect(mockUser.comparePassword).toHaveBeenCalledWith(loginData.password);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invalid email or password',
      }));
    });
  });

  // Test profile management
  describe('User Profile', () => {
    test('should successfully retrieve user profile', async () => {
      // Arrange
      const req = mockRequest({}, { userId: '1' });
      const res = mockResponse();

      // Mock User.findById to return a user
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        avatar: 'avatar.png',
      };
      mockFindById.mockResolvedValue(mockUser);

      // Act
      await authRoutes.getProfile(req, res);

      // Assert
      expect(mockFindById).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    test('should return 404 for non-existent user profile', async () => {
      // Arrange
      const req = mockRequest({}, { userId: '999' });
      const res = mockResponse();

      // Mock User.findById to return null (user not found)
      mockFindById.mockResolvedValue(null);

      // Act
      await authRoutes.getProfile(req, res);

      // Assert
      expect(mockFindById).toHaveBeenCalledWith('999');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'User not found',
      }));
    });

    test('should update user profile successfully', async () => {
      // Arrange
      const updateData = {
        userId: '1',
        username: 'updateduser',
        avatar: 'new-avatar.png',
      };
      const req = mockRequest(updateData);
      const res = mockResponse();

      // Mock User.findByIdAndUpdate to return the updated user
      const updatedUser = {
        id: 1,
        username: 'updateduser',
        email: 'test@example.com',
        avatar: 'new-avatar.png',
      };
      mockFindByIdAndUpdate.mockResolvedValue(updatedUser);

      // Act
      await authRoutes.updateProfile(req, res);

      // Assert
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          username: 'updateduser',
          avatar: 'new-avatar.png',
        }),
        { new: true },
      );
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Profile updated',
        user: updatedUser,
      }));
    });
  });
});
