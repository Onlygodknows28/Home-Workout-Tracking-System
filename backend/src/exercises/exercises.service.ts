import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExercisesService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    muscle?: string;
    equipment?: string;
    difficulty?: number;
    search?: string;
    excludedInjuries?: string[];
  }) {
    const exercises = await this.prisma.exercise.findMany({
      orderBy: [{ primaryMuscle: 'asc' }, { difficulty: 'asc' }],
    });

    return exercises.filter((ex) => {
      if (params?.muscle && ex.primaryMuscle !== params.muscle) {
        return false;
      }
      if (params?.equipment && ex.equipment !== params.equipment) {
        return false;
      }
      if (params?.difficulty && ex.difficulty !== Number(params.difficulty)) {
        return false;
      }
      if (params?.search) {
        const query = params.search.toLowerCase();
        const matches =
          ex.name.toLowerCase().includes(query) ||
          ex.description.toLowerCase().includes(query) ||
          ex.primaryMuscle.toLowerCase().includes(query);
        if (!matches) return false;
      }
      if (params?.excludedInjuries && params.excludedInjuries.length > 0) {
        const contraindications = ex.contraindicatedInjuries
          ? ex.contraindicatedInjuries.split(',').map((c) => c.trim().toUpperCase())
          : [];
        const hasConflict = params.excludedInjuries.some((inj) =>
          contraindications.includes(inj.trim().toUpperCase()),
        );
        if (hasConflict) return false;
      }
      return true;
    });
  }

  async findOne(id: string) {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
    });
    if (!exercise) {
      throw new NotFoundException(`Exercise with id ${id} not found`);
    }
    return exercise;
  }
}
