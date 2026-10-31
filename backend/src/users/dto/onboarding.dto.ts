import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PrimaryGoal {
  FAT_LOSS = 'FAT_LOSS',
  MUSCLE_GAIN = 'MUSCLE_GAIN',
  ENDURANCE = 'ENDURANCE',
  MOBILITY = 'MOBILITY',
}

export class OnboardingDto {
  @ApiProperty({ example: 175, description: 'Height in centimeters' })
  @IsNumber()
  @Min(100)
  @Max(250)
  height: number;

  @ApiProperty({ example: 68.5, description: 'Weight in kilograms' })
  @IsNumber()
  @Min(30)
  @Max(300)
  weight: number;

  @ApiProperty({ example: 18, description: 'Number of push-ups in initial baseline fitness test' })
  @IsNumber()
  @Min(0)
  @Max(200)
  pushupBaseline: number;

  @ApiProperty({ enum: PrimaryGoal, example: PrimaryGoal.MUSCLE_GAIN })
  @IsEnum(PrimaryGoal)
  primaryGoal: PrimaryGoal;

  @ApiPropertyOptional({
    example: ['KNEE', 'WRIST'],
    description: 'Array of injured body zones: WRIST, SHOULDER, KNEE, LOWER_BACK, NECK, ELBOW, ANKLE',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  injuries?: string[];

  @ApiPropertyOptional({
    example: ['BODYWEIGHT', 'CHAIR', 'TOWEL', 'BACKPACK'],
    description: 'Available household equipment',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  availableEquipment?: string[];
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Alex Nguyen' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/...' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ example: 175 })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional({ example: 70 })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({ enum: PrimaryGoal })
  @IsOptional()
  @IsEnum(PrimaryGoal)
  primaryGoal?: PrimaryGoal;

  @ApiPropertyOptional({ example: ['KNEE'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  injuries?: string[];

  @ApiPropertyOptional({ example: ['BODYWEIGHT', 'CHAIR'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  availableEquipment?: string[];
}
