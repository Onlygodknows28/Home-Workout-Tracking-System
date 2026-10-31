import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CalorieType {
  DEFICIT = 'DEFICIT', // Ăn ít (Thâm hụt)
  MAINTENANCE = 'MAINTENANCE', // Ăn như mọi ngày (Duy trì)
  SURPLUS = 'SURPLUS', // Ăn no và dư dả (Thặng dư)
}

export class ExerciseLogItemDto {
  @ApiProperty({ example: 'ex-1' })
  @IsString()
  exerciseId: string;

  @ApiProperty({ example: 'Chống đẩy chuẩn' })
  @IsString()
  exerciseName: string;

  @ApiProperty({ example: 3 })
  @IsNumber()
  setsCompleted: number;

  @ApiProperty({ example: 12 })
  @IsNumber()
  repsPerSet: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  difficulty: number;
}

export class CreateWorkoutLogDto {
  @ApiProperty({ example: 'Giáo Án Thể Lực: Phát Triển Cơ Bắp Tại Nhà' })
  @IsString()
  workoutTitle: string;

  @ApiProperty({ example: '2026-08-20T08:00:00.000Z' })
  @IsString()
  startedAt: string;

  @ApiProperty({ example: '2026-08-20T08:15:30.000Z' })
  @IsString()
  completedAt: string;

  @ApiProperty({ example: 930, description: 'Total workout duration in seconds' })
  @IsNumber()
  @Min(1)
  durationSeconds: number;

  @ApiPropertyOptional({ example: 15, description: 'Estimated target duration in minutes' })
  @IsOptional()
  @IsNumber()
  estimatedDurationMin?: number;

  @ApiProperty({
    example: 2,
    description: '1: Quá Dễ (Too Easy), 2: Vừa Sức (Just Right), 3: Quá Sức/Đuối (Too Hard)',
  })
  @IsNumber()
  @Min(1)
  @Max(3)
  rpeScore: number;

  @ApiProperty({ type: [ExerciseLogItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseLogItemDto)
  exercises: ExerciseLogItemDto[];
}

export class DailyCheckinDto {
  @ApiProperty({ enum: CalorieType, example: CalorieType.MAINTENANCE })
  @IsEnum(CalorieType)
  calorieType: CalorieType;

  @ApiPropertyOptional({ example: 4, description: 'Energy level 1 to 5' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  energyLevel?: number;

  @ApiPropertyOptional({ example: 'Uống đủ 2.5 lít nước, cảm thấy tràn đầy năng lượng' })
  @IsOptional()
  @IsString()
  notes?: string;
}
