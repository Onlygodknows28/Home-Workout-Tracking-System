import { Injectable, UnauthorizedException, ServiceUnavailableException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super-secure-thesis-jwt-secret-key-2026',
    });
  }

  async validate(payload: { sub: string; email: string }) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { profile: true },
      });
      if (!user) {
        throw new UnauthorizedException('User not found or token expired');
      }
      return user;
    } catch (err: any) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      // If database connection pool is exhausted or transient error occurs, return 503 instead of 401
      throw new ServiceUnavailableException('Database connection temporarily unavailable, please retry');
    }
  }
}
