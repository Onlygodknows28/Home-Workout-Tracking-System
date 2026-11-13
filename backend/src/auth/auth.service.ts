import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RegisterDto, LoginDto, GoogleAuthDto } from './dto/auth.dto';
import { OAuth2Client } from 'google-auth-library';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private googleClient = new OAuth2Client();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
  ) {}

  async register(dto: RegisterDto) {
    const cleanEmail = dto.email.trim().toLowerCase();
    const cleanName = dto.name.trim();

    const existing = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (existing) {
      if (existing.authProvider === 'GOOGLE' && !existing.password) {
        throw new BadRequestException(
          'Email này đã được liên kết với tài khoản Google. Vui lòng chọn "Đăng nhập bằng Google".',
        );
      }
      throw new BadRequestException('Email đã tồn tại trong hệ thống. Vui lòng đăng nhập.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: cleanEmail,
        password: hashedPassword,
        name: cleanName,
        authProvider: 'LOCAL',
        avatar:
          dto.avatar ||
          `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`,
        fitCoins: 50, // Welcome gift coins
        streakFreezeCount: 1, // Free starting streak freeze
      },
    });

    await this.notificationsService.seedStarterNotifications(user.id);

    const token = this.generateToken(user.id, user.email);
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken: token,
      hasCompletedOnboarding: false,
    };
  }

  async login(dto: LoginDto) {
    const cleanEmail = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { profile: true },
    });
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    if (!user.password || user.authProvider === 'GOOGLE') {
      throw new UnauthorizedException(
        'Tài khoản này được đăng ký bằng Google. Vui lòng chọn "Đăng nhập bằng Google".',
      );
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    const token = this.generateToken(user.id, user.email);
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken: token,
      hasCompletedOnboarding: !!user.profile,
    };
  }

  async loginWithGoogle(dto: GoogleAuthDto) {
    let payload: any;
    try {
      const googleClientId = process.env.GOOGLE_CLIENT_ID;
      const ticket = await this.googleClient.verifyIdToken({
        idToken: dto.credential,
        audience: googleClientId || undefined,
      });
      payload = ticket.getPayload();
    } catch (err: any) {
      this.logger.error('Google token verification failed:', err);
      throw new UnauthorizedException('Xác thực tài khoản Google không hợp lệ hoặc đã hết hạn.');
    }

    if (!payload || !payload.email) {
      throw new UnauthorizedException('Không thể lấy thông tin email từ tài khoản Google.');
    }

    if (!payload.email_verified) {
      throw new BadRequestException('Email Google này chưa được xác minh.');
    }

    const email = payload.email.trim().toLowerCase();
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      // New user registration via Google
      const userName = payload.name || email.split('@')[0];
      const avatarUrl =
        payload.picture ||
        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userName)}`;

      user = await this.prisma.user.create({
        data: {
          email,
          name: userName,
          avatar: avatarUrl,
          password: null,
          authProvider: 'GOOGLE',
          fitCoins: 50,
          streakFreezeCount: 1,
        },
        include: { profile: true },
      });

      await this.notificationsService.seedStarterNotifications(user.id);
    } else if (!user.avatar && payload.picture) {
      // Update avatar if missing
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { avatar: payload.picture },
        include: { profile: true },
      });
    }

    const token = this.generateToken(user.id, user.email);
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken: token,
      hasCompletedOnboarding: !!user.profile,
    };
  }

  private generateToken(userId: string, email: string): string {
    return this.jwtService.sign(
      { sub: userId, email },
      {
        secret: process.env.JWT_SECRET || 'super-secure-thesis-jwt-secret-key-2026',
        expiresIn: process.env.JWT_EXPIRATION || '7d',
      },
    );
  }
}
