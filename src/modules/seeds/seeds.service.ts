import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Hashids from 'hashids';
import { Repository } from 'typeorm';
import { CategoryDestination } from '../destination/entities/category_destination.entity';
import { Roles } from '../users/entities/role.entity';

@Injectable()
export class SeedsService implements OnModuleInit {
  constructor(
    @InjectRepository(CategoryDestination)
    private readonly categoryDestinationRepository: Repository<CategoryDestination>,
    @InjectRepository(Roles)
    private readonly roleRepository: Repository<Roles>,
  ) {}

  async onModuleInit() {
    await this.seedRoles();
    await this.seedCategoryDestination();
  }

  async seedRoles() {
    const defaultRoles = [
      { name: 'Owner', code: 'owner', level: 100, self_register: true },
      { name: 'Admin', code: 'admin', level: 80, self_register: false },
      { name: 'Guide', code: 'guide', level: 60, self_register: false },
      { name: 'Traveller', code: 'traveller', level: 10, self_register: true },
    ];

    for (const roleData of defaultRoles) {
      const existingRole = await this.roleRepository.findOneBy({
        code: roleData.code,
      });

      if (!existingRole) {
        const newRole = this.roleRepository.create(roleData);
        await this.roleRepository.save(newRole);
        console.log(`Role ${roleData.name} created successfully.`);
      }
    }
  }

  // seed category destination
  async seedCategoryDestination() {
    const defaultCategoryDestination = [
      { name: 'Religion', code: 'religion' },
      { name: 'Adventure', code: 'adventure' },
      { name: 'Culture', code: 'culture' },
      { name: 'Traveling', code: 'traveling' },
    ];

    for (const categoryDestinationData of defaultCategoryDestination) {
      const existingCategoryDestination =
        await this.categoryDestinationRepository.findOneBy({
          code: categoryDestinationData.code,
        });

      if (!existingCategoryDestination) {
        const newCategoryDestination =
          this.categoryDestinationRepository.create(categoryDestinationData);
        await this.categoryDestinationRepository.save(newCategoryDestination);
        console.log(
          `Category Destination ${categoryDestinationData.name} created successfully.`,
        );
      }
    }
  }
}
