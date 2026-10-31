import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OnboardingDto, UpdateProfileDto } from './dto/onboarding.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  calculateBmi(heightCm: number, weightKg: number): number {
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    return Math.round(bmi * 10) / 10;
  }

  determineFitnessLevel(pushups: number): string {
    if (pushups < 8) return 'BEGINNER';
    if (pushups < 20) return 'NOVICE';
    if (pushups < 35) return 'INTERMEDIATE';
    return 'ADVANCED';
  }

  async completeOnboarding(userId: string, dto: OnboardingDto) {
    const bmi = this.calculateBmi(dto.height, dto.weight);
    const fitnessLevel = this.determineFitnessLevel(dto.pushupBaseline);
    const injuriesStr = (dto.injuries || []).join(',');
    const equipmentStr = (dto.availableEquipment || ['BODYWEIGHT', 'CHAIR', 'TOWEL']).join(',');

    const profile = await this.prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        height: dto.height,
        weight: dto.weight,
        bmi,
        pushupBaseline: dto.pushupBaseline,
        fitnessLevel,
        primaryGoal: dto.primaryGoal,
        injuries: injuriesStr,
        availableEquipment: equipmentStr,
      },
      update: {
        height: dto.height,
        weight: dto.weight,
        bmi,
        pushupBaseline: dto.pushupBaseline,
        fitnessLevel,
        primaryGoal: dto.primaryGoal,
        injuries: injuriesStr,
        availableEquipment: equipmentStr,
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    return {
      message: 'Onboarding completed successfully',
      user,
      profile: {
        ...profile,
        injuries: profile.injuries ? profile.injuries.split(',') : [],
        availableEquipment: profile.availableEquipment ? profile.availableEquipment.split(',') : [],
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        inventory: { include: { item: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...safeUser } = user;
    return {
      ...safeUser,
      profile: user.profile
        ? {
            ...user.profile,
            injuries: user.profile.injuries ? user.profile.injuries.split(',').filter(Boolean) : [],
            availableEquipment: user.profile.availableEquipment
              ? user.profile.availableEquipment.split(',').filter(Boolean)
              : [],
          }
        : null,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.name || dto.avatar) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(dto.name ? { name: dto.name } : {}),
          ...(dto.avatar ? { avatar: dto.avatar } : {}),
        },
      });
    }

    const existingProfile = await this.prisma.profile.findUnique({ where: { userId } });
    if (existingProfile) {
      const height = dto.height ?? existingProfile.height;
      const weight = dto.weight ?? existingProfile.weight;
      const bmi = this.calculateBmi(height, weight);

      await this.prisma.profile.update({
        where: { userId },
        data: {
          ...(dto.height ? { height: dto.height } : {}),
          ...(dto.weight ? { weight: dto.weight } : {}),
          bmi,
          ...(dto.primaryGoal ? { primaryGoal: dto.primaryGoal } : {}),
          ...(dto.injuries ? { injuries: dto.injuries.join(',') } : {}),
          ...(dto.availableEquipment ? { availableEquipment: dto.availableEquipment.join(',') } : {}),
        },
      });
    }

    return this.getProfile(userId);
  }
}
