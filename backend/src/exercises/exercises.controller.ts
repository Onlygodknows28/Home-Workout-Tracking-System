import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ExercisesService } from './exercises.service';

@ApiTags('Exercises')
@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of bodyweight/household exercises with filters' })
  @ApiQuery({ name: 'muscle', required: false })
  @ApiQuery({ name: 'equipment', required: false })
  @ApiQuery({ name: 'difficulty', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'injuries', required: false, description: 'Comma-separated injuries to filter out' })
  async findAll(
    @Query('muscle') muscle?: string,
    @Query('equipment') equipment?: string,
    @Query('difficulty') difficulty?: number,
    @Query('search') search?: string,
    @Query('injuries') injuries?: string,
  ) {
    const excludedInjuries = injuries ? injuries.split(',').map((s) => s.trim()) : undefined;
    return this.exercisesService.findAll({
      muscle,
      equipment,
      difficulty,
      search,
      excludedInjuries,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get exercise details by ID' })
  async findOne(@Param('id') id: string) {
    return this.exercisesService.findOne(id);
  }
}
